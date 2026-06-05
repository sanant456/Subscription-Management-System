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

  // Validate plan tier selection
  const prices: Record<string, Record<string, number>> = {
    Basic: { monthly: 1500, yearly: 15000 },
    Pro: { monthly: 4000, yearly: 40000 },
    Enterprise: { monthly: 25000, yearly: 250000 },
  };
  if (!prices[plan]) {
    return res.status(400).json({ success: false, error: `Invalid plan tier selection. Supported tiers: ${Object.keys(prices).join(', ')}` });
  }

  // Validate interval selection
  if (interval !== 'monthly' && interval !== 'yearly') {
    return res.status(400).json({ success: false, error: 'Invalid billing interval. Must be either monthly or yearly.' });
  }

  // Validate authorization bounds on the email parameter
  if (req.user.role !== 'ADMIN' && req.user.email !== email) {
    return res.status(403).json({ success: false, error: 'Forbidden. You can only create subscriptions for your authenticated email address.' });
  }

  const amount = prices[plan][interval];
  const billingDays = interval === 'yearly' ? 365 : 30;

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
        nextBillingDate: new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000)
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

  // Validate request parameters against the pricing model
  if (!prices[plan as 'Basic' | 'Pro' | 'Enterprise']) {
    return res.status(400).json({ success: false, error: 'Invalid plan name.' });
  }
  if (interval !== 'monthly' && interval !== 'yearly') {
    return res.status(400).json({ success: false, error: 'Invalid billing interval.' });
  }

  try {
    const sub = await db.subscription.findFirst({ where: { id: req.params.id } });
    if (!sub) return res.status(404).json({ success: false, error: 'Subscription record not found.' });

    if (req.user.role !== 'ADMIN' && sub.userId !== req.user.id) {
      return res.status(403).json({ success: false, error: 'Forbidden transaction.' });
    }

    const oldPrice = prices[sub.plan as 'Basic' | 'Pro' | 'Enterprise']?.[sub.interval as 'monthly' | 'yearly'] || 0;
    const newPrice = prices[plan as 'Basic' | 'Pro' | 'Enterprise']?.[interval as 'monthly' | 'yearly'] || 0;

    // Dynamic Proration Math: Compute time remaining in the current cycle
    const now = Date.now();
    const nextBilling = new Date(sub.nextBillingDate).getTime();
    const oldIntervalDays = sub.interval === 'yearly' ? 365 : 30;
    const cycleDurationMs = oldIntervalDays * 24 * 60 * 60 * 1000;
    
    const remainingMs = nextBilling - now;
    const remainingProportion = Math.max(0, Math.min(1, remainingMs / cycleDurationMs));
    
    const credit = Math.round((oldPrice * remainingProportion) * 100) / 100;
    const dueToday = Math.max(0, newPrice - credit);

    const newIntervalDays = interval === 'yearly' ? 365 : 30;
    const updated = await db.subscription.update({
      where: { id: req.params.id },
      data: {
        plan,
        interval,
        amount: newPrice,
        nextBillingDate: new Date(Date.now() + newIntervalDays * 24 * 60 * 60 * 1000)
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
