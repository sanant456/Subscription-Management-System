import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  CreditCard,
  Shield,
  Lock,
  Zap,
  Crown,
  Sparkles,
  Building2,
  CircleCheck,
  AlertCircle,
  ServerCrash,
  QrCode,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSubscription } from '../context/SubscriptionContext';
import type { PlanType, BillingInterval } from '../context/SubscriptionContext';
import { PLAN_PRICES, getPlanDisplayPrice } from '../shared/pricing';
import { MockRazorpayModal } from '../components/MockRazorpayModal';
import confetti from 'canvas-confetti';

// ── Plan Feature Lists ─────────────────────────────────────────────────────────
const PLAN_FEATURES: Record<PlanType, { included: string[]; excluded: string[] }> = {
  Basic: {
    included: [
      'Up to 100 subscribers',
      'Basic invoicing templates',
      'Standard 4-day retry schedule',
      'Email support',
    ],
    excluded: [
      'Smart retry schedules (ML)',
      'Custom API gateway keys',
      'Dedicated support manager',
    ],
  },
  Pro: {
    included: [
      'Up to 2,500 subscribers',
      'Custom invoice styling & branding',
      'Smart ML retry logic (5 attempts)',
      'Webhooks & integrations',
      'Priority email support',
    ],
    excluded: [
      'Multi-tenant gateway RBAC',
      'Dedicated database sync tunnels',
    ],
  },
  Enterprise: {
    included: [
      'Unlimited subscribers',
      'Dedicated database sync tunnels',
      '99.999% SLA uptime contract',
      'Dedicated developer support manager',
      'Custom API gateway keys',
      'Multi-tenant gateway RBAC',
      'SSO & advanced security',
    ],
    excluded: [],
  },
};

const PLAN_ICONS: Record<PlanType, React.ReactNode> = {
  Basic: <Zap className="h-5 w-5" />,
  Pro: <Crown className="h-5 w-5" />,
  Enterprise: <Building2 className="h-5 w-5" />,
};

const PLAN_COLORS: Record<PlanType, { accent: string; bg: string; border: string; glow: string }> = {
  Basic: {
    accent: 'text-cyan-400',
    bg: 'bg-cyan-500/10',
    border: 'border-cyan-500/30',
    glow: 'from-cyan-500/20 via-transparent to-transparent',
  },
  Pro: {
    accent: 'text-purple-400',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/30',
    glow: 'from-purple-500/20 via-transparent to-transparent',
  },
  Enterprise: {
    accent: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    glow: 'from-amber-500/20 via-transparent to-transparent',
  },
};

const GST_RATE = 0.18;

// ── Step Type ──────────────────────────────────────────────────────────────────
type CheckoutStep = 'review' | 'payment' | 'qr-scan' | 'processing';

