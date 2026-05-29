import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, QrCode, Building2, Wallet, X, AlertCircle, CheckCircle2, Shield, Info } from 'lucide-react';

interface MockRazorpayModalProps {
  isOpen: boolean;
  amount: number;
  plan: string;
  interval: string;
  prefillEmail: string;
  prefillName: string;
  onSuccess: (payload: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => void;
  onCancel: () => void;
}

type PaymentMethod = 'card' | 'upi' | 'netbanking' | 'wallet';

export const MockRazorpayModal: React.FC<MockRazorpayModalProps> = ({
  isOpen,
  amount,
  plan,
  interval,
  prefillEmail,
  prefillName,
  onSuccess,
  onCancel,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Card form states
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [cardExpiry, setCardExpiry] = useState('12/30');
  const [cardCvv, setCardCvv] = useState('123');
  const [cardName, setCardName] = useState(prefillName || 'Test Cardholder');

  // UPI VPA state
  const [upiVpa, setUpiVpa] = useState('success@upi');

  // Netbanking state
  const [selectedBank, setSelectedBank] = useState('HDFC');

  // Reset states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setMethod('card');
      setLoading(false);
      setError(null);
      setCardName(prefillName || 'Test Cardholder');
    }
  }, [isOpen, prefillName]);

  if (!isOpen) return null;

  const handlePay = (isSuccessful = true) => {
    setError(null);
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      if (isSuccessful) {
        const mockSubId = `sub_rzp_mock_${Math.random().toString(36).substring(2, 10)}`;
        const mockPayId = `pay_rzp_mock_${Math.random().toString(36).substring(2, 10)}`;
        const mockSig = `sig_rzp_mock_${Math.random().toString(36).substring(2, 10)}`;

        onSuccess({
          razorpay_payment_id: mockPayId,
          razorpay_subscription_id: mockSubId,
          razorpay_signature: mockSig,
        });
      } else {
        setError('Payment verification failed. Simulated transaction error.');
      }
    }, 1200);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length > 0) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark blurred overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onCancel}
          className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        />

        {/* Razorpay Branded Modal */}
        <motion.div
          initial={{ scale: 0.95, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 15, opacity: 0 }}
          className="w-full max-w-[420px] bg-white rounded-xl shadow-2xl overflow-hidden relative z-10 font-sans text-gray-800"
        >
          {/* Top Info Banner - Razorpay Test Mode */}
          <div className="bg-amber-500 text-amber-950 px-4 py-1.5 text-[10px] font-bold text-center uppercase tracking-wider flex items-center justify-center gap-1.5 border-b border-amber-600/20">
            <AlertCircle className="h-3.5 w-3.5" /> Razorpay Sandbox - Simulated Payment Flow
          </div>

          {/* Razorpay Modal Header */}
          <div className="bg-[#0f172a] text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-heading font-black text-lg text-white">
                S
              </div>
              <div>
                <h3 className="font-semibold text-sm leading-tight text-white">SubVault</h3>
                <p className="text-[11px] text-slate-400">
                  {plan} Subscription ({interval})
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">Amount Due</span>
              <span className="text-base font-bold text-emerald-400">₹{amount.toLocaleString('en-IN')}.00</span>
            </div>
          </div>

          {/* Contact Prefill Indicator */}
          <div className="bg-slate-50 border-b border-slate-100 px-5 py-2.5 flex justify-between items-center text-[11px] text-slate-500">
            <span className="truncate max-w-[180px]">{prefillEmail}</span>
            <span className="font-mono text-slate-400">+91 99999 99999</span>
          </div>

          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center min-h-[300px]">
              <div className="h-10 w-10 border-3 border-purple-500/20 border-t-purple-600 rounded-full animate-spin mb-4" />
              <p className="text-xs text-slate-500 font-medium">Processing payment via Razorpay secure sandbox...</p>
            </div>
          ) : (
            <div className="flex min-h-[300px]">
              {/* Sidebar Menu */}
              <div className="w-1/3 bg-slate-50 border-r border-slate-100 flex flex-col">
                <button
                  onClick={() => setMethod('card')}
                  className={`flex flex-col items-center justify-center py-4 border-b border-slate-100 transition-all text-xs font-semibold ${
                    method === 'card' ? 'bg-white text-purple-600 shadow-sm border-r-2 border-r-purple-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <CreditCard className="h-5 w-5 mb-1 text-slate-400 group-hover:text-purple-600" />
                  <span>Card</span>
                </button>
                <button
                  onClick={() => setMethod('upi')}
                  className={`flex flex-col items-center justify-center py-4 border-b border-slate-100 transition-all text-xs font-semibold ${
                    method === 'upi' ? 'bg-white text-purple-600 shadow-sm border-r-2 border-r-purple-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <QrCode className="h-5 w-5 mb-1 text-slate-400" />
                  <span>UPI</span>
                </button>
                <button
                  onClick={() => setMethod('netbanking')}
                  className={`flex flex-col items-center justify-center py-4 border-b border-slate-100 transition-all text-xs font-semibold ${
                    method === 'netbanking' ? 'bg-white text-purple-600 shadow-sm border-r-2 border-r-purple-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Building2 className="h-5 w-5 mb-1 text-slate-400" />
                  <span>Netbanking</span>
                </button>
                <button
                  onClick={() => setMethod('wallet')}
                  className={`flex flex-col items-center justify-center py-4 transition-all text-xs font-semibold ${
                    method === 'wallet' ? 'bg-white text-purple-600 shadow-sm border-r-2 border-r-purple-600' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Wallet className="h-5 w-5 mb-1 text-slate-400" />
                  <span>Wallet</span>
                </button>
              </div>

              {/* Form Content Area */}
              <div className="w-2/3 p-5 flex flex-col justify-between">
                {/* Method 1: Card */}
                {method === 'card' && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Card Details</h4>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Card Number</label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                        maxLength={19}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500 font-mono"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Card Holder Name</label>
                      <input
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500 font-semibold"
                      />
                    </div>
                  </div>
                )}

                {/* Method 2: UPI */}
                {method === 'upi' && (
                  <div className="space-y-4 flex flex-col items-center">
                    <div className="w-full">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">UPI Payment</h4>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Enter UPI ID (VPA)</label>
                        <input
                          type="text"
                          value={upiVpa}
                          onChange={(e) => setUpiVpa(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-purple-500 font-mono"
                        />
                      </div>
                    </div>

                    <div className="h-28 w-28 border border-slate-200 rounded-lg p-1.5 flex items-center justify-center bg-slate-50 relative group">
                      {/* Simulating QR code */}
                      <svg className="h-full w-full text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M3 3h4v4H3zM17 3h4v4h-4zM3 17h4v4H3zM14 14h3v3h-3zM17 17h4v4h-4zM9 9h6v6H9z" />
                      </svg>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-lg cursor-pointer">
                        <span className="text-[9px] text-white font-bold bg-purple-600 px-2 py-0.5 rounded">Scan QR</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-slate-400 text-center">Scan QR code using any UPI app like Google Pay, PhonePe, Paytm</span>
                  </div>
                )}

                {/* Method 3: Netbanking */}
                {method === 'netbanking' && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Bank</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {['HDFC', 'ICICI', 'SBI', 'AXIS', 'KOTAK', 'YES'].map((bank) => (
                        <button
                          key={bank}
                          onClick={() => setSelectedBank(bank)}
                          className={`px-3 py-2 rounded-lg border text-xs font-semibold text-center transition-all cursor-pointer ${
                            selectedBank === bank
                              ? 'border-purple-600 bg-purple-50 text-purple-700'
                              : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {bank} Bank
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Method 4: Wallet */}
                {method === 'wallet' && (
                  <div className="space-y-3.5">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Select Wallet</h4>
                    <div className="space-y-2">
                      {['Paytm Wallet', 'PhonePe Wallet', 'Mobikwik', 'Freecharge'].map((w) => (
                        <button
                          key={w}
                          onClick={() => handlePay(true)}
                          className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:border-purple-300 hover:bg-slate-50 text-xs font-semibold text-slate-600 transition-all text-left cursor-pointer"
                        >
                          <span>{w}</span>
                          <span className="text-[10px] text-slate-400">Pay Now</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-4 border-t border-slate-100 mt-4 space-y-2">
                  {error && (
                    <div className="text-[11px] text-red-500 flex items-center gap-1.5 bg-red-50 p-2 rounded-lg border border-red-100">
                      <Info className="h-3 w-3 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  {method !== 'wallet' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePay(false)}
                        className="w-1/3 py-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-100 rounded-lg text-xs font-bold transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Fail
                      </button>
                      <button
                        onClick={() => handlePay(true)}
                        className="w-2/3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold shadow-md shadow-purple-200 active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Pay ₹{amount.toLocaleString('en-IN')}.00
                      </button>
                    </div>
                  )}

                  <button
                    onClick={onCancel}
                    className="w-full py-1 text-center text-slate-400 hover:text-slate-600 text-[10px] font-bold tracking-wide uppercase transition-colors cursor-pointer"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Secure Trust Footer */}
          <div className="bg-slate-50 border-t border-slate-100 px-5 py-3 text-center flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
            <Shield className="h-3.5 w-3.5 text-slate-400" />
            <span>Securely simulated checkout processed with 256-bit encryption</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
