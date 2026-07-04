import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'food-palace-secret';

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isValidPhone(phone: string) {
  return /^(\+?234|0)[789][01]\d{8}$/.test(phone.replace(/\s/g, ''));
}

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Full name is required' });
    if (name.trim().length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email address is required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
    if (!password) return res.status(400).json({ error: 'Password is required' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (phone && phone.trim() && !isValidPhone(phone)) return res.status(400).json({ error: 'Please enter a valid Nigerian phone number (e.g. 08012345678)' });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (existing) return res.status(400).json({ error: 'An account with this email already exists' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({ data: { name: name.trim(), email: email.toLowerCase().trim(), password: hashed, phone: phone?.trim() || null } });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !email.trim()) return res.status(400).json({ error: 'Email address is required' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
    if (!password) return res.status(400).json({ error: 'Password is required' });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    if (!user.isActive) return res.status(401).json({ error: 'Your account has been deactivated. Please contact support.' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id }, select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true } });
    res.json(user);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email || !isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address' });
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.json({ message: 'If this email exists, a reset link has been sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    const expiry = new Date(Date.now() + 3600000);
    await prisma.user.update({ where: { id: user.id }, data: { resetToken: token, resetExpiry: expiry } });
    res.json({ message: 'If this email exists, a reset link has been sent.', resetToken: token });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, password } = req.body;
    if (!token) return res.status(400).json({ error: 'Reset token is required' });
    if (!password || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    const user = await prisma.user.findFirst({ where: { resetToken: token, resetExpiry: { gt: new Date() } } });
    if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });
    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed, resetToken: null, resetExpiry: null } });
    res.json({ message: 'Password reset successful' });
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

router.put('/profile', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
    if (name.trim().length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' });
    if (phone && phone.trim() && !isValidPhone(phone)) return res.status(400).json({ error: 'Please enter a valid Nigerian phone number' });
    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { name: name.trim(), phone: phone?.trim() || null }, select: { id: true, name: true, email: true, phone: true, role: true } });
    res.json(user);
  } catch (err: any) { res.status(500).json({ error: err.message }); }
});

export default router;
