import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Check } from 'lucide-react';
import { getPlanDisplayPrice } from '../../shared/pricing';
import type { PlanType, BillingInterval } from '../../context/SubscriptionContext';

interface PricingSectionProps {
  billingInterval: BillingInterval;
  setBillingInterval: (interval: BillingInterval) => void;
  handleSelectPlan: (plan: PlanType) => void;
  checkoutLoadingPlan: string | null;
}

export const PricingSection: React.FC<PricingSectionProps> = ({
  billingInterval,
  setBillingInterval,
  handleSelectPlan,
  checkoutLoadingPlan,
}) => {
  return (
    <section id="pricing" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
          Simple, Transparent Pricing
        </h2>
        <p className="text-gray-400 light-theme:text-gray-600">
          Scale from your very first subscription sandbox to thousands of live production customer invoices.
        </p>

        {/* Toggle */}
        <div className="inline-flex items-center gap-3 mt-8 p-1.5 rounded-full border border-white/5 bg-black/40">
          <button 
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${billingInterval === 'monthly' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Monthly
          </button>
          <button 
            onClick={() => setBillingInterval('yearly')}
            className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all cursor-pointer ${billingInterval === 'yearly' ? 'bg-purple-600 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Yearly <span className="text-[9px] text-cyan-300 font-bold ml-0.5">Save 20%</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
        {/* Basic Plan */}
        <Card className="flex flex-col justify-between border-white/5 hover:border-purple-500/20 bg-black/20">
          <CardContent className="p-0 flex-grow">
            <span className="text-xs uppercase text-gray-400 font-bold tracking-widest">Basic</span>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-extrabold text-white light-theme:text-gray-900">
                {getPlanDisplayPrice('Basic', billingInterval)}
              </span>
              <span className="text-sm text-gray-400">/{billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <p className="text-sm text-gray-400 light-theme:text-gray-500 mt-4">
              Perfect for early-stage SaaS validation and developer sandboxing.
            </p>
            <hr className="border-white/5 my-6" />
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-cyan-400" />
                <span>Up to 100 subscribers</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-cyan-400" />
                <span>Basic invoicing templates</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-cyan-400" />
                <span>Standard 4-day retry schedule</span>
              </li>
              <li className="flex items-center gap-2.5 text-gray-500 line-through">
                <span>Smart retry schedules (ML)</span>
              </li>
              <li className="flex items-center gap-2.5 text-gray-500 line-through">
                <span>Custom API gateway keys</span>
              </li>
            </ul>
          </CardContent>
          <Button 
            variant="secondary" 
            className="w-full mt-8" 
            onClick={() => handleSelectPlan('Basic')}
            isLoading={checkoutLoadingPlan === 'Basic'}
          >
            Get Started
          </Button>
        </Card>

        {/* Pro Plan */}
        <Card className="flex flex-col justify-between border-purple-500/30 bg-purple-950/5 relative overflow-hidden shadow-[0_0_20px_rgba(124,58,237,0.05)]">
          <div className="absolute top-0 right-0 px-3 py-1 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-[9px] font-bold tracking-wider uppercase rounded-bl-lg">
            Popular
          </div>
          <CardContent className="p-0 flex-grow">
            <span className="text-xs uppercase text-purple-400 font-bold tracking-widest">Pro</span>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-extrabold text-white light-theme:text-gray-900">
                {getPlanDisplayPrice('Pro', billingInterval)}
              </span>
              <span className="text-sm text-gray-400">/{billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <p className="text-sm text-gray-400 light-theme:text-gray-500 mt-4">
              Grow recurring revenue with smart retries and custom webhooks.
            </p>
            <hr className="border-white/5 my-6" />
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-purple-400" />
                <span>Up to 2,500 subscribers</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-purple-400" />
                <span>Custom invoice styling & branding</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-purple-400" />
                <span>Smart ML retry logic (Up to 5 attempts)</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-purple-400" />
                <span>Webhooks & integrations</span>
              </li>
              <li className="flex items-center gap-2.5 text-gray-500 line-through">
                <span>Multi-tenant gateway RBAC</span>
              </li>
            </ul>
          </CardContent>
          <Button 
            variant="glow" 
            className="w-full mt-8" 
            onClick={() => handleSelectPlan('Pro')}
            isLoading={checkoutLoadingPlan === 'Pro'}
          >
            Get Pro
          </Button>
        </Card>

        {/* Enterprise Plan */}
        <Card className="flex flex-col justify-between border-white/5 hover:border-purple-500/20 bg-black/20">
          <CardContent className="p-0 flex-grow">
            <span className="text-xs uppercase text-gray-400 font-bold tracking-widest">Enterprise</span>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-4xl font-extrabold text-white light-theme:text-gray-900">
                {getPlanDisplayPrice('Enterprise', billingInterval)}
              </span>
              <span className="text-sm text-gray-400">/{billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
            <p className="text-sm text-gray-400 light-theme:text-gray-500 mt-4">
              Unlimited scale with robust SLAs, custom gateways, and direct DB support.
            </p>
            <hr className="border-white/5 my-6" />
            <ul className="space-y-3.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-cyan-400" />
                <span>Unlimited subscribers</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-cyan-400" />
                <span>Dedicated database sync tunnels</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-cyan-400" />
                <span>99.999% SLA uptime contract</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-cyan-400" />
                <span>Dedicated developer support manager</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Check className="h-4.5 w-4.5 text-cyan-400" />
                <span>Custom API gateway keys</span>
              </li>
            </ul>
          </CardContent>
          <Button 
            variant="secondary" 
            className="w-full mt-8" 
            onClick={() => handleSelectPlan('Enterprise')}
            isLoading={checkoutLoadingPlan === 'Enterprise'}
          >
            Get Enterprise
          </Button>
        </Card>
      </div>
    </section>
  );
};
