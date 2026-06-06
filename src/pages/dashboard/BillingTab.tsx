import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { AlertCircle, RotateCw, Download, FileText, X, Receipt } from 'lucide-react';
import type { Invoice, Payment } from '../../context/SubscriptionContext';

interface BillingTabProps {
  invoices: Invoice[];
  payments: Payment[];
  user: any;
  retryPayment: (invoiceId: string) => boolean;
  addLog: (service: 'API Gateway' | 'Auth Service' | 'Subscription Service' | 'Billing Service' | 'PostgreSQL' | 'Redis' | 'RabbitMQ', message: string, type?: 'info' | 'success' | 'warn' | 'error') => void;
  fetchReceipt: (paymentId: string) => Promise<any>;
}

export const BillingTab: React.FC<BillingTabProps> = ({
  invoices,
  payments,
  user,
  retryPayment,
  addLog,
  fetchReceipt,
}) => {
  const [selectedReceipt, setSelectedReceipt] = useState<any | null>(null);
  const [receiptLoadingId, setReceiptLoadingId] = useState<string | null>(null);

  const handleViewReceipt = async (paymentId: string) => {
    setReceiptLoadingId(paymentId);
    addLog('Billing Service', `Fetching cryptographic receipt details for transaction ${paymentId}`, 'info');
    try {
      const receipt = await fetchReceipt(paymentId);
      if (receipt) {
        setSelectedReceipt(receipt);
        addLog('Billing Service', `Receipt loaded successfully for transaction ${paymentId}`, 'success');
      } else {
        addLog('Billing Service', `Failed to generate receipt for transaction ${paymentId}`, 'error');
      }
    } catch (e) {
      addLog('Billing Service', `Error generating receipt: ${e instanceof Error ? e.message : 'Unknown error'}`, 'error');
    } finally {
      setReceiptLoadingId(null);
    }
  };

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

      {/* Invoice History Card */}
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

      {/* Transaction / Payments History Card */}
      <Card className="bg-black/20 border-white/5 overflow-hidden">
        <CardHeader>
          <CardTitle className="text-base font-heading">Transaction History</CardTitle>
          <CardDescription className="text-xs">
            Showing transaction logs matching{' '}
            <code className="bg-black/40 px-1 py-0.5 rounded text-purple-300 font-mono text-[10px]">
              {user?.role === 'ADMIN'
                ? 'SELECT * FROM payments;'
                : `SELECT * FROM payments WHERE user_email = '${user?.email}';`}
            </code>
          </CardDescription>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-white/5 bg-white/2 text-gray-400 font-semibold uppercase tracking-wider">
                <th className="px-6 py-4.5">Payment ID</th>
                <th className="px-6 py-4.5">Gateway Reference</th>
                <th className="px-6 py-4.5">Subscription ID</th>
                <th className="px-6 py-4.5">Plan</th>
                <th className="px-6 py-4.5">Amount</th>
                <th className="px-6 py-4.5">Transaction Date</th>
                <th className="px-6 py-4.5">Status</th>
                <th className="px-6 py-4.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-medium">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-mono">
                    // Payment gateway transaction history empty
                  </td>
                </tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4.5 font-mono text-gray-400">{payment.id}</td>
                    <td className="px-6 py-4.5 font-mono text-gray-500">
                      <div className="text-[10px] text-gray-400">Ord: {payment.razorpayOrderId}</div>
                      <div className="text-[9px] text-gray-500 font-semibold">Pay: {payment.razorpayPaymentId || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4.5 font-mono text-gray-400">{payment.subscriptionId}</td>
                    <td className="px-6 py-4.5 font-semibold text-[#a78bfa]">{payment.plan || 'N/A'}</td>
                    <td className="px-6 py-4.5 font-bold text-white light-theme:text-gray-900">
                      ₹{payment.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4.5 text-gray-400 font-mono">
                      {new Date(payment.paymentDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4.5">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                        ['SUCCESS', 'Success'].includes(payment.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        ['FAILED', 'Failed'].includes(payment.status) ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4.5 text-right">
                      {['SUCCESS', 'Success'].includes(payment.status) ? (
                        <button
                          onClick={() => handleViewReceipt(payment.id)}
                          disabled={receiptLoadingId === payment.id}
                          className="px-2.5 py-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 hover:border-purple-500/50 hover:bg-purple-500/20 text-purple-300 hover:text-purple-200 transition-all font-semibold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                          title="Generate payment receipt invoice"
                        >
                          {receiptLoadingId === payment.id ? (
                            <RotateCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <FileText className="h-3.5 w-3.5" />
                          )}
                          View Receipt
                        </button>
                      ) : (
                        <span className="text-[10px] text-gray-500 font-mono italic">// no receipt</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Receipt Modal */}
      <AnimatePresence>
        {selectedReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg overflow-hidden border border-white/10 rounded-2xl bg-[#0b0b1e] text-white shadow-2xl p-6 md:p-8"
            >
              {/* Receipt Header */}
              <div className="flex justify-between items-start border-b border-white/5 pb-4.5">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                    <Receipt className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-lg text-white">Payment Receipt</h3>
                    <p className="text-[10px] text-gray-400 font-mono mt-0.5">{selectedReceipt.receiptNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 rounded-lg border border-white/5 hover:border-white/10 bg-white/5 text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>

              {/* Receipt Body */}
              <div className="py-6 space-y-6 text-xs">
                {/* Info block */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Billed To</span>
                    <p className="text-white font-medium mt-1 truncate">{selectedReceipt.customerEmail || user?.email || selectedReceipt.userEmail}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Payment Date</span>
                    <p className="text-white font-medium mt-1 font-mono">{new Date(selectedReceipt.date).toLocaleString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Transaction ID</span>
                    <p className="text-white font-mono mt-1 font-medium select-all truncate">{selectedReceipt.transactionId}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-500 font-bold uppercase tracking-wider text-[9px]">Order ID</span>
                    <p className="text-white font-mono mt-1 font-medium select-all truncate">{selectedReceipt.orderId}</p>
                  </div>
                </div>

                {/* Plan details table */}
                <div className="border border-white/5 rounded-xl bg-white/2 overflow-hidden">
                  <div className="grid grid-cols-3 bg-white/5 p-3 text-[10px] font-bold text-gray-400 uppercase">
                    <span className="col-span-2">Description</span>
                    <span className="text-right">Amount</span>
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="grid grid-cols-3 font-medium">
                      <span className="col-span-2 text-white">SubVault Subscription Plan: <strong className="text-purple-400 font-semibold">{selectedReceipt.plan || 'Pro Tier'}</strong></span>
                      <span className="text-right text-white font-mono">₹{Math.round(selectedReceipt.amountPaid / 1.18).toLocaleString()}.00</span>
                    </div>
                    <div className="grid grid-cols-3 text-gray-400 font-medium">
                      <span className="col-span-2">GST (18% Integrated Tax)</span>
                      <span className="text-right font-mono">₹{Math.round(selectedReceipt.amountPaid - selectedReceipt.amountPaid / 1.18).toLocaleString()}.00</span>
                    </div>
                  </div>
                  <div className="border-t border-white/5 bg-white/2 p-3 grid grid-cols-3 font-bold">
                    <span className="col-span-2 text-white text-sm">Total Paid</span>
                    <span className="text-right text-purple-400 text-sm font-mono">₹{selectedReceipt.amountPaid.toLocaleString()}.00</span>
                  </div>
                </div>

                {/* Footer notes */}
                <div className="border-t border-white/5 pt-4 space-y-2 text-[10px] text-gray-400 font-medium">
                  <div className="flex justify-between">
                    <span>Merchant Entity:</span>
                    <span className="text-white">{selectedReceipt.company}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Registered Address:</span>
                    <span className="text-white text-right max-w-[200px] truncate" title={selectedReceipt.address}>{selectedReceipt.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GSTIN Identification:</span>
                    <span className="text-white font-mono">{selectedReceipt.gstin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Contact / Support:</span>
                    <span className="text-purple-400 font-mono select-all">{selectedReceipt.supportEmail}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-white/5 pt-4 flex gap-3">
                <button
                  onClick={() => {
                    addLog('Billing Service', `Printed/saved receipt ${selectedReceipt.receiptNumber}`, 'success');
                    window.print();
                  }}
                  className="flex-1 py-2 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:border-purple-500/50 text-xs font-bold text-purple-300 hover:text-purple-200 transition-all cursor-pointer text-center"
                >
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="px-4 py-2 rounded-xl border border-white/5 hover:border-white/10 bg-white/5 text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
