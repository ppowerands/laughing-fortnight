import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/notifications', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({ where: { userId: req.user!.id }, orderBy: { createdAt: 'desc' }, take: 30 });
    const unreadCount = await prisma.notification.count({ where: { userId: req.user!.id, isRead: false } });
    res.json({ notifications, unreadCount });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/notifications/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.update({ where: { id: req.params.id }, data: { isRead: true } });
    res.json({ message: 'Marked as read' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/addresses', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const addresses = await prisma.deliveryAddress.findMany({ where: { userId: req.user!.id } });
    res.json(addresses);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/addresses', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { label, address, area } = req.body;
    const addr = await prisma.deliveryAddress.create({ data: { userId: req.user!.id, label, address, area } });
    res.status(201).json(addr);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/addresses/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.deliveryAddress.deleteMany({ where: { id: req.params.id, userId: req.user!.id } });
    res.json({ message: 'Address deleted' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
