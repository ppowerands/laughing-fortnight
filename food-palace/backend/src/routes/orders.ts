import { Router, Response } from 'express';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

function generateOrderNumber() {
  return 'FP' + Date.now().toString().slice(-8) + Math.floor(Math.random() * 100);
}

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { items, deliveryAddress, deliveryArea, zoneId, paymentMethod, deliveryNotes } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in order' });
    const zone = zoneId ? await prisma.deliveryZone.findUnique({ where: { id: zoneId } }) : null;
    const deliveryFee = zone ? zone.deliveryFee : 0;
    const estimatedTime = zone ? zone.estimatedTime : '35-45 mins';
    let subtotal = 0;
    const orderItems = [];
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId }, include: { variants: true } });
      if (!product) return res.status(400).json({ error: `Product not found: ${item.productId}` });
      if (!product.inStock) return res.status(400).json({ error: `${product.name} is out of stock` });
      let unitPrice = product.price;
      let variantName = null;
      if (item.variantId) {
        const variant = product.variants.find((v: any) => v.id === item.variantId);
        if (variant) { unitPrice = variant.price; variantName = variant.name; }
      }
      if (item.addons && item.addons.length > 0) {
        for (const addon of item.addons) unitPrice += addon.price || 0;
      }
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      orderItems.push({ productId: product.id, variantId: item.variantId || null, name: product.name, variantName, addons: item.addons ? JSON.stringify(item.addons) : null, quantity: item.quantity, unitPrice, totalPrice });
    }
    const total = subtotal + deliveryFee;
    const order = await prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId: req.user!.id,
        paymentMethod,
        subtotal, deliveryFee, total,
        deliveryAddress, deliveryArea, deliveryNotes,
        zoneId: zoneId || null, estimatedTime,
        items: { create: orderItems },
        payment: { create: { method: paymentMethod, amount: total, status: paymentMethod === 'CASH_ON_DELIVERY' ? 'PENDING' : 'AWAITING_CONFIRMATION' } },
      },
      include: { items: true, payment: true, zone: true },
    });
    await prisma.notification.create({ data: { title: 'New Order Received', message: `Order #${order.orderNumber} placed for ₦${total.toLocaleString()}`, type: 'order', orderId: order.id } });
    res.status(201).json(order);
  } catch (err: any) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const orders = await prisma.order.findMany({ where: { userId: req.user!.id }, include: { items: true, payment: true, zone: true }, orderBy: { createdAt: 'desc' } });
    res.json(orders);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, ...(req.user!.role === 'CUSTOMER' ? { userId: req.user!.id } : {}) },
      include: { items: true, payment: true, zone: true, user: { select: { name: true, email: true, phone: true } } },
    });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/payment-made', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await prisma.payment.update({ where: { orderId: order.id }, data: { status: 'AWAITING_CONFIRMATION' } });
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'AWAITING_CONFIRMATION' } });
    res.json({ message: 'Payment confirmation sent' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentStatus, page = '1', limit = '20' } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    const [orders, total] = await Promise.all([
      prisma.order.findMany({ where, include: { items: true, payment: true, zone: true, user: { select: { name: true, email: true, phone: true } } }, orderBy: { createdAt: 'desc' }, skip: (parseInt(page as string) - 1) * parseInt(limit as string), take: parseInt(limit as string) }),
      prisma.order.count({ where }),
    ]);
    res.json({ orders, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/status', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.update({ where: { id: req.params.id }, data: { status: req.body.status as OrderStatus }, include: { user: { select: { id: true } } } });
    await prisma.notification.create({ data: { userId: order.user.id, orderId: order.id, title: 'Order Update', message: `Your order #${order.orderNumber} is now ${req.body.status.replace(/_/g, ' ')}`, type: 'order' } });
    res.json(order);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/payment', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { status, notes } = req.body;
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    await prisma.payment.update({ where: { orderId: order.id }, data: { status: status as PaymentStatus, confirmedBy: req.user!.id, confirmedAt: status === 'CONFIRMED' ? new Date() : null, notes } });
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: status as PaymentStatus, ...(status === 'CONFIRMED' ? { status: 'PREPARING' } : {}) } });
    await prisma.notification.create({ data: { userId: order.userId, orderId: order.id, title: status === 'CONFIRMED' ? 'Payment Confirmed' : 'Payment Rejected', message: status === 'CONFIRMED' ? `Payment for order #${order.orderNumber} confirmed!` : `Payment for order #${order.orderNumber} was rejected. ${notes || ''}`, type: 'payment' } });
    res.json({ message: `Payment ${status.toLowerCase()}` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
