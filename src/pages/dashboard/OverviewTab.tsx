import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  AlertCircle, Plus, ShieldAlert, CreditCard, Check 
} from 'lucide-react';
import { PLAN_OPTIONS } from '../../shared/pricing';
import type { PlanType, BillingInterval, Subscription, Invoice } from '../../context/SubscriptionContext';

interface OverviewTabProps {
  metrics: {
    mrr: number;
    activeUsers: number;
    churnRate: number;
    successRate: number;
  };
  subscriptions: Subscription[];
  invoices: Invoice[];
  user: any;
  mrrChartData: any[];
  newEmail: string;
  setNewEmail: (email: string) => void;
  newPlan: PlanType;
  setNewPlan: (plan: PlanType) => void;
  newInterval: BillingInterval;
  setNewInterval: (interval: BillingInterval) => void;
  paymentGateway: 'stripe' | 'razorpay';
  setPaymentGateway: (gateway: 'stripe' | 'razorpay') => void;
  checkoutLoading: boolean;
  formError: string | null;
  handleCreateSub: (e: React.FormEvent) => void;
  triggerChaosMock: () => void;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  metrics,
  subscriptions,
  invoices,
  user,
  mrrChartData,
  newEmail,
  setNewEmail,
  newPlan,
  setNewPlan,
  newInterval,
  setNewInterval,
  paymentGateway,
  setPaymentGateway,
  checkoutLoading,
  formError,
  handleCreateSub,
  triggerChaosMock,
}) => {
  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover:border-purple-500/20 bg-black/20">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wider font-semibold text-[10px]">
              {user?.role === 'ADMIN' ? 'Monthly Revenue' : 'Monthly Cost'}
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white light-theme:text-gray-900 mt-1">
              ₹{metrics.mrr.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              {user?.role === 'ADMIN' ? '▲ 12.8%' : '▲ active spend'}{' '}
              <span className="text-gray-500">{user?.role === 'ADMIN' ? 'from last week' : 'normalized monthly'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-500/20 bg-black/20">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wider font-semibold text-[10px]">
              {user?.role === 'ADMIN' ? 'Active Subscribers' : 'Active Services'}
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white light-theme:text-gray-900 mt-1">
              {metrics.activeUsers}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              ▲ {subscriptions.filter(s => s.status === 'Active').length}{' '}
              <span className="text-gray-500">{user?.role === 'ADMIN' ? 'active tiers' : 'active plans'}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-500/20 bg-black/20">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wider font-semibold text-[10px]">
              {user?.role === 'ADMIN' ? 'Churn Rate' : 'Cancellation Rate'}
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white light-theme:text-gray-900 mt-1">
              {metrics.churnRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              ▼ 0.2%{' '}
              <span className="text-gray-500">
                {user?.role === 'ADMIN' ? 'target < 3.0%' : 'deactivated services'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:border-purple-500/20 bg-black/20">
          <CardHeader className="pb-2">
            <CardDescription className="uppercase tracking-wider font-semibold text-[10px]">
              Payment Success
            </CardDescription>
            <CardTitle className="text-3xl font-extrabold text-white light-theme:text-gray-900 mt-1">
              {metrics.successRate}%
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              ▲ {invoices.filter(i => i.status === 'Paid').length}{' '}
              <span className="text-gray-500">{user?.role === 'ADMIN' ? 'paid invoices' : 'successful receipts'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Big MRR Chart */}
      <Card className="p-6 bg-black/30 border-white/5">
        <CardHeader className="p-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg">
              {user?.role === 'ADMIN' ? 'Monthly Recurring Revenue Growth' : 'Monthly Subscription Spending Growth'}
            </CardTitle>
            <CardDescription className="text-xs">
              {user?.role === 'ADMIN' ? 'Visualizing historical performance curves of sub database' : 'Visualizing historical subscription costs normalized monthly'}
            </CardDescription>
          </div>
        </CardHeader>
        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mrrChartData}>
              <defs>
                <linearGradient id="colorMRR_dash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e304f" opacity={0.2} />
              <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `₹${v}`} />
              <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <Area type="monotone" dataKey="MRR" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorMRR_dash)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Quick actions panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription creation */}
        <Card className="bg-black/20 border-white/5">
          <CardHeader>
            <CardTitle className="text-base">
              {user?.role === 'ADMIN' ? 'Quick Subscription Creation' : 'Purchase New Subscription'}
            </CardTitle>
            <CardDescription className="text-xs">
              {user?.role === 'ADMIN' ? 'Inject new client accounts directly into DB repository' : 'Subscribe to a new service plan instantly'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateSub} className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Customer Email</label>
                <input
                  type="email"
                  placeholder="e.g. client@company.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  disabled={user?.role !== 'ADMIN'}
                  className="px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:outline-none focus:border-purple-500/50 disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Billing Tier</label>
                  <select
                    value={newPlan}
                    onChange={(e) => setNewPlan(e.target.value as PlanType)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  >
                    {PLAN_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Interval</label>
                  <select
                    value={newInterval}
                    onChange={(e) => setNewInterval(e.target.value as BillingInterval)}
                    className="px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              {user?.role !== 'ADMIN' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Payment Gateway</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentGateway('stripe')}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                        paymentGateway === 'stripe'
                          ? 'border-purple-500 bg-purple-500/10 text-white shadow-sm'
                          : 'border-white/10 bg-black/40 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <svg className="h-4 w-4 fill-current text-blue-400" viewBox="0 0 24 24">
                        <path d="M13.97 10.322c0-.797-.68-1.127-1.83-1.127-1.74 0-3.376.545-4.887 1.411V4.922c1.61-.59 3.523-.923 5.438-.923 4.103 0 6.844 1.94 6.844 5.378 0 4.298-5.908 4.793-5.908 6.47 0 .524.444.823 1.22.823 1.946 0 3.79-.766 5.283-1.636v5.422a10.978 10.978 0 0 1-5.748 1.55c-4.225 0-7.078-1.95-7.078-5.388 0-4.522 6.077-4.992 6.077-6.736z"/>
                      </svg>
                      Stripe
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentGateway('razorpay')}
                      className={`px-4 py-2.5 rounded-xl border text-xs font-bold transition-all text-center flex items-center justify-center gap-2 cursor-pointer ${
                        paymentGateway === 'razorpay'
                          ? 'border-purple-500 bg-purple-500/10 text-white shadow-sm'
                          : 'border-white/10 bg-black/40 text-gray-400 hover:text-white hover:border-white/20'
                      }`}
                    >
                      <CreditCard className="h-4 w-4 text-emerald-400" />
                      Razorpay
                    </button>
                  </div>
                </div>
              )}

              {formError && (
                <div className="text-rose-400 text-xs flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4" /> {formError}
                </div>
              )}

              <Button 
                type="submit" 
                variant="primary" 
                className="w-full" 
                isLoading={checkoutLoading} 
                leftIcon={<Plus className="h-4 w-4" />}
              >
                {user?.role === 'ADMIN' ? 'Add Subscriber' : 'Subscribe Now'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Chaos Engine */}
        <Card className="bg-black/20 border-white/5 flex flex-col justify-between">
          <div>
            <CardHeader>
              <CardTitle className="text-base">Microservices Resilience Console</CardTitle>
              <CardDescription className="text-xs">Simulate runtime bottlenecks and load-balancer issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs leading-relaxed text-gray-400">
              <p>
                Test the microservices monitoring layer by injecting simulated network connection issues, lock timeouts, or queue spikes.
              </p>
              <p className="text-amber-300 font-semibold flex items-center gap-1.5">
                <ShieldAlert className="h-4.5 w-4.5" /> Note: This generates synthetic logs in the monitors terminal.
              </p>
            </CardContent>
          </div>
          <div className="p-6 pt-0">
            <Button variant="danger" className="w-full" onClick={triggerChaosMock}>
              Inject Mock Database Error
            </Button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
};
