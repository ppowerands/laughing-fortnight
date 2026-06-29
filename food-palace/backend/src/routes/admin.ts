import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

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

router.get('/notifications', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: null }, orderBy: { createdAt: 'desc' }, take: 50, include: { order: { select: { orderNumber: true, total: true } } } });
    const unreadCount = await prisma.notification.count({ where: { userId: null, isRead: false } });
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

export default router;
