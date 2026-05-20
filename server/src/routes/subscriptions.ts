import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from './auth';

const router = Router();

// Retrieve all subscriptions
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false });

  try {
    const list = await db.subscription.findMany({
      where: req.user.role === 'ADMIN' ? undefined : { userId: req.user.id }
    });
    res.json({ success: true, subscriptions: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Create subscription record
router.post('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false });
  const { email, plan, interval } = req.body;

  if (!email || !plan || !interval) {
    return res.status(400).json({ success: false, error: 'Parameters email, plan, and interval are required.' });
  }

  const prices = { Basic: 1500, Pro: 4000, Enterprise: 25000 };
  const basePrice = prices[plan as 'Basic' | 'Pro' | 'Enterprise'] || 0;
  const amount = interval === 'yearly' ? basePrice * 10 : basePrice;

  try {
    const subId = `sub_${Math.random().toString(36).substring(2, 10)}`;
    const newSub = await db.subscription.create({
      data: {
        id: subId,
        userId: req.user.id,
        userEmail: email,
        plan,
        status: 'Active',
        amount,
        interval,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Create corresponding initial invoice
    const invId = `inv_${Math.random().toString(36).substring(2, 10)}`;
    await db.invoice.create({
      data: {
        id: invId,
        subscriptionId: subId,
        userId: req.user.id,
        userEmail: email,
        plan,
        amount,
        status: 'Paid'
      }
    });

    res.status(201).json({ success: true, subscription: newSub });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update status transition
router.patch('/:id/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false });
  const { status } = req.body;

  if (!status) return res.status(400).json({ success: false, error: 'Transition status required.' });

  try {
    const sub = await db.subscription.findFirst({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found.' });

    // Validate access bounds
    if (req.user.role !== 'ADMIN' && sub.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access unauthorized.' });
    }

    const updated = await db.subscription.update({
      where: { id: req.params.id },
      data: { status }
    });

    res.json({ success: true, subscription: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Prorated plan migration
router.post('/:id/migrate', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false });
  const { plan, interval } = req.body;

  if (!plan || !interval) {
    return res.status(400).json({ success: false, error: 'Parameters plan and interval are required.' });
  }

  const prices = {
    Basic: { monthly: 1500, yearly: 15000 },
    Pro: { monthly: 4000, yearly: 40000 },
    Enterprise: { monthly: 25000, yearly: 250000 },
  };

  try {
    const sub = await db.subscription.findFirst({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription record not found.' });

    if (req.user.role !== 'ADMIN' && sub.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden transaction.' });
    }

    const oldPrice = prices[sub.plan as 'Basic' | 'Pro' | 'Enterprise']?.[sub.interval as 'monthly' | 'yearly'] || 0;
    const newPrice = prices[plan as 'Basic' | 'Pro' | 'Enterprise']?.[interval as 'monthly' | 'yearly'] || 0;

    // Proration math (Simulate 50% remaining in month cycle)
    const credit = Math.round((oldPrice * 0.5) * 100) / 100;
    const dueToday = Math.max(0, newPrice - credit);

    const updated = await db.subscription.update({
      where: { id: req.params.id },
      data: {
        plan,
        interval,
        amount: newPrice,
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      }
    });

    // Generate charge invoice for this upgrade/downgrade event
    const invId = `inv_${Math.random().toString(36).substring(2, 10)}`;
    await db.invoice.create({
      data: {
        id: invId,
        subscriptionId: sub.id,
        userId: sub.userId,
        userEmail: sub.userEmail,
        plan,
        amount: dueToday,
        status: 'Paid'
      }
    });

    res.json({
      success: true,
      subscription: updated,
      proration: {
        oldPrice,
        newPrice,
        credit,
        dueToday
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Delete subscription
router.delete('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false });

  try {
    const sub = await db.subscription.findFirst({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription not found.' });

    if (req.user.role !== 'ADMIN' && sub.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Access unauthorized.' });
    }

    await db.subscription.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Subscription record deleted.' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Retrieve invoices history
router.get('/invoices', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false });

  try {
    const list = await db.invoice.findMany({
      where: req.user.role === 'ADMIN' ? undefined : { userId: req.user.id }
    });
    res.json({ success: true, invoices: list });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
