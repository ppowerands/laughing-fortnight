import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    let settings = await prisma.restaurantSettings.findFirst();
    if (!settings) settings = await prisma.restaurantSettings.create({ data: { name: 'Food Palace Restaurant' } });
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const isOpenNow = settings.manualOverride ? settings.isOpen : currentTime >= settings.openTime && currentTime <= settings.closeTime;
    res.json({ ...settings, isOpenNow });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.restaurantSettings.findFirst();
    const settings = existing
      ? await prisma.restaurantSettings.update({ where: { id: existing.id }, data: req.body })
      : await prisma.restaurantSettings.create({ data: req.body });
    res.json(settings);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
