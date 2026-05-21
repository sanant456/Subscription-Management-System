import { Router, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { authenticateToken, AuthRequest } from './auth';

const router = Router();

// Pricing catalog mapping
const prices = {
  Basic: { monthly: 1500, yearly: 15000 },
  Pro: { monthly: 4000, yearly: 40000 },
  Enterprise: { monthly: 25000, yearly: 250000 },
};

// Initialize Stripe if secret is present
const stripeSecret = process.env.STRIPE_SECRET_KEY;
let stripe: any = null;
if (stripeSecret && stripeSecret !== 'sk_test_placeholder') {
  stripe = new Stripe(stripeSecret, {
    apiVersion: '2023-10-16' as any,
  });
  console.log('💳 Stripe payment client initialized successfully.');
} else {
  console.log('ℹ️ Stripe credentials not configured. Running in Mock Checkout Simulation mode.');
}

// Helper to get or create product/price dynamically on Stripe
async function getOrCreatePriceId(stripeInstance: any, plan: string, interval: 'monthly' | 'yearly', amount: number): Promise<string> {
  const prodName = `SubVault ${plan}`;
  
  // 1. Search products
  const products = await stripeInstance.products.list({ limit: 100 });
  let product = products.data.find((p: any) => p.name === prodName);
  
  if (!product) {
    product = await stripeInstance.products.create({
      name: prodName,
      description: `Premium ${plan} Subscription Plan`
    });
  }
  
  // 2. Search prices
  const priceList = await stripeInstance.prices.list({ product: product.id, limit: 100 });
  let price = priceList.data.find((p: any) => 
    p.recurring?.interval === (interval === 'yearly' ? 'year' : 'month') && 
    p.unit_amount === amount * 100
  );
  
  if (!price) {
    price = await stripeInstance.prices.create({
      product: product.id,
      unit_amount: amount * 100,
      currency: 'inr',
      recurring: {
        interval: interval === 'yearly' ? 'year' : 'month',
      }
    });
  }
  
  return price.id;
}

// Generate Stripe Checkout Session
router.post('/create-checkout-session', authenticateToken, async (req: AuthRequest, res: Response) => {
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

    if (stripe) {
      let customerId = user.stripeCustomerId;
      
      // Create Stripe customer if user doesn't have one
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.name,
          metadata: { userId: user.id }
        });
        customerId = customer.id;
        
        await db.user.update({
          where: { id: user.id },
          data: { stripeCustomerId: customerId }
        });
      }

      // Get or create price reference
      const priceId = await getOrCreatePriceId(stripe, plan, interval, amount);

      // Create Stripe Checkout Session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${req.headers.origin}/dashboard?checkout_status=success&plan=${plan}&interval=${interval}`,
        cancel_url: `${req.headers.origin}/dashboard?checkout_status=cancel`,
        metadata: {
          userId: user.id,
          userEmail: user.email,
          plan,
          interval,
          amount: amount.toString()
        }
      });

      return res.json({ success: true, url: session.url });
    } else {
      // Mock Checkout URL fallback
      const mockCheckoutUrl = `${req.headers.origin}/dashboard?mock_checkout=true&plan=${plan}&interval=${interval}`;
      return res.json({ success: true, url: mockCheckoutUrl });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Simulation endpoint for mock offline / dev testing
router.post('/simulate-webhook', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Unauthorized.' });

  const { plan, interval } = req.body;
  if (!plan || !interval) {
    return res.status(400).json({ success: false, error: 'Parameters plan and interval are required.' });
  }

  const basePriceMap = prices[plan as 'Basic' | 'Pro' | 'Enterprise'];
  if (!basePriceMap) return res.status(400).json({ success: false, error: 'Invalid plan.' });

  const amount = basePriceMap[interval as 'monthly' | 'yearly'];

  try {
    const user = await db.user.findUnique({ where: { email: req.user.email } });
    if (!user) return res.status(404).json({ success: false, error: 'User not found.' });

    // Update user profile fields
    const mockCustId = user.stripeCustomerId || `cus_mock_${Math.random().toString(36).substring(2, 10)}`;
    const mockSubId = `sub_mock_${Math.random().toString(36).substring(2, 10)}`;

    await db.user.update({
      where: { id: user.id },
      data: {
        stripeCustomerId: mockCustId,
        stripeSubscriptionId: mockSubId,
        subscriptionStatus: 'active'
      }
    });

    // Create corresponding subscription registry
    const subId = `sub_${Math.random().toString(36).substring(2, 10)}`;
    const billingDays = interval === 'yearly' ? 365 : 30;
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

    // Create paid invoice
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

    res.json({ success: true, user: { ...user, subscriptionStatus: 'active' }, subscription: newSub });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Stripe Webhook endpoint
router.post('/webhook', async (req: any, res: Response) => {
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe is not configured in this instance.' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).json({ error: 'Missing signature or webhook secret.' });
  }

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const metadata = session.metadata;

        if (metadata && metadata.userId && metadata.plan && metadata.interval) {
          const userId = metadata.userId;
          const userEmail = metadata.userEmail;
          const plan = metadata.plan;
          const interval = metadata.interval as 'monthly' | 'yearly';
          const amount = parseFloat(metadata.amount);

          const stripeSubId = session.subscription as string;
          const stripeCustId = session.customer as string;

          // 1. Update User model state
          await db.user.update({
            where: { id: userId },
            data: {
              stripeCustomerId: stripeCustId,
              stripeSubscriptionId: stripeSubId,
              subscriptionStatus: 'active'
            }
          });

          // 2. Create Active subscription
          const subId = `sub_${Math.random().toString(36).substring(2, 10)}`;
          const billingDays = interval === 'yearly' ? 365 : 30;
          
          await db.subscription.create({
            data: {
              id: subId,
              userId: userId,
              userEmail: userEmail,
              plan,
              status: 'Active',
              amount,
              interval,
              nextBillingDate: new Date(Date.now() + billingDays * 24 * 60 * 60 * 1000)
            }
          });

          // 3. Create paid invoice
          await db.invoice.create({
            data: {
              id: `inv_${Math.random().toString(36).substring(2, 10)}`,
              subscriptionId: subId,
              userId: userId,
              userEmail: userEmail,
              plan,
              amount,
              status: 'Paid'
            }
          });

          console.log(`✅ Webhook processed: Created active subscription for user ${userEmail}`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const stripeSubId = subscription.id;
        const stripeStatus = subscription.status;

        // Map Stripe status to local subscriptionStatus
        let status = 'inactive';
        if (stripeStatus === 'active' || stripeStatus === 'trialing') {
          status = 'active';
        } else if (stripeStatus === 'past_due') {
          status = 'past_due';
        } else if (stripeStatus === 'canceled' || stripeStatus === 'unpaid') {
          status = 'inactive';
        }

        // Find users with this subscription id
        const users = await db.user.findMany();
        const matchedUser = users.find(u => u.stripeSubscriptionId === stripeSubId);

        if (matchedUser) {
          await db.user.update({
            where: { id: matchedUser.id },
            data: { subscriptionStatus: status }
          });

          // Also sync active subscription list
          const userSubs = await db.subscription.findMany({ where: { userId: matchedUser.id } });
          const activeSub = userSubs.find(s => s.status === 'Active' || s.status === 'Trialing' || s.status === 'Past Due');

          if (activeSub) {
            let localSubStatus = 'Active';
            if (stripeStatus === 'past_due') localSubStatus = 'Past Due';
            else if (stripeStatus === 'canceled' || stripeStatus === 'unpaid') localSubStatus = 'Cancelled';
            
            await db.subscription.update({
              where: { id: activeSub.id },
              data: { status: localSubStatus }
            });
          }

          console.log(`🔄 Webhook processed: Updated subscription status for user ${matchedUser.email} to ${status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const stripeSubId = subscription.id;

        const users = await db.user.findMany();
        const matchedUser = users.find(u => u.stripeSubscriptionId === stripeSubId);

        if (matchedUser) {
          await db.user.update({
            where: { id: matchedUser.id },
            data: { subscriptionStatus: 'inactive' }
          });

          const userSubs = await db.subscription.findMany({ where: { userId: matchedUser.id } });
          const activeSub = userSubs.find(s => s.status === 'Active' || s.status === 'Trialing' || s.status === 'Past Due');

          if (activeSub) {
            await db.subscription.update({
              where: { id: activeSub.id },
              data: { status: 'Expired' }
            });
          }

          console.log(`❌ Webhook processed: Terminated subscription for user ${matchedUser.email}`);
        }
        break;
      }

      default:
        console.log(`ℹ️ Webhook received unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error(`❌ Webhook handler error: ${error.message}`);
    res.status(500).json({ error: error.message });
  }
});

export default router;
