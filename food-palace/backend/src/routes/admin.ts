import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/dashboard', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const [totalOrders, todayOrders, monthOrders, totalRevenue, todayRevenue, pendingPayments, totalProducts, totalUsers, recentOrders, topProducts] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { createdAt: { gte: thisMonth } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
      prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: today }, status: { not: 'CANCELLED' } } }),
      prisma.order.count({ where: { paymentStatus: 'AWAITING_CONFIRMATION' } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.findMany({ take: 10, orderBy: { createdAt: 'desc' }, include: { user: { select: { name: true, email: true } }, items: true } }),
      prisma.orderItem.groupBy({ by: ['productId', 'name'], _sum: { quantity: true, totalPrice: true }, orderBy: { _sum: { quantity: 'desc' } }, take: 5 }),
    ]);
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(); date.setDate(date.getDate() - i); date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date); nextDate.setDate(nextDate.getDate() + 1);
      const dayRevenue = await prisma.order.aggregate({ _sum: { total: true }, where: { createdAt: { gte: date, lt: nextDate }, status: { not: 'CANCELLED' } } });
      last7Days.push({ date: date.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric' }), revenue: dayRevenue._sum.total || 0, orders: await prisma.order.count({ where: { createdAt: { gte: date, lt: nextDate } } }) });
    }
    res.json({ stats: { totalOrders, todayOrders, monthOrders, totalRevenue: totalRevenue._sum.total || 0, todayRevenue: todayRevenue._sum.total || 0, pendingPayments, totalProducts, totalUsers }, recentOrders, topProducts, revenueChart: last7Days });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/users', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true }, orderBy: { createdAt: 'desc' } });
    res.json(users);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/users/:id/toggle', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const updated = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: !user.isActive } });
    res.json({ isActive: updated.isActive });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Only show unread notifications
router.get('/notifications', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: null, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { order: { select: { orderNumber: true, total: true } } }
    });
    const unreadCount = notifications.length;
    res.json({ notifications, unreadCount });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/notifications/:id/read', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ message: 'Marked as read' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/notifications/read-all', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({ where: { userId: null, isRead: false }, data: { isRead: true } });
    res.json({ message: 'All marked as read' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/account', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const admin = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!admin) return res.status(404).json({ error: 'Account not found' });
    if (currentPassword) {
      const valid = await bcrypt.compare(currentPassword, admin.password);
      if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    }
    const updateData: any = {};
    if (email && email !== admin.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) return res.status(400).json({ error: 'Email already in use' });
      updateData.email = email;
    }
    if (newPassword) {
      if (newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      updateData.password = await bcrypt.hash(newPassword, 12);
    }
    const updated = await prisma.user.update({ where: { id: req.user!.id }, data: updateData, select: { id: true, name: true, email: true, role: true } });
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;

// Order History - completed/delivered/cancelled orders
router.get('/order-history', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { search, status, paymentStatus, fulfillmentType, startDate, endDate, page = '1', limit = '20' } = req.query;
    
    const where: any = {
      status: { in: ['DELIVERED', 'CANCELLED', 'PICKED_UP'] },
    };

    if (status) where.status = status;
    if (paymentStatus) where.paymentStatus = paymentStatus;
    if (fulfillmentType) {
      if (fulfillmentType === 'PICKUP') {
        where.OR = [{ fulfillmentType: 'PICKUP' }, { deliveryAddress: { contains: 'PICKUP' } }];
      } else {
        where.fulfillmentType = 'DELIVERY';
        where.NOT = { deliveryAddress: { contains: 'PICKUP' } };
      }
    }
    if (startDate) where.createdAt = { ...where.createdAt, gte: new Date(startDate as string) };
    if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate as string) };
    if (search) {
      where.OR = [
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { user: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: { items: true, payment: true, user: { select: { name: true, email: true, phone: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit as string),
      }),
      prisma.order.count({ where }),
    ]);

    res.json({ orders, total, page: parseInt(page as string), totalPages: Math.ceil(total / parseInt(limit as string)) });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Customers with stats
router.get('/customers', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { search } = req.query;
    const where: any = { role: 'CUSTOMER' };
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const customers = await prisma.user.findMany({
      where,
      select: {
        id: true, name: true, email: true, phone: true,
        isActive: true, createdAt: true,
        orders: {
          select: { total: true, createdAt: true, status: true },
          orderBy: { createdAt: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = customers.map(c => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      isActive: c.isActive,
      createdAt: c.createdAt,
      totalOrders: c.orders.length,
      totalSpent: c.orders.filter(o => o.status !== 'CANCELLED').reduce((sum, o) => sum + o.total, 0),
      lastOrderDate: c.orders[0]?.createdAt || null,
    }));

    res.json(result);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// System health + DB stats (super admin only)
router.get('/system-health', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [totalOrders, totalCustomers, totalProducts, totalCategories, revenueData, pendingPayments] = await Promise.all([
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ['CANCELLED'] } } }),
      prisma.order.count({ where: { paymentStatus: 'AWAITING_CONFIRMATION' } }),
    ]);

    res.json({
      database: { totalOrders, totalCustomers, totalProducts, totalCategories, totalRevenue: revenueData._sum.total || 0, pendingPayments },
      system: { backend: 'operational', database: 'connected', api: 'operational', timestamp: new Date().toISOString() },
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message, system: { backend: 'error', database: 'error', api: 'error' } });
  }
});

// Clear test data (super admin only)
router.delete('/maintenance/clear-test-orders', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const testOrders = await prisma.order.findMany({
      where: { status: 'CANCELLED', paymentStatus: { in: ['PENDING', 'REJECTED'] } },
      select: { id: true },
    });
    const ids = testOrders.map(o => o.id);
    await prisma.notification.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.orderItem.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.payment.deleteMany({ where: { orderId: { in: ids } } });
    await prisma.order.deleteMany({ where: { id: { in: ids } } });
    res.json({ message: `Cleared ${ids.length} cancelled test orders` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/maintenance/clear-notifications', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.notification.deleteMany({ where: { isRead: true } });
    res.json({ message: `Cleared ${result.count} read notifications` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});