export const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, token } = useAuth();
  const { addLog, createSubscription } = useSubscription();

  // ── Read initial plan/interval from URL ─────────────────────────────────
  const [selectedPlan, setSelectedPlan] = useState<PlanType>(() => {
    const p = searchParams.get('plan');
    if (p === 'Basic' || p === 'Pro' || p === 'Enterprise') return p;
    return 'Pro';
  });

  const [billingInterval, setBillingInterval] = useState<BillingInterval>(() => {
    const i = searchParams.get('interval');
    if (i === 'monthly' || i === 'yearly') return i;
    return 'monthly';
  });

  const [currentStep, setCurrentStep] = useState<CheckoutStep>('review');
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay' | 'qr'>('stripe');
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Razorpay modal state
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayCheckoutData, setRazorpayCheckoutData] = useState<{
    amount: number;
    plan: PlanType;
    interval: BillingInterval;
    subscriptionId: string;
    mock: boolean;
    keyId?: string;
  } | null>(null);

  // Sync URL params when plan/interval changes
  useEffect(() => {
    setSearchParams({ plan: selectedPlan, interval: billingInterval }, { replace: true });
  }, [selectedPlan, billingInterval, setSearchParams]);

  // ── Price Calculations ──────────────────────────────────────────────────
  const pricing = useMemo(() => {
    const subtotal = PLAN_PRICES[selectedPlan][billingInterval];
    const gst = Math.round(subtotal * GST_RATE);
    const total = subtotal + gst;
    return { subtotal, gst, total };
  }, [selectedPlan, billingInterval]);

  const upiId = import.meta.env.VITE_UPI_ID || 'anantsingh@upi';
  const upiName = import.meta.env.VITE_UPI_NAME || 'Anant Singh';
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&am=${pricing.total}&cu=INR&tn=${encodeURIComponent(selectedPlan + ' ' + billingInterval + ' SubVault')}`;


  // ── Razorpay Script Loader ──────────────────────────────────────────────
  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if ('Razorpay' in window) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ── Handle Payment ──────────────────────────────────────────────────────
  const handleProceedToPayment = async () => {
    setError(null);
    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      if (paymentGateway === 'stripe') {
        addLog('Billing Service', `Initiating Stripe checkout for ${selectedPlan} (${billingInterval})`, 'info');

        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plan: selectedPlan, interval: billingInterval }),
        }).catch(() => null);

        let data = null;
        if (response && response.ok) {
          try {
            data = await response.json();
          } catch (e) {
            console.error('Failed to parse Stripe checkout response:', e);
          }
        }

        if (data && data.success && data.url) {
          addLog('Billing Service', `Redirecting to Stripe Checkout...`, 'info');
          window.location.href = data.url;
        } else {
          // Mock fallback
          addLog('Billing Service', `Offline mode: Simulating Stripe checkout for ${selectedPlan} (${billingInterval})`, 'info');
          window.location.href = `/dashboard?mock_checkout=true&plan=${selectedPlan}&interval=${billingInterval}`;
        }
      } else {
        // Razorpay flow
        addLog('Billing Service', `Initiating Razorpay checkout for ${selectedPlan} (${billingInterval})`, 'info');

        const response = await fetch('/api/razorpay/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ plan: selectedPlan, interval: billingInterval }),
        }).catch(() => null);

        let data = null;
        if (response && response.ok) {
          try {
            data = await response.json();
          } catch (e) {
            console.error('Failed to parse Razorpay subscription response:', e);
          }
        }

        if (data && data.success) {
          if (data.mock) {
            setRazorpayCheckoutData({
              amount: data.amount,
              plan: data.plan,
              interval: data.interval,
              subscriptionId: data.subscriptionId,
              mock: true,
            });
            setIsRazorpayModalOpen(true);
            setCurrentStep('payment');
            setIsProcessing(false);
          } else {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
              setError('Failed to load Razorpay Checkout SDK. Check your network.');
              setCurrentStep('payment');
              setIsProcessing(false);
              return;
            }

            const options = {
              key: data.keyId,
              subscription_id: data.subscriptionId,
              name: 'SubVault',
              description: `${data.plan} Subscription (${data.interval})`,
              image: 'https://cdn.pixabay.com/photo/2016/09/20/07/25/arrow-1681944_1280.png',
              handler: async function (paymentRes: {
                razorpay_payment_id: string;
                razorpay_subscription_id: string;
                razorpay_signature: string;
              }) {
                try {
                  setIsProcessing(true);
                  setCurrentStep('processing');
                  addLog('Billing Service', `Verifying Razorpay subscription: ${paymentRes.razorpay_subscription_id}`, 'info');
                  const verifyRes = await fetch('/api/razorpay/verify-subscription', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      razorpay_payment_id: paymentRes.razorpay_payment_id,
                      razorpay_subscription_id: paymentRes.razorpay_subscription_id,
                      razorpay_signature: paymentRes.razorpay_signature,
                      plan: data.plan,
                      interval: data.interval,
                    }),
                  });
                  const verifyData = await verifyRes.json();
                  if (verifyData.success) {
                    addLog('Subscription Service', 'Razorpay subscription activated!', 'success');
                    confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
                    setTimeout(() => navigate('/dashboard'), 1500);
                  } else {
                    setError(verifyData.error || 'Payment verification failed.');
                    setCurrentStep('payment');
                  }
                } catch {
                  setError('Payment verification connection failed.');
                  setCurrentStep('payment');
                } finally {
                  setIsProcessing(false);
                }
              },
              prefill: {
                name: user?.name || '',
                email: user?.email || '',
                contact: '9999999999',
              },
              theme: { color: '#a78bfa' },
            };

            const rzp = new (window as unknown as {
              Razorpay: new (opts: unknown) => {
                on: (event: string, cb: (res: { error: { description: string } }) => void) => void;
                open: () => void;
              };
            }).Razorpay(options);

            rzp.on('payment.failed', function (resp: { error: { description: string } }) {
              addLog('Billing Service', `Razorpay payment failed: ${resp.error.description}`, 'error');
              setError(`Payment failed: ${resp.error.description}`);
              setCurrentStep('payment');
            });

            rzp.open();
            setCurrentStep('payment');
            setIsProcessing(false);
          }
        } else {
          // Backend offline fallback mode
          addLog('Billing Service', `Offline mode: Simulating Razorpay checkout for ${selectedPlan} (${billingInterval})`, 'info');
          setRazorpayCheckoutData({
            amount: pricing.total,
            plan: selectedPlan,
            interval: billingInterval,
            subscriptionId: `sub_mock_rzp_${Math.random().toString(36).substring(2, 10)}`,
            mock: true,
          });
          setIsRazorpayModalOpen(true);
          setCurrentStep('payment');
          setIsProcessing(false);
        }
      }
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error connecting to billing service.';
      setError(errMsg);
      setCurrentStep('payment');
      setIsProcessing(false);
    }
  };

  // ── Razorpay Mock Success Handler ───────────────────────────────────────
  const handleMockRazorpaySuccess = async (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => {
    setIsRazorpayModalOpen(false);
    if (!razorpayCheckoutData) return;

    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      addLog('Billing Service', `Verifying mock Razorpay subscription: ${response.razorpay_subscription_id}`, 'info');
      const verifyRes = await fetch('/api/razorpay/verify-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_signature: response.razorpay_signature,
          plan: razorpayCheckoutData.plan,
          interval: razorpayCheckoutData.interval,
        }),
      }).catch(() => null);

      const verifyData = verifyRes ? await verifyRes.json() : null;

      if (verifyData && verifyData.success) {
        addLog('Subscription Service', 'Mock Razorpay subscription activated!', 'success');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        // Client-side fallback
        addLog('Subscription Service', 'Offline Mode: Creating subscription locally.', 'success');
        createSubscription(user?.email || 'user@company.com', razorpayCheckoutData.plan, razorpayCheckoutData.interval);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch {
      addLog('Subscription Service', 'Offline Mode: Creating subscription locally.', 'success');
      createSubscription(user?.email || 'user@company.com', razorpayCheckoutData.plan, razorpayCheckoutData.interval);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  };

  // ── UPI QR Payment Handler ──────────────────────────────────────────────
  const handleQrPaymentSubmit = async () => {
    if (utrNumber.length !== 12) {
      setUtrError('Please enter a valid 12-digit UPI UTR number.');
      return;
    }
    setUtrError(null);
    setError(null);
    setIsProcessing(true);
    setCurrentStep('processing');

    try {
      addLog('Billing Service', `Submitting QR Code UTR verification: ${utrNumber}`, 'info');

      const response = await fetch('/api/qr/submit-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          plan: selectedPlan,
          interval: billingInterval,
          utr: utrNumber,
          amount: pricing.total,
        }),
      }).catch(() => null);

      const data = response ? await response.json() : null;

      if (data && data.success) {
        addLog('Subscription Service', 'Direct UPI QR payment verified successfully!', 'success');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        const errMsg = data?.error || 'Direct UPI verification failed.';
        addLog('Subscription Service', `Direct QR activation failed: ${errMsg}. Attempting offline activation...`, 'warn');
        createSubscription(user?.email || 'user@company.com', selectedPlan, billingInterval);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      addLog('Subscription Service', 'Connection error. Attempting offline activation...', 'warn');
      createSubscription(user?.email || 'user@company.com', selectedPlan, billingInterval);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => navigate('/dashboard'), 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleProceedClick = () => {
    if (paymentGateway === 'qr') {
      setCurrentStep('qr-scan');
      setError(null);
    } else {
      handleProceedToPayment();
    }
  };

  // ── Step Navigation ─────────────────────────────────────────────────────
  const steps: { key: CheckoutStep; label: string; number: number }[] = useMemo(() => {
    if (paymentGateway === 'qr') {
      return [
        { key: 'review', label: 'Review Plan', number: 1 },
        { key: 'payment', label: 'Payment', number: 2 },
        { key: 'qr-scan', label: 'Scan & Pay', number: 3 },
        { key: 'processing', label: 'Confirm', number: 4 },
      ];
    }
    return [
      { key: 'review', label: 'Review Plan', number: 1 },
      { key: 'payment', label: 'Payment', number: 2 },
      { key: 'processing', label: 'Confirm', number: 3 },
    ];
  }, [paymentGateway]);

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  const planColors = PLAN_COLORS[selectedPlan];

  return (
    <div className="min-h-screen bg-[#050515] relative overflow-hidden">
      {/* Ambient Glow Blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/8 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-600/8 blur-[120px] pointer-events-none" />
      <div className="absolute top-[50%] left-[50%] w-[30%] h-[30%] rounded-full bg-indigo-600/5 blur-[100px] pointer-events-none animate-pulse-slow" />

      {/* ── Top Navigation Bar ──────────────────────────────────────────── */}
      <header className="relative z-20 border-b border-white/5 bg-[#050515]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium cursor-pointer group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </button>

          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center font-heading font-black text-sm text-white">
              S
            </div>
            <span className="font-heading font-bold text-white text-sm tracking-tight hidden sm:inline">
              SubVault
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="h-3.5 w-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* ── Step Progress Bar ───────────────────────────────────────────── */}
      <div className="relative z-20 border-b border-white/5 bg-black/20">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <React.Fragment key={step.key}>
                <div className="flex items-center gap-2.5">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-500 ${
                      index < currentStepIndex
                        ? 'bg-emerald-500 text-white'
                        : index === currentStepIndex
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'bg-white/5 text-gray-600 border border-white/10'
                    }`}
                  >
                    {index < currentStepIndex ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span
                    className={`text-xs font-semibold hidden sm:inline transition-colors ${
                      index <= currentStepIndex ? 'text-white' : 'text-gray-600'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4 h-px relative">
                    <div className="absolute inset-0 bg-white/5" />
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 to-cyan-500"
                      initial={{ width: '0%' }}
                      animate={{
                        width: index < currentStepIndex ? '100%' : '0%',
                      }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ────────────────────────────────────────────────── */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* ── LEFT: Order Summary (sticky) ────────────────────────────── */}
          <div className="lg:col-span-5 lg:order-2">
            <div className="lg:sticky lg:top-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative"
              >
                {/* Glow behind card */}
                <div
                  className={`absolute -inset-1 rounded-3xl bg-gradient-to-br ${planColors.glow} animate-checkout-glow`}
                />

                <div className={`relative glass-panel rounded-2xl border ${planColors.border} overflow-hidden`}>
                  {/* Plan Badge Header */}
                  <div className="px-6 pt-6 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-xl ${planColors.bg} ${planColors.accent} flex items-center justify-center`}>
                          {PLAN_ICONS[selectedPlan]}
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-white text-lg">
                            {selectedPlan} Plan
                          </h3>
                          <p className="text-xs text-gray-400">
                            {billingInterval === 'monthly' ? 'Billed monthly' : 'Billed annually'}
                          </p>
                        </div>
                      </div>
                      {selectedPlan === 'Pro' && (
                        <span className="px-2.5 py-1 bg-gradient-to-r from-purple-600 to-cyan-500 text-white text-[9px] font-bold tracking-wider uppercase rounded-full">
                          Popular
                        </span>
                      )}
                    </div>

                    {/* Billing Interval Toggle */}
                    <div className="flex items-center gap-2 p-1 rounded-xl bg-black/30 border border-white/5">
                      <button
                        onClick={() => setBillingInterval('monthly')}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          billingInterval === 'monthly'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setBillingInterval('yearly')}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          billingInterval === 'yearly'
                            ? 'bg-purple-600 text-white shadow-md'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        Yearly
                        <span className="ml-1 text-[9px] text-cyan-300 font-bold">Save 20%</span>
                      </button>
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="px-6 pb-4">
                    <div className="border-t border-white/5 pt-4">
                      <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                        What's Included
                      </h4>
                      <ul className="space-y-2.5">
                        {PLAN_FEATURES[selectedPlan].included.map((feature) => (
                          <li key={feature} className="flex items-center gap-2.5 text-xs text-gray-300">
                            <CircleCheck className={`h-4 w-4 flex-shrink-0 ${planColors.accent}`} />
                            <span>{feature}</span>
                          </li>
                        ))}
                        {PLAN_FEATURES[selectedPlan].excluded.map((feature) => (
                          <li key={feature} className="flex items-center gap-2.5 text-xs text-gray-600 line-through">
                            <CircleCheck className="h-4 w-4 flex-shrink-0 text-gray-700" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Price Breakdown */}
                  <div className="px-6 pb-6 pt-2">
                    <div className="border-t border-white/5 pt-4 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">
                          {selectedPlan} ({billingInterval})
                        </span>
                        <span className="text-gray-300 font-semibold">
                          {getPlanDisplayPrice(selectedPlan, billingInterval)}
                        </span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">GST (18%)</span>
                        <span className="text-gray-300 font-semibold">
                          ₹{pricing.gst.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="border-t border-white/5 pt-3 flex justify-between">
                        <span className="text-sm font-bold text-white">Total</span>
                        <span className="text-lg font-extrabold text-white font-heading">
                          ₹{pricing.total.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500 text-center">
                        {billingInterval === 'monthly'
                          ? 'Charged every month. Cancel anytime.'
                          : 'Charged once per year. Cancel anytime.'}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Security Badges */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex items-center justify-center gap-6"
              >
                {[
                  { icon: <Shield className="h-4 w-4" />, label: '256-bit SSL' },
                  { icon: <Lock className="h-4 w-4" />, label: 'PCI DSS' },
                  { icon: <ServerCrash className="h-4 w-4" />, label: 'SOC 2' },
                ].map((badge) => (
                  <div
                    key={badge.label}
                    className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-500"
                  >
                    <span className="text-gray-600">{badge.icon}</span>
                    {badge.label}
                  </div>
                ))}
              </motion.div>
            </div>
          </div>

          {/* ── RIGHT: Checkout Steps ───────────────────────────────────── */}
          <div className="lg:col-span-7 lg:order-1">
            <AnimatePresence mode="wait">
              {/* ─── Step 1: Review Plan ────────────────────────────────── */}
              {currentStep === 'review' && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                      Review Your Plan
                    </h2>
                    <p className="text-sm text-gray-400">
                      Confirm your subscription details before proceeding to payment.
                    </p>
                  </div>

                  {/* Plan Selector Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(['Basic', 'Pro', 'Enterprise'] as PlanType[]).map((plan) => {
                      const colors = PLAN_COLORS[plan];
                      const isSelected = selectedPlan === plan;
                      return (
                        <motion.button
                          key={plan}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setSelectedPlan(plan)}
                          className={`relative p-4 rounded-xl border transition-all duration-300 text-left cursor-pointer ${
                            isSelected
                              ? `${colors.border} ${colors.bg} shadow-lg`
                              : 'border-white/5 bg-black/20 hover:border-white/10'
                          }`}
                        >
                          {isSelected && (
                            <motion.div
                              layoutId="plan-check"
                              className="absolute top-3 right-3"
                            >
                              <div className={`h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center`}>
                                <Check className="h-3 w-3 text-white" />
                              </div>
                            </motion.div>
                          )}
                          <div className={`h-8 w-8 rounded-lg ${colors.bg} ${colors.accent} flex items-center justify-center mb-3`}>
                            {PLAN_ICONS[plan]}
                          </div>
                          <h3 className={`font-heading font-bold text-sm ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                            {plan}
                          </h3>
                          <p className={`text-lg font-extrabold mt-1 ${isSelected ? 'text-white' : 'text-gray-400'}`}>
                            {getPlanDisplayPrice(plan, billingInterval)}
                            <span className="text-xs font-normal text-gray-500">
                              /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </p>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Account Info */}
                  <div className="glass-panel rounded-xl p-5 border border-white/5">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                      Account Details
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                          Name
                        </label>
                        <p className="text-sm text-white font-medium">{user?.name || 'User'}</p>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">
                          Email
                        </label>
                        <p className="text-sm text-white font-medium">{user?.email || 'user@example.com'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Continue Button */}
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setCurrentStep('payment');
                      setError(null);
                    }}
                    className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Continue to Payment
                    <ChevronRight className="h-4 w-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* ─── Step 2: Payment Gateway ───────────────────────────── */}
              {currentStep === 'payment' && (
                <motion.div
                  key="payment"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                      Choose Payment Method
                    </h2>
                    <p className="text-sm text-gray-400">
                      Select your preferred payment gateway to complete the subscription.
                    </p>
                  </div>

                  {/* Payment Gateway Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Stripe */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentGateway('stripe')}
                      className={`relative p-6 rounded-xl border transition-all duration-300 text-left cursor-pointer group ${
                        paymentGateway === 'stripe'
                          ? 'border-blue-500/40 bg-blue-500/5 shadow-lg shadow-blue-500/5'
                          : 'border-white/5 bg-black/20 hover:border-white/10'
                      }`}
                    >
                      {paymentGateway === 'stripe' && (
                        <div className="absolute top-4 right-4">
                          <div className="h-5 w-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-4">
                        <svg className="h-6 w-6 fill-current text-blue-400" viewBox="0 0 24 24">
                          <path d="M13.97 10.322c0-.797-.68-1.127-1.83-1.127-1.74 0-3.376.545-4.887 1.411V4.922c1.61-.59 3.523-.923 5.438-.923 4.103 0 6.844 1.94 6.844 5.378 0 4.298-5.908 4.793-5.908 6.47 0 .524.444.823 1.22.823 1.946 0 3.79-.766 5.283-1.636v5.422a10.978 10.978 0 0 1-5.748 1.55c-4.225 0-7.078-1.95-7.078-5.388 0-4.522 6.077-4.992 6.077-6.736z" />
                        </svg>
                      </div>
                      <h3 className={`font-heading font-bold text-base mb-1 ${paymentGateway === 'stripe' ? 'text-white' : 'text-gray-300'}`}>
                        Stripe
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Global payments with credit/debit cards. Supports 135+ currencies.
                      </p>
                      <div className="mt-3 flex items-center gap-1.5">
                        {['Visa', 'MC', 'Amex'].map((card) => (
                          <span
                            key={card}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 text-gray-500 border border-white/5"
                          >
                            {card}
                          </span>
                        ))}
                      </div>
                    </motion.button>

                    {/* Razorpay */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentGateway('razorpay')}
                      className={`relative p-6 rounded-xl border transition-all duration-300 text-left cursor-pointer group ${
                        paymentGateway === 'razorpay'
                          ? 'border-emerald-500/40 bg-emerald-500/5 shadow-lg shadow-emerald-500/5'
                          : 'border-white/5 bg-black/20 hover:border-white/10'
                      }`}
                    >
                      {paymentGateway === 'razorpay' && (
                        <div className="absolute top-4 right-4">
                          <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-4">
                        <CreditCard className="h-6 w-6 text-emerald-400" />
                      </div>
                      <h3 className={`font-heading font-bold text-base mb-1 ${paymentGateway === 'razorpay' ? 'text-white' : 'text-gray-300'}`}>
                        Razorpay
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        India-first payments with UPI, cards, net banking, and wallets.
                      </p>
                      <div className="mt-3 flex items-center gap-1.5">
                        {['UPI', 'Cards', 'NB'].map((method) => (
                          <span
                            key={method}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 text-gray-500 border border-white/5"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </motion.button>

                    {/* UPI QR Code */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setPaymentGateway('qr')}
                      className={`relative p-6 rounded-xl border transition-all duration-300 text-left cursor-pointer group ${
                        paymentGateway === 'qr'
                          ? 'border-purple-500/40 bg-purple-500/5 shadow-lg shadow-purple-500/5'
                          : 'border-white/5 bg-black/20 hover:border-white/10'
                      }`}
                    >
                      {paymentGateway === 'qr' && (
                        <div className="absolute top-4 right-4">
                          <div className="h-5 w-5 rounded-full bg-purple-500 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-4">
                        <QrCode className="h-6 w-6 text-purple-400" />
                      </div>
                      <h3 className={`font-heading font-bold text-base mb-1 ${paymentGateway === 'qr' ? 'text-white' : 'text-gray-300'}`}>
                        UPI QR Code
                      </h3>
                      <p className="text-xs text-gray-500 leading-relaxed">
                        Direct scan and pay to personal UPI. Support GPay, Paytm, UPI apps.
                      </p>
                      <div className="mt-3 flex items-center gap-1.5">
                        {['UPI', 'GPay', 'PhonePe'].map((method) => (
                          <span
                            key={method}
                            className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-white/5 text-gray-500 border border-white/5"
                          >
                            {method}
                          </span>
                        ))}
                      </div>
                    </motion.button>
                  </div>

                  {/* Error Display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2.5"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setCurrentStep('review');
                        setError(null);
                      }}
                      className="px-6 py-3.5 rounded-xl border border-white/10 bg-black/20 text-gray-400 hover:text-white hover:border-white/20 text-sm font-semibold transition-all cursor-pointer"
                    >
                      ← Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleProceedClick}
                      disabled={isProcessing}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          {paymentGateway === 'qr' ? 'Proceed to QR Scan' : `Pay ₹${pricing.total.toLocaleString('en-IN')} with ${paymentGateway === 'stripe' ? 'Stripe' : 'Razorpay'}`}
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 3: QR Scan ────────────────────────────────────── */}
              {currentStep === 'qr-scan' && (
                <motion.div
                  key="qr-scan"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="space-y-6"
                >
                  <div>
                    <h2 className="font-heading text-2xl md:text-3xl font-bold text-white mb-2">
                      Scan & Pay with UPI
                    </h2>
                    <p className="text-sm text-gray-400">
                      Scan the QR code below using any UPI app (GPay, PhonePe, Paytm, BHIM, etc.) and enter the 12-digit transaction UTR/Ref number.
                    </p>
                  </div>

                  <div className="flex flex-col md:flex-row gap-6 items-center glass-panel rounded-xl p-6 border border-white/5 bg-black/20">
                    {/* Left: QR Code container */}
                    <div className="relative p-4 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-purple-500/5">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}`}
                        alt="UPI QR Code"
                        className="h-[180px] w-[180px]"
                      />
                    </div>

                    {/* Right: Payment Instructions & Details */}
                    <div className="flex-1 space-y-4 w-full">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-500 uppercase block">
                          Payee UPI ID
                        </label>
                        <div className="flex items-center gap-2">
                          <code className="text-sm text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md font-mono border border-purple-500/10">
                            {upiId}
                          </code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(upiId);
                              addLog('Billing Service', 'UPI ID copied to clipboard.', 'info');
                            }}
                            className="px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[10px] font-semibold text-gray-300 hover:text-white transition-all cursor-pointer"
                          >
                            Copy UPI ID
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block">
                            Payee Name
                          </label>
                          <p className="text-sm text-white font-semibold">{upiName}</p>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-gray-500 uppercase block">
                            Amount to Pay
                          </label>
                          <p className="text-sm text-emerald-400 font-extrabold">₹{pricing.total.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* UTR Input Form */}
                  <div className="glass-panel rounded-xl p-5 border border-white/5 space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-300 block mb-1.5">
                        Enter 12-Digit Transaction UTR / Ref Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={12}
                        value={utrNumber}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, ''); // Numeric only
                          setUtrNumber(val);
                          if (val.length === 12) setUtrError(null);
                        }}
                        placeholder="e.g. 123456789012"
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                      />
                      {utrError && (
                        <p className="text-xs text-rose-400 mt-1.5 flex items-center gap-1">
                          <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
                          {utrError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Error Display */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2.5"
                      >
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={() => {
                        setCurrentStep('payment');
                        setError(null);
                      }}
                      className="px-6 py-3.5 rounded-xl border border-white/10 bg-black/20 text-gray-400 hover:text-white hover:border-white/20 text-sm font-semibold transition-all cursor-pointer"
                    >
                      ← Back
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={handleQrPaymentSubmit}
                      disabled={isProcessing}
                      className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-sm shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isProcessing ? (
                        <>
                          <div className="h-4 w-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Verifying Transaction...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" />
                          Verify & Activate
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ─── Step 3: Processing ────────────────────────────────── */}
              {currentStep === 'processing' && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col items-center justify-center py-20 text-center"
                >
                  {/* Animated Processing Indicator */}
                  <div className="relative mb-8">
                    <div className="h-20 w-20 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Sparkles className="h-6 w-6 text-purple-400 animate-pulse" />
                    </div>
                  </div>

                  <h2 className="font-heading text-2xl font-bold text-white mb-3">
                    Processing Your Payment
                  </h2>
                  <p className="text-sm text-gray-400 max-w-md">
                    Securely connecting to{' '}
                    {paymentGateway === 'stripe' ? 'Stripe' : 'Razorpay'} payment gateway.
                    Please don't close this window.
                  </p>

                  <div className="mt-8 flex items-center gap-2 text-[10px] text-gray-600 font-semibold">
                    <Lock className="h-3 w-3 text-emerald-600" />
                    Encrypted with 256-bit SSL
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ── Razorpay Mock Modal ──────────────────────────────────────────── */}
      <MockRazorpayModal
        isOpen={isRazorpayModalOpen}
        amount={razorpayCheckoutData?.amount || 0}
        plan={razorpayCheckoutData?.plan || 'Pro'}
        interval={razorpayCheckoutData?.interval || 'monthly'}
        prefillEmail={user?.email || ''}
        prefillName={user?.name || ''}
        onSuccess={handleMockRazorpaySuccess}
        onCancel={() => {
          setIsRazorpayModalOpen(false);
          setRazorpayCheckoutData(null);
        }}
      />
    </div>
  );
};
