import { Router, Response } from 'express';
import { PrismaClient, OrderStatus, PaymentStatus } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

async function generateOrderNumber() {
  const count = await prisma.order.count();
  return `FP${String(count + 1).padStart(4, '0')}`;
}

router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { items, deliveryAddress, deliveryArea, zoneId, paymentMethod, deliveryNotes, fulfillmentType } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: 'No items in order' });

    const isPickup = fulfillmentType === 'PICKUP';
    const zone = (!isPickup && zoneId) ? await prisma.deliveryZone.findUnique({ where: { id: zoneId } }) : null;
    const deliveryFee = zone ? zone.deliveryFee : 0;
    const estimatedTime = zone ? zone.estimatedTime : isPickup ? 'Ready for pickup in 20-30 mins' : '35-45 mins';

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
    const orderNumber = await generateOrderNumber();

    // ✅ FIX 1: Set auto-cancel for ALL bank transfers (pickup + delivery)
    const autoCancel = paymentMethod === 'BANK_TRANSFER' ? new Date(Date.now() + 30 * 60 * 1000) : null;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: req.user!.id,
        paymentMethod,
        paymentStatus: 'AWAITING_CONFIRMATION', // ✅ FIX 2: Set to AWAITING_CONFIRMATION
        subtotal,
        deliveryFee,
        total,
        deliveryAddress: deliveryAddress || 'PICKUP',
        deliveryArea,
        deliveryNotes,
        zoneId: zone?.id || null,
        estimatedTime,
        autoCancelAt: autoCancel,
        fulfillmentType: fulfillmentType || 'DELIVERY',
        items: { create: orderItems },
        payment: {
          create: {
            method: paymentMethod,
            amount: total,
            status: 'AWAITING_CONFIRMATION' // ✅ FIX 3: Payment status also AWAITING_CONFIRMATION
          }
        },
      },
      include: { items: true, payment: true, zone: true },
    });

    await prisma.notification.create({ data: { title: 'New Order Received', message: `Order #${order.orderNumber} placed for ₦${total.toLocaleString()} (${isPickup ? 'Pickup' : 'Delivery'})`, type: 'order', orderId: order.id } });
    res.status(201).json(order);
  } catch (err: any) { console.error(err); res.status(500).json({ error: err.message }); }
});

router.get('/my', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.order.updateMany({
      where: { autoCancelAt: { lt: new Date() }, paymentStatus: 'AWAITING_CONFIRMATION', status: { notIn: ['CANCELLED', 'DELIVERED'] } },
      data: { status: 'CANCELLED', paymentStatus: 'REJECTED' },
    });
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
    if (order.status === 'CANCELLED') return res.status(400).json({ error: 'This order has been cancelled' });
    await prisma.payment.update({ where: { orderId: order.id }, data: { status: 'AWAITING_CONFIRMATION' } });
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: 'AWAITING_CONFIRMATION' } });
    await prisma.notification.create({ data: { title: 'Payment Claimed', message: `Customer claimed payment for order #${order.orderNumber} — ₦${order.total.toLocaleString()}. Please verify!`, type: 'payment', orderId: order.id } });
    res.json({ message: 'Payment confirmation sent to admin' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const order = await prisma.order.findFirst({ where: { id: req.params.id, userId: req.user!.id } });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (['DELIVERED', 'OUT_FOR_DELIVERY'].includes(order.status)) return res.status(400).json({ error: 'This order can no longer be cancelled' });
    if (order.paymentStatus === 'CONFIRMED') return res.status(400).json({ error: 'Cannot cancel a confirmed payment order' });
    await prisma.order.update({ where: { id: order.id }, data: { status: 'CANCELLED' } });
    res.json({ message: 'Order cancelled' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.order.updateMany({
      where: { autoCancelAt: { lt: new Date() }, paymentStatus: 'AWAITING_CONFIRMATION', status: { notIn: ['CANCELLED', 'DELIVERED'] } },
      data: { status: 'CANCELLED', paymentStatus: 'REJECTED' },
    });
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
    await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: status as PaymentStatus, autoCancelAt: null, ...(status === 'CONFIRMED' ? { status: 'PREPARING' } : status === 'REJECTED' ? { status: 'CANCELLED' } : {}) } });

    await prisma.notification.updateMany({ where: { orderId: order.id, userId: null }, data: { isRead: true } });

    await prisma.notification.create({ data: { userId: order.userId, orderId: order.id, title: status === 'CONFIRMED' ? '✅ Payment Confirmed!' : '❌ Payment Rejected', message: status === 'CONFIRMED' ? `Payment for order #${order.orderNumber} confirmed! We are now preparing your order.` : `Payment for order #${order.orderNumber} was rejected. ${notes || 'Please contact us via WhatsApp.'}`, type: 'payment' } });
    res.json({ message: `Payment ${status.toLowerCase()}` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
