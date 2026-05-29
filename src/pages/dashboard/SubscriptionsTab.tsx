import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { 
  Play, Pause, RotateCw, Trash2, XCircle 
} from 'lucide-react';
import type { SubscriptionStatus, Subscription } from '../../context/SubscriptionContext';

interface SubscriptionsTabProps {
  subscriptions: Subscription[];
  user: any;
  updateSubscriptionStatus: (id: string, status: SubscriptionStatus) => void;
  handleOpenProrateModal: (sub: Subscription) => void;
  deleteSubscription: (id: string) => void;
}

export const StatusBadge: React.FC<{ status: SubscriptionStatus }> = ({ status }) => {
  const styles = {
    Active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    Trialing: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    Paused: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Past Due': 'bg-rose-500/10 text-rose-400 border-rose-500/20 glow-dot',
    Cancelled: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    Expired: 'bg-gray-500/10 text-gray-400 border-gray-600/20',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-bold rounded-lg border ${styles[status]}`}>
      {status}
    </span>
  );
};

export const SubscriptionsTab: React.FC<SubscriptionsTabProps> = ({
  subscriptions,
  user,
  updateSubscriptionStatus,
  handleOpenProrateModal,
  deleteSubscription,
}) => {
  return (
    <motion.div
      key="subscriptions"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <Card className="bg-black/20 border-white/5 overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-base">Subscription Database Repository</CardTitle>
            <CardDescription className="text-xs">
              Showing database records matching{' '}
              <code className="bg-black/40 px-1 py-0.5 rounded text-purple-300 font-mono text-[10px]">
                {user?.role === 'ADMIN'
                  ? 'SELECT * FROM subscriptions;'
                  : `SELECT * FROM subscriptions WHERE user_email = '${user?.email}';`}
              </code>
            </CardDescription>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="px-6 py-4.5">Subscription ID</th>
                <th className="px-6 py-4.5">Customer Email</th>
                <th className="px-6 py-4.5">Tier Plan</th>
                <th className="px-6 py-4.5">Amount</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5">Next Billing</th>
                <th className="px-6 py-4.5 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 font-medium font-mono">
                    // No subscriptions found. Create one using the form or API Console.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4.5 font-mono text-gray-400">{sub.id}</td>
                    <td className="px-6 py-4.5 font-medium text-white light-theme:text-gray-900">{sub.userEmail}</td>
                    <td className="px-6 py-4.5">
                      <span className="font-semibold text-[#a78bfa]">{sub.plan}</span>
                      <span className="text-[10px] text-gray-500 ml-1">({sub.interval})</span>
                    </td>
                    <td className="px-6 py-4.5 font-bold text-white light-theme:text-gray-900">₹{sub.amount.toLocaleString()}</td>
                    <td className="px-6 py-4.5"><StatusBadge status={sub.status} /></td>
                    <td className="px-6 py-4.5 text-gray-400 font-mono">{sub.nextBillingDate}</td>
                    <td className="px-6 py-4.5 text-right space-x-1.5">
                      {sub.status === 'Active' && (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'Paused')}
                          className="p-1.5 rounded-lg border border-white/5 bg-black/20 hover:border-amber-500/30 hover:bg-amber-500/10 text-amber-400 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Pause billing cycle"
                        >
                          <Pause className="h-3.5 w-3.5" />
                        </button>
                      )}
                      
                      {(sub.status === 'Paused' || sub.status === 'Past Due') && (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'Active')}
                          className="p-1.5 rounded-lg border border-white/5 bg-black/20 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-emerald-400 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Activate subscription"
                        >
                          <Play className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {sub.status !== 'Cancelled' && sub.status !== 'Expired' && (
                        <button
                          onClick={() => updateSubscriptionStatus(sub.id, 'Cancelled')}
                          className="p-1.5 rounded-lg border border-white/5 bg-black/20 hover:border-orange-500/30 hover:bg-orange-500/10 text-orange-400 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Cancel contract"
                        >
                          <XCircle className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {sub.status === 'Active' && (
                        <button
                          onClick={() => handleOpenProrateModal(sub)}
                          className="p-1.5 rounded-lg border border-white/5 bg-black/20 hover:border-purple-500/30 hover:bg-purple-500/10 text-purple-400 transition-all cursor-pointer inline-flex items-center justify-center"
                          title="Migrate plan (Prorated)"
                        >
                          <RotateCw className="h-3.5 w-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => deleteSubscription(sub.id)}
                        className="p-1.5 rounded-lg border border-white/5 bg-black/20 hover:border-rose-500/30 hover:bg-rose-500/10 text-rose-400 transition-all cursor-pointer inline-flex items-center justify-center"
                        title="Delete record"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </motion.div>
  );
};
