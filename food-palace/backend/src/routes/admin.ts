import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, requireSuperAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// ─── HELPER: Create Admin Log ─────────────────────────────────────────
async function createAdminLog(userId: string, action: string, details?: any, ip?: string, userAgent?: string) {
  return prisma.adminLog.create({
    data: { userId, action, details, ip, userAgent },
  });
}

// ─── DASHBOARD ─────────────────────────────────────────────────────────
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

// ─── SYSTEM HEALTH ────────────────────────────────────────────────────
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

// ─── PRODUCTION MONITORING ───────────────────────────────────────────
router.get('/production/health', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [orders, payments, users, revenue] = await Promise.all([
      prisma.order.count(),
      prisma.payment.count(),
      prisma.user.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { notIn: ['CANCELLED'] } } }),
    ]);
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      lastDeploy: process.env.VERCEL_GIT_COMMIT_AT || new Date().toISOString(),
      stats: { orders, payments, users, revenue: revenue._sum.total || 0 },
    });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── USERS ────────────────────────────────────────────────────────────
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
    await createAdminLog(req.user!.id, 'USER_TOGGLED', { userId: req.params.id, isActive: updated.isActive }, req.ip, req.headers['user-agent']);
    res.json({ isActive: updated.isActive });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────
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

// ─── ADMIN ACCOUNT ────────────────────────────────────────────────────
router.put('/account', authenticate, requireSuperAdmin, async (req: AuthRequest, res: Response) => {
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
    await createAdminLog(req.user!.id, 'ACCOUNT_UPDATED', { email: updated.email }, req.ip, req.headers['user-agent']);
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── LOGS ────────────────────────────────────────────────────────────
router.get('/logs', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { action, limit = '50' } = req.query;
    const where: any = {};
    if (action) where.action = action;
    const logs = await prisma.adminLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      include: { user: { select: { name: true, email: true } } },
    });
    res.json(logs);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── FEATURE FLAGS ────────────────────────────────────────────────────
router.get('/flags', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const flags = await prisma.featureFlag.findMany();
    res.json(flags);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/flags/:key/toggle', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { key } = req.params;
    const flag = await prisma.featureFlag.findUnique({ where: { key } });
    if (!flag) return res.status(404).json({ error: 'Flag not found' });
    const updated = await prisma.featureFlag.update({
      where: { key },
      data: { enabled: !flag.enabled },
    });
    await createAdminLog(req.user!.id, 'FEATURE_TOGGLED', { key, enabled: updated.enabled }, req.ip, req.headers['user-agent']);
    res.json(updated);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// ─── MAINTENANCE ──────────────────────────────────────────────────────

// Clear test orders
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
    const result = await prisma.order.deleteMany({ where: { id: { in: ids } } });
    await createAdminLog(req.user!.id, 'CLEAR_TEST_ORDERS', { count: result.count }, req.ip, req.headers['user-agent']);
    res.json({ message: `Cleared ${result.count} cancelled test orders` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Clear test payments
router.delete('/maintenance/clear-test-payments', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.payment.deleteMany({
      where: { status: 'PENDING', order: { status: 'CANCELLED' } },
    });
    await createAdminLog(req.user!.id, 'CLEAR_TEST_PAYMENTS', { count: result.count }, req.ip, req.headers['user-agent']);
    res.json({ message: `Cleared ${result.count} test payments` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Clear test customers
router.delete('/maintenance/clear-test-customers', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const testUsers = await prisma.user.findMany({
      where: { role: 'CUSTOMER', orders: { none: {} } },
      select: { id: true },
    });
    const ids = testUsers.map(u => u.id);
    const result = await prisma.user.deleteMany({ where: { id: { in: ids } } });
    await createAdminLog(req.user!.id, 'CLEAR_TEST_CUSTOMERS', { count: result.count }, req.ip, req.headers['user-agent']);
    res.json({ message: `Cleared ${result.count} test customers with no orders` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Clear notifications
router.delete('/maintenance/clear-notifications', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const result = await prisma.notification.deleteMany({ where: { isRead: true } });
    await createAdminLog(req.user!.id, 'CLEAR_READ_NOTIFICATIONS', { count: result.count }, req.ip, req.headers['user-agent']);
    res.json({ message: `Cleared ${result.count} read notifications` });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Clear cache (placeholder — you can connect Redis later)
router.delete('/maintenance/clear-cache', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await createAdminLog(req.user!.id, 'CLEAR_CACHE', {}, req.ip, req.headers['user-agent']);
    res.json({ message: 'Cache cleared successfully' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

// Recalculate dashboard stats
router.post('/maintenance/recalculate-stats', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const [totalOrders, totalRevenue, totalProducts, totalCustomers] = await Promise.all([
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
      prisma.product.count({ where: { isActive: true } }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
    ]);
    await createAdminLog(req.user!.id, 'RECALCULATED_STATS', { totalOrders, totalRevenue: totalRevenue._sum.total || 0, totalProducts, totalCustomers }, req.ip, req.headers['user-agent']);
    res.json({ message: 'Stats recalculated', stats: { totalOrders, totalRevenue: totalRevenue._sum.total || 0, totalProducts, totalCustomers } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
