import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from './auth';

const router = Router();

// Pricing catalog mapping
const prices = {
  Basic: { monthly: 1500, yearly: 15000 },
  Pro: { monthly: 4000, yearly: 40000 },
  Enterprise: { monthly: 25000, yearly: 250000 },
};

// Handle QR payment submission and verification
router.post('/submit-payment', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });

  const { plan, interval, utr, amount } = req.body;

  if (!plan || !interval || !utr || !amount) {
    return res.status(400).json({ success: false, error: 'Parameters plan, interval, utr, and amount are required.' });
  }

  // Validate UTR format (12-digit number)
  const utrRegex = /^\d{12}$/;
  if (!utrRegex.test(utr)) {
    return res.status(400).json({ success: false, error: 'Invalid UTR format. Must be exactly 12 digits.' });
  }

  const basePriceMap = prices[plan as 'Basic' | 'Pro' | 'Enterprise'];
  if (!basePriceMap) {
    return res.status(400).json({ success: false, error: 'Invalid plan selected.' });
  }

  const expectedBase = basePriceMap[interval as 'monthly' | 'yearly'];
  if (!expectedBase) {
    return res.status(400).json({ success: false, error: 'Invalid interval selected.' });
  }

  // Calculate expected total with 18% GST (same calculation as frontend)
  const gst = Math.round(expectedBase * 0.18);
  const expectedTotal = expectedBase + gst;

  if (amount < expectedTotal) {
    return res.status(400).json({ success: false, error: `Invalid payment amount. Expected ₹${expectedTotal}.` });
  }

  try {
    const user = await db.user.findUnique({ where: { email: req.user.email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User record not found.' });
    }

    // Generate unique mock ID for the subscription
    const subId = `sub_qr_${Math.random().toString(36).substring(2, 10)}`;
    const billingDays = interval === 'yearly' ? 365 : 30;

    // Create the subscription in the database
    const subscription = await db.subscription.create({
      data: {
        id: subId,
        userId: user.id,
        userEmail: user.email,
        plan,
        status: 'Active',
        amount: expectedBase,
        interval,
        nextBillingDate: new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000)
      }
    });

    // Create the invoice
    await db.invoice.create({
      data: {
        id: `inv_qr_${Math.random().toString(36).substring(2, 10)}`,
        subscriptionId: subId,
        userId: user.id,
        userEmail: user.email,
        plan,
        amount: expectedTotal,
        status: 'Paid' // Marked paid immediately upon UTR submission
      }
    });

    // Update user profile subscription status
    await db.user.update({
      where: { id: user.id },
      data: {
        stripeSubscriptionId: subId,
        subscriptionStatus: 'active'
      }
    });

    console.log(`✅ QR Payment verified. User: ${user.email}, Plan: ${plan}, UTR: ${utr}, Amount: ₹${amount}`);

    return res.json({
      success: true,
      message: 'Payment verified and subscription activated successfully.',
      subscription
    });
  } catch (error: any) {
    console.error('Error activating subscription via QR:', error);
    return res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
