/**
 * useLiveDataEngine — Simulates a live, real-time data pipeline
 * for SubVault. Every few seconds this engine fires realistic
 * subscription lifecycle events (new sign-ups, payment retries,
 * plan upgrades, churn, and system health pulses) so the dashboard
 * feels like a real production system.
 */

import { useEffect, useRef } from 'react';
import type {
  Subscription,
  Invoice,
  SystemLog,
  PlanType,
  BillingInterval,
  SubscriptionStatus,
} from '../context/SubscriptionContext';
import { PLAN_PRICES } from '../shared/pricing';

// ─── Realistic Indian startup email domains ───────────────────────────────────
const EMAIL_DOMAINS = [
  'razorpay.com', 'zomato.com', 'flipkart.com', 'paytm.com', 'ola.cabs',
  'meesho.com', 'cleartax.in', 'freshworks.com', 'practo.com', 'byju.com',
  'unacademy.com', 'lenskart.com', 'pepperfry.com', 'sharechat.com',
  'drivezy.com', 'spinny.com', 'khatabook.com', 'ofbusiness.com',
  'darwinbox.com', 'chargebee.com', 'zoho.com', 'postman.com',
  'browserstack.com', 'hasura.io', 'setu.co', 'decentro.tech',
  'cashfree.com', 'signalx.ai', 'sprinklr.com', 'leadsquared.com',
];

const FIRST_NAMES = [
  'Arjun', 'Priya', 'Rahul', 'Sneha', 'Vikram', 'Ananya', 'Rajan',
  'Divya', 'Karthik', 'Meera', 'Sanjay', 'Pooja', 'Amit', 'Nisha',
  'Rohan', 'Kavya', 'Suresh', 'Aishwarya', 'Dev', 'Sonal', 'Nikhil',
  'Tanvi', 'Gaurav', 'Shruti', 'Varun', 'Isha', 'Ajay', 'Ritu',
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Joshi', 'Verma',
  'Nair', 'Rao', 'Reddy', 'Iyer', 'Mehta', 'Shah', 'Bose', 'Malhotra',
  'Pillai', 'Saxena', 'Chopra', 'Kapoor', 'Agarwal', 'Srivastava',
];



// ─── System log message templates ────────────────────────────────────────────
type Service = SystemLog['service'];

interface LogTemplate {
  service: Service;
  messages: string[];
  type: SystemLog['type'];
}

const LOG_TEMPLATES: LogTemplate[] = [
  {
    service: 'API Gateway',
    type: 'info',
    messages: [
      'GET /subscriptions — 200 OK (12ms)',
      'POST /billing/charge — Queued for async processing',
      'Rate limit check passed (847/10000 req/min)',
      'mTLS handshake verified for gateway node sg-3',
      'Load balancer health probe responded 200',
      'JWT token verified — expiry in 1800s',
    ],
  },
  {
    service: 'PostgreSQL',
    type: 'success',
    messages: [
      'Connection pool: 12/50 active connections',
      'Vacuum ANALYZE completed on subscriptions table',
      'Index usage ratio: 99.2% (optimal)',
      'WAL replication lag: 0ms — primary healthy',
      'Query planner stats refreshed (auto-vacuum)',
      'Checkpoint completed in 42ms',
    ],
  },
  {
    service: 'Redis',
    type: 'success',
    messages: [
      'Cache hit ratio: 94.7% (excellent)',
      'Eviction policy LRU — 0 keys evicted',
      'Pub/Sub latency: 1.2ms',
      'AOF persistence synced to disk',
      'Memory usage: 214MB / 2048MB (10.4%)',
    ],
  },
  {
    service: 'RabbitMQ',
    type: 'info',
    messages: [
      '"invoice.generated" event published to billing.exchange',
      '"subscription.renewed" event routed to analytics queue',
      'Dead-letter queue processed — 0 failed messages',
      'Consumer group "billing-workers" — 4 active consumers',
      '"dunning.retry" event scheduled for T+72h',
    ],
  },
  {
    service: 'Billing Service',
    type: 'success',
    messages: [
      'Razorpay webhook verified — HMAC signature valid',
      'Payment intent captured successfully — settlement T+1',
      'GST invoice generated and dispatched via SendGrid',
      'Recurring charge scheduled for next billing cycle',
      'Refund processed — credited to source account in 3-5 days',
    ],
  },
  {
    service: 'Auth Service',
    type: 'success',
    messages: [
      'OAuth2.0 token issued — scope: read:subscriptions write:billing',
      'SSO session renewed via Google Workspace',
      'MFA challenge passed (TOTP)',
      'Anomaly detector: login from new IP — flagged for review',
    ],
  },
  {
    service: 'Subscription Service',
    type: 'info',
    messages: [
      'Dunning engine evaluated 3 past-due accounts',
      'Trial expiry reminders dispatched for 2 accounts',
      'Plan downgrade requested — proration calculated',
      'Annual renewal processed — 2 months free applied',
      'Cancellation survey response captured and stored',
    ],
  },
];

