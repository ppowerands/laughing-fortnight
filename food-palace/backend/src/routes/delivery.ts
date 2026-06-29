import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/zones', async (req: Request, res: Response) => {
  try {
    const zones = await prisma.deliveryZone.findMany({ where: { isActive: true }, include: { areas: true }, orderBy: { name: 'asc' } });
    res.json(zones);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/zones', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, deliveryFee, estimatedTime, areas } = req.body;
    const zone = await prisma.deliveryZone.create({
      data: { name, deliveryFee: parseFloat(deliveryFee), estimatedTime, areas: areas ? { create: areas.map((a: string) => ({ name: a })) } : undefined },
      include: { areas: true },
    });
    res.status(201).json(zone);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/zones/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, deliveryFee, estimatedTime, isActive } = req.body;
    const zone = await prisma.deliveryZone.update({ where: { id: req.params.id }, data: { name, deliveryFee: deliveryFee ? parseFloat(deliveryFee) : undefined, estimatedTime, isActive }, include: { areas: true } });
    res.json(zone);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/zones/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.deliveryZone.delete({ where: { id: req.params.id } });
    res.json({ message: 'Zone deleted' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/zones/:id/areas', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const area = await prisma.deliveryArea.create({ data: { name: req.body.name, zoneId: req.params.id } });
    res.status(201).json(area);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/areas/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.deliveryArea.delete({ where: { id: req.params.id } });
    res.json({ message: 'Area deleted' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
