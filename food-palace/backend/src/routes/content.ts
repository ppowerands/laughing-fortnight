import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

const DEFAULT_CONTENT: Record<string, string> = {
  hero_badge: 'Open Now • Fast Delivery',
  hero_heading_1: 'Authentic',
  hero_heading_2: 'Nigerian',
  hero_heading_3: 'Cuisine',
  hero_description: 'From smoky Jollof Rice to fresh Shawarmas — order your favourite Nigerian meals and get them delivered hot to your door.',
  footer_description: 'Bringing you the finest Nigerian cuisine with love and dedication. Every meal crafted to perfection.',
  why_us_title: 'Why Choose Food Palace?',
  why_us_subtitle: "Committed to the best Nigerian food experience",
};

router.get('/', async (req: Request, res: Response) => {
  try {
    const items = await prisma.siteContent.findMany();
    const content: Record<string, string> = { ...DEFAULT_CONTENT };
    items.forEach(item => { content[item.key] = item.value; });
    res.json(content);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const results = [];
    for (const [key, value] of Object.entries(updates)) {
      const updated = await prisma.siteContent.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string },
      });
      results.push(updated);
    }
    res.json({ message: 'Content updated', results });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
