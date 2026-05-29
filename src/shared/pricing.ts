/**
 * Shared pricing constants — Single Source of Truth
 * Used by: SubscriptionContext, Dashboard, LandingPage, useLiveDataEngine
 */

import type { PlanType, BillingInterval } from '../context/SubscriptionContext';

export const PLAN_PRICES: Record<PlanType, Record<BillingInterval, number>> = {
  Basic:      { monthly: 1500,   yearly: 15000  },
  Pro:        { monthly: 4000,   yearly: 40000  },
  Enterprise: { monthly: 25000,  yearly: 250000 },
};

/** Get the raw price for a plan + interval combination */
export function getPlanPrice(plan: PlanType, interval: BillingInterval): number {
  return PLAN_PRICES[plan][interval];
}

/** Format price for display with ₹ symbol and Indian comma separators */
export function getPlanDisplayPrice(plan: PlanType, interval: BillingInterval): string {
  return `₹${PLAN_PRICES[plan][interval].toLocaleString('en-IN')}`;
}

/** All available plans in tier order */
export const PLAN_TIERS: PlanType[] = ['Basic', 'Pro', 'Enterprise'];

/** Plan labels for select dropdowns */
export const PLAN_OPTIONS: { value: PlanType; label: string }[] = [
  { value: 'Basic',      label: `Basic (₹1,500)` },
  { value: 'Pro',        label: `Pro (₹4,000)` },
  { value: 'Enterprise', label: `Enterprise (₹25,000)` },
];
