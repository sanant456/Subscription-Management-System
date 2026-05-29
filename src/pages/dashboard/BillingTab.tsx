import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { AlertCircle, RotateCw, Download } from 'lucide-react';
import type { Invoice } from '../../context/SubscriptionContext';

interface BillingTabProps {
  invoices: Invoice[];
  user: any;
  retryPayment: (invoiceId: string) => boolean;
  addLog: (service: 'API Gateway' | 'Auth Service' | 'Subscription Service' | 'Billing Service' | 'PostgreSQL' | 'Redis' | 'RabbitMQ', message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
}

export const BillingTab: React.FC<BillingTabProps> = ({
  invoices,
  user,
  retryPayment,
  addLog,
}) => {
  return (
    <motion.div
      key="billing"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      {/* Pending failed payment alert banner */}
      {invoices.some(i => i.status === 'Failed') && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5.5 w-5.5 text-rose-400 flex-shrink-0" />
            <div>
              <div className="font-bold text-sm">Failed Invoices Detected</div>
              <div className="text-rose-400/80 mt-0.5">Dunning schedule is active. Use the retry action below to restore operations.</div>
            </div>
          </div>
        </motion.div>
      )}

      <Card className="bg-black/20 border-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-heading">Invoice History Records</CardTitle>
          <CardDescription className="text-xs">
            Showing invoice records matching{' '}
            <code className="bg-black/40 px-1 py-0.5 rounded text-purple-300 font-mono text-[10px]">
              {user?.role === 'ADMIN'
                ? 'SELECT * FROM invoices;'
                : `SELECT * FROM invoices WHERE user_email = '${user?.email}';`}
            </code>
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="px-6 py-4.5">Invoice ID</th>
                <th className="px-6 py-4.5">Subscription ID</th>
                <th className="px-6 py-4.5">Customer Email</th>
                <th className="px-6 py-4.5">Plan Tier</th>
                <th className="px-6 py-4.5">Amount</th>
                <th className="px-6 py-4.5">Issued Date</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-mono">
                    // Invoice repository empty
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4.5 font-mono text-gray-400">{inv.id}</td>
                    <td className="px-6 py-4.5 font-mono text-gray-400">{inv.subscriptionId}</td>
                    <td className="px-6 py-4.5 text-white light-theme:text-gray-900">{inv.userEmail}</td>
                    <td className="px-6 py-4.5 font-semibold text-[#a78bfa]">{inv.plan}</td>
                    <td className="px-6 py-4.5 font-bold text-white light-theme:text-gray-900">₹{inv.amount.toLocaleString()}</td>
                    <td className="px-6 py-4.5 text-gray-400 font-mono">{inv.createdAt}</td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                        inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        inv.status === 'Unpaid' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border-rose-500/20 font-bold glow-dot'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right space-x-1.5">
                      {inv.status === 'Failed' && (
                        <button
                          onClick={() => retryPayment(inv.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:border-emerald-500/40 hover:bg-emerald-500/20 text-rose-300 hover:text-emerald-300 transition-all font-semibold cursor-pointer inline-flex items-center gap-1.5"
                          title="Force retry charging card"
                        >
                          <RotateCw className="h-3 w-3 animate-spin-slow" /> Retry Charge
                        </button>
                      )}
                      
                      <button
                        onClick={() => addLog('Billing Service', `Downloaded PDF for invoice ${inv.id}`, 'info')}
                        className="p-1.5 rounded-lg border border-white/5 bg-black/20 hover:border-purple-500/30 text-gray-400 hover:text-white transition-all cursor-pointer inline-flex items-center justify-center"
                        title="Download PDF statement"
                      >
                        <Download className="h-3.5 w-3.5" />
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
