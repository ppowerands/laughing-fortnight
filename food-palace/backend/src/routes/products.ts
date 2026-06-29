import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { category, search, featured } = req.query;
    const where: any = { isActive: true };
    if (category) where.category = { slug: category as string };
    if (featured === 'true') where.isFeatured = true;
    if (search) where.name = { contains: search as string, mode: 'insensitive' };
    const products = await prisma.product.findMany({
      where,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
        addons: { where: { isActive: true } },
      },
      orderBy: [{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });
    res.json(products);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/favorites/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user!.id },
      include: { product: { include: { category: true, variants: true } } },
    });
    res.json(favorites.map(f => f.product));
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
      include: { category: true, variants: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } }, addons: { where: { isActive: true } } },
    });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, categoryId, image, hasVariants, isFeatured, variants, addons } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + Date.now();
    const product = await prisma.product.create({
      data: {
        name, description, price: parseFloat(price), categoryId, image,
        hasVariants: hasVariants || false, isFeatured: isFeatured || false, slug,
        variants: variants ? { create: variants.map((v: any, i: number) => ({ name: v.name, price: parseFloat(v.price), sortOrder: i })) } : undefined,
        addons: addons ? { create: addons.map((a: any) => ({ name: a.name, price: parseFloat(a.price || 0) })) } : undefined,
      },
      include: { variants: true, addons: true, category: true },
    });
    res.status(201).json(product);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { name, description, price, categoryId, image, hasVariants, isFeatured, isActive, inStock } = req.body;
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: { name, description, price: price ? parseFloat(price) : undefined, categoryId, image, hasVariants, isFeatured, isActive, inStock },
      include: { variants: true, addons: true, category: true },
    });
    res.json(product);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ message: 'Product deleted' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.patch('/:id/stock', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const product = await prisma.product.update({ where: { id: req.params.id }, data: { inStock: req.body.inStock } });
    res.json(product);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/variants', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const variant = await prisma.productVariant.create({ data: { productId: req.params.id, name: req.body.name, price: parseFloat(req.body.price) } });
    res.status(201).json(variant);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/variants/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const variant = await prisma.productVariant.update({ where: { id: req.params.id }, data: { name: req.body.name, price: req.body.price ? parseFloat(req.body.price) : undefined, isActive: req.body.isActive } });
    res.json(variant);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.delete('/variants/:id', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.productVariant.delete({ where: { id: req.params.id } });
    res.json({ message: 'Variant deleted' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/addons', authenticate, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const addon = await prisma.productAddon.create({ data: { productId: req.params.id, name: req.body.name, price: parseFloat(req.body.price || 0) } });
    res.status(201).json(addon);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/:id/favorite', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.favorite.findUnique({ where: { userId_productId: { userId: req.user!.id, productId: req.params.id } } });
    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return res.json({ favorited: false });
    }
    await prisma.favorite.create({ data: { userId: req.user!.id, productId: req.params.id } });
    res.json({ favorited: true });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