// ─── Random helpers ──────────────────────────────────────────────────────────
export function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateEmail(): string {
  const first = randomFrom(FIRST_NAMES).toLowerCase();
  const last  = randomFrom(LAST_NAMES).toLowerCase();
  const domain = randomFrom(EMAIL_DOMAINS);
  const sep = Math.random() > 0.5 ? '.' : '';
  return `${first}${sep}${last}@${domain}`;
}

export function generateUserId(): string {
  return `usr_${Math.random().toString(36).substr(2, 8)}`;
}

export function generateSubId(): string {
  return `sub_${Math.random().toString(36).substr(2, 8)}`;
}

export function generateInvId(): string {
  return `inv_${Math.random().toString(36).substr(2, 8)}`;
}

export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function futureDateStr(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

// ─── Build a new subscription object ─────────────────────────────────────────
export function buildSubscription(
  plan: PlanType = randomFrom(['Basic', 'Pro', 'Enterprise']),
  interval: BillingInterval = randomFrom(['monthly', 'yearly']),
  status: SubscriptionStatus = 'Active',
): Subscription {
  const amount = PLAN_PRICES[plan][interval];
  return {
    id: generateSubId(),
    userId: generateUserId(),
    userEmail: generateEmail(),
    plan,
    status,
    amount,
    interval,
    createdAt: todayStr(),
    nextBillingDate: futureDateStr(interval === 'yearly' ? 365 : 30),
    ...(status === 'Trialing' ? { trialDaysLeft: Math.floor(Math.random() * 13) + 1 } : {}),
  };
}

// ─── Build a new invoice object ───────────────────────────────────────────────
export function buildInvoice(sub: Subscription, status: Invoice['status'] = 'Paid'): Invoice {
  return {
    id: generateInvId(),
    subscriptionId: sub.id,
    userEmail: sub.userEmail,
    plan: sub.plan,
    amount: sub.amount,
    status,
    createdAt: todayStr(),
  };
}

// ─── Pick a random log template entry ────────────────────────────────────────
export function randomLogEntry(): { service: Service; message: string; type: SystemLog['type'] } {
  const template = randomFrom(LOG_TEMPLATES);
  return {
    service: template.service,
    message: randomFrom(template.messages),
    type: template.type,
  };
}

// ─── Hook: useLiveDataEngine ─────────────────────────────────────────────────

export interface LiveEngineCallbacks {
  addSubscription: (sub: Subscription) => void;
  addInvoice: (inv: Invoice) => void;
  addLog: (service: Service, message: string, type?: SystemLog['type']) => void;
  updateSubStatus: (id: string, status: SubscriptionStatus) => void;
  getSubscriptions: () => Subscription[];
}

export function useLiveDataEngine(callbacks: LiveEngineCallbacks, enabled = true) {
  const cbRef = useRef(callbacks);
  
  useEffect(() => {
    cbRef.current = callbacks;
  });

  useEffect(() => {
    if (!enabled) return;

    const timers: ReturnType<typeof setTimeout>[] = [];

    // Actually just use proper recurring wrappers:
    const loop = (fn: () => void, minMs: number, maxMs: number) => {
      let id: ReturnType<typeof setTimeout>;
      const tick = () => {
        fn();
        id = setTimeout(tick, minMs + Math.random() * (maxMs - minMs));
        timers.push(id);
      };
      id = setTimeout(tick, minMs + Math.random() * (maxMs - minMs));
      timers.push(id);
    };

    // ── New signup: every 8–18s
    loop(() => {
      const plan   = randomFrom<PlanType>(['Basic', 'Pro', 'Enterprise']);
      const interval = randomFrom<BillingInterval>(['monthly', 'yearly']);
      const isTrialing = Math.random() < 0.2;
      const sub = buildSubscription(plan, interval, isTrialing ? 'Trialing' : 'Active');
      const inv = buildInvoice(sub, isTrialing ? 'Unpaid' : 'Paid');
      cbRef.current.addSubscription(sub);
      cbRef.current.addInvoice(inv);
      cbRef.current.addLog(
        'Subscription Service',
        `🆕 New ${plan} (${interval}) subscription: ${sub.userEmail}`,
        'success',
      );
      cbRef.current.addLog(
        'Billing Service',
        isTrialing
          ? `Trial initiated — first billing on ${sub.nextBillingDate}`
          : `₹${sub.amount.toLocaleString()} payment captured via Razorpay`,
        isTrialing ? 'info' : 'success',
      );
    }, 8000, 18000);

    // ── Payment event: every 10–22s
    loop(() => {
      const subs = cbRef.current.getSubscriptions();
      const active = subs.filter(s => s.status === 'Active' || s.status === 'Trialing');
      if (active.length === 0) return;
      const sub = randomFrom(active);
      const ok = Math.random() < 0.87;
      cbRef.current.addInvoice(buildInvoice(sub, ok ? 'Paid' : 'Failed'));
      if (ok) {
        cbRef.current.addLog('Billing Service', `✅ ₹${sub.amount.toLocaleString()} collected from ${sub.userEmail}`, 'success');
        cbRef.current.addLog('PostgreSQL', `Invoice status updated → Paid. Settlement T+1.`, 'success');
      } else {
        cbRef.current.updateSubStatus(sub.id, 'Past Due');
        cbRef.current.addLog('Billing Service', `❌ Charge failed for ${sub.userEmail} — card_declined`, 'error');
        cbRef.current.addLog('RabbitMQ', `Dunning retry queued — attempt 1/3 in 24h`, 'warn');
      }
    }, 10000, 22000);

    // ── System health pulses: every 3–7s
    loop(() => {
      const { service, message, type } = randomLogEntry();
      cbRef.current.addLog(service, message, type);
    }, 3000, 7000);

    // ── Plan upgrades: every 22–38s
    loop(() => {
      const subs = cbRef.current.getSubscriptions();
      const candidates = subs.filter(s => s.plan !== 'Enterprise' && s.status === 'Active');
      if (candidates.length === 0) return;
      const sub = randomFrom(candidates);
      const newPlan: PlanType = sub.plan === 'Basic' ? (Math.random() < 0.7 ? 'Pro' : 'Enterprise') : 'Enterprise';
      const newAmt = PLAN_PRICES[newPlan][sub.interval];
      cbRef.current.addLog('Subscription Service', `⬆️ ${sub.userEmail} upgraded to ${newPlan}`, 'info');
      cbRef.current.addLog('Billing Service', `Proration charge: ₹${newAmt.toLocaleString()}`, 'success');
    }, 22000, 38000);

    // ── Cancellation / churn: every 30–55s
    loop(() => {
      const subs = cbRef.current.getSubscriptions();
      const active = subs.filter(s => s.status === 'Active');
      if (active.length < 5) return;
      const sub = randomFrom(active);
      cbRef.current.updateSubStatus(sub.id, 'Cancelled');
      cbRef.current.addLog('Subscription Service', `🔴 ${sub.userEmail} cancelled (${sub.plan})`, 'warn');
      cbRef.current.addLog('RabbitMQ', `"subscription.cancelled" dispatched → retention worker`, 'info');
    }, 30000, 55000);

    // ── Trial conversions: every 35–60s
    loop(() => {
      const subs = cbRef.current.getSubscriptions();
      const trialing = subs.filter(s => s.status === 'Trialing');
      if (trialing.length === 0) return;
      const sub = randomFrom(trialing);
      const converted = Math.random() < 0.65;
      cbRef.current.updateSubStatus(sub.id, converted ? 'Active' : 'Cancelled');
      cbRef.current.addInvoice(buildInvoice(sub, converted ? 'Paid' : 'Failed'));
      if (converted) {
        cbRef.current.addLog('Subscription Service', `🎉 Trial converted: ${sub.userEmail} → Active`, 'success');
        cbRef.current.addLog('Billing Service', `First charge ₹${sub.amount.toLocaleString()} collected`, 'success');
      } else {
        cbRef.current.addLog('Subscription Service', `Trial expired without conversion: ${sub.userEmail}`, 'warn');
      }
    }, 35000, 60000);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [enabled]);
}

export type { Invoice, Subscription };
