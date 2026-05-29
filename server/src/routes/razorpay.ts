import { Router, Response } from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { db } from '../db';
import { authenticateToken, AuthRequest } from './auth';

const router = Router();

// Pricing catalog mapping
const prices = {
  Basic: { monthly: 1500, yearly: 15000 },
  Pro: { monthly: 4000, yearly: 40000 },
  Enterprise: { monthly: 25000, yearly: 250000 },
};

// Initialize Razorpay if keys are present
const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

const isMock = !keyId || !keySecret || keyId === 'rzp_test_placeholder' || keySecret === 'razorpay_secret_placeholder';

let razorpay: any = null;
if (!isMock) {
  try {
    razorpay = new Razorpay({
      key_id: keyId as string,
      key_secret: keySecret as string,
    });
    console.log('💳 Razorpay sandbox client initialized successfully.');
  } catch (error) {
    console.error('❌ Error initializing Razorpay SDK:', error);
  }
} else {
  console.log('ℹ️ Razorpay credentials not configured. Running in Mock Checkout Simulation mode.');
}

// Generate Razorpay Subscription Details
router.post('/create-subscription', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });
  
  const { plan, interval } = req.body;
  if (!plan || !interval) {
    return res.status(400).json({ success: false, error: 'Plan and interval are required.' });
  }

  const basePriceMap = prices[plan as 'Basic' | 'Pro' | 'Enterprise'];
  if (!basePriceMap) {
    return res.status(400).json({ success: false, error: 'Invalid plan selected.' });
  }

  const amount = basePriceMap[interval as 'monthly' | 'yearly'];
  if (!amount) {
    return res.status(400).json({ success: false, error: 'Invalid interval selected.' });
  }

  try {
    const user = await db.user.findUnique({ where: { email: req.user.email } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User record not found.' });
    }

    if (!isMock && razorpay) {
      // 1. Get or create a Plan on Razorpay
      const planName = `SubVault ${plan} ${interval}`;
      let targetPlanId = '';
      
      try {
        const plansResponse = await razorpay.plans.all({ count: 100 });
        const existingPlan = plansResponse.items.find((p: any) => 
          p.item && 
          p.item.name === planName && 
          p.item.amount === amount * 100 && 
          p.period === (interval === 'yearly' ? 'yearly' : 'monthly')
        );

        if (existingPlan) {
          targetPlanId = existingPlan.id;
        } else {
          const newPlan = await razorpay.plans.create({
            period: interval === 'yearly' ? 'yearly' : 'monthly',
            interval: 1,
            item: {
              name: planName,
              amount: amount * 100, // paise
              currency: 'INR',
              description: `SubVault premium ${plan} subscription (${interval})`
            }
          });
          targetPlanId = newPlan.id;
        }
      } catch (err: any) {
        console.error('Razorpay Plan lookup/creation error:', err);
        return res.status(500).json({ success: false, error: `Plan setup failed: ${err.message}` });
      }

      // 2. Create the Subscription on Razorpay
      try {
        // Razorpay subscriptions require total_count to specify duration
        const totalCount = interval === 'yearly' ? 1 : 12; // 1 year or 12 months
        const subscription = await razorpay.subscriptions.create({
          plan_id: targetPlanId,
          total_count: totalCount,
          quantity: 1,
          customer_notify: 1,
          notes: {
            userId: user.id,
            userEmail: user.email,
            plan,
            interval,
            amount: amount.toString()
          }
        });

        return res.json({
          success: true,
          mock: false,
          keyId: keyId,
          subscriptionId: subscription.id,
          plan,
          interval,
          amount
        });
      } catch (subErr: any) {
        console.error('Razorpay Subscription creation error:', subErr);
        return res.status(500).json({ success: false, error: `Subscription generation failed: ${subErr.message}` });
      }
    } else {
      // Return mock parameters for client overlay rendering
      return res.json({
        success: true,
        mock: true,
        subscriptionId: `sub_mock_rzp_${Math.random().toString(36).substring(2, 10)}`,
        plan,
        interval,
        amount
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Verify signature and activate subscription
router.post('/verify-subscription', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });

  const { razorpay_payment_id, razorpay_subscription_id, razorpay_signature, plan, interval } = req.body;
  
  if (!razorpay_subscription_id || !plan || !interval) {
    return res.status(400).json({ success: false, error: 'Missing required validation payloads.' });
  }

  try {
    const user = await db.user.findUnique({ where: { email: req.user.email } });
    if (!user) return res.status(404).json({ success: false, error: 'User record not found.' });

    const basePriceMap = prices[plan as 'Basic' | 'Pro' | 'Enterprise'];
    const amount = basePriceMap[interval as 'monthly' | 'yearly'];

    // If real keys are configured and it's not a mock transaction, verify using Crypto
    const isMockTx = razorpay_subscription_id.startsWith('sub_mock_rzp_') || isMock;
    
    if (!isMockTx && keySecret) {
      if (!razorpay_payment_id || !razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Payment ID and signature are required for real validation.' });
      }
      
      const text = razorpay_payment_id + '|' + razorpay_subscription_id;
      const generatedSignature = crypto
        .createHmac('sha256', keySecret)
        .update(text)
        .digest('hex');

      if (generatedSignature !== razorpay_signature) {
        return res.status(400).json({ success: false, error: 'Payment signature mismatch. Transaction failed.' });
      }
    }

    // Activate/Commit subscription in Database
    const finalPaymentId = razorpay_payment_id || `pay_mock_rzp_${Math.random().toString(36).substring(2, 10)}`;
    const finalCustId = user.stripeCustomerId || `cus_rzp_${Math.random().toString(36).substring(2, 10)}`;

    await db.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: finalCustId,
        stripeSubscriptionId: razorpay_subscription_id,
        subscriptionStatus: 'active'
      }
    });

    const billingDays = interval === 'yearly' ? 365 : 30;
    const subId = `sub_${Math.random().toString(36).substring(2, 10)}`;
    
    const newSub = await db.subscription.create({
      data: {
        id: subId,
        userId: user.id,
        userEmail: user.email,
        plan,
        status: 'Active',
        amount,
        interval,
        nextBillingDate: new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000)
      }
    });

    await db.invoice.create({
      data: {
        id: `inv_${Math.random().toString(36).substring(2, 10)}`,
        subscriptionId: subId,
        userId: user.id,
        userEmail: user.email,
        plan,
        amount,
        status: 'Paid'
      }
    });

    res.json({
      success: true,
      message: 'Subscription successfully verified and activated.',
      user: { ...user, subscriptionStatus: 'active' },
      subscription: newSub
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
