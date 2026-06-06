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
import { QRCodeSVG } from 'qrcode.react';

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

  // Credit Card Form States (Stripe Simulator)
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // Razorpay Specific States (Inline Simulator)
  const [razorpayMethod, setRazorpayMethod] = useState<'upi' | 'netbanking'>('upi');
  const [razorpayUpiVpa, setRazorpayUpiVpa] = useState('success@upi');
  const [selectedBank, setSelectedBank] = useState('HDFC');

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

  // Set card holder name once user is loaded
  useEffect(() => {
    if (user?.name) {
      setCardName(user.name);
    }
  }, [user]);

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

  const upiId = import.meta.env.VITE_UPI_ID || '9752146879@ptaxis';
  const upiName = import.meta.env.VITE_UPI_NAME || 'Ruby Singh';
  // Note: We omit the '&am=' amount parameter for personal UPI IDs to ensure scanning always works in Google Pay, PhonePe, and Paytm.
  const upiUrl = `upi://pay?pa=${upiId}&pn=${encodeURIComponent(upiName)}&cu=INR&tn=${encodeURIComponent(selectedPlan + ' ' + billingInterval + ' SubVault')}`;


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

  // ── Card Form Formatters & Brand Detectors ──────────────────────────────────
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

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'visa';
    if (/^5[1-5]/.test(clean)) return 'mastercard';
    if (/^3[47]/.test(clean)) return 'amex';
    return 'generic';
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
          if (!data.url.includes('mock_checkout=true')) {
            addLog('Billing Service', `Redirecting to Stripe Checkout...`, 'info');
            window.location.href = data.url;
            return;
          }
        }

        // Inline Stripe Simulator Mode
        addLog('Billing Service', `Offline mode: Preparing interactive Stripe Card simulator.`, 'info');
        setCurrentStep('payment');
        setIsProcessing(false);
      } else {
        // Razorpay flow
        addLog('Billing Service', `Initiating Razorpay subscription check for ${selectedPlan} (${billingInterval})`, 'info');

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
            addLog('Billing Service', `Offline mode: Preparing inline Razorpay simulator.`, 'info');
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
          addLog('Billing Service', `Offline mode: Preparing inline Razorpay simulator.`, 'info');
          setRazorpayCheckoutData({
            amount: pricing.total,
            plan: selectedPlan,
            interval: billingInterval,
            subscriptionId: `sub_mock_rzp_${Math.random().toString(36).substring(2, 10)}`,
            mock: true,
          });
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

  // ── Stripe Mock Success/Failure Handlers ─────────────────────────────────────
  const handleStripeMockSuccess = async () => {
    setIsProcessing(true);
    setCurrentStep('processing');
    addLog('Billing Service', `Simulating Stripe checkout success for ${selectedPlan} (${billingInterval})`, 'info');

    try {
      const response = await fetch('/api/stripe/simulate-webhook', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ plan: selectedPlan, interval: billingInterval }),
      }).catch(() => null);

      const data = response ? await response.json() : null;

      if (data && data.success) {
        addLog('Subscription Service', `Stripe Mock subscription activated successfully!`, 'success');
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => navigate('/dashboard'), 1500);
      } else {
        // Fallback local subscription
        addLog('Subscription Service', 'Offline Mode: Generating mock subscription locally.', 'success');
        createSubscription(user?.email || 'user@company.com', selectedPlan, billingInterval);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      // Fallback local subscription
      addLog('Subscription Service', 'Offline Mode: Generating mock subscription locally.', 'success');
      createSubscription(user?.email || 'user@company.com', selectedPlan, billingInterval);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => navigate('/dashboard'), 1500);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStripeMockFailure = () => {
    setIsProcessing(true);
    setCurrentStep('processing');
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('payment');
      setError('Card payment declined. Insufficient funds or card validation error.');
      addLog('Billing Service', 'Stripe Mock charge failed: card_declined', 'error');
    }, 1200);
  };

  // ── Razorpay Mock Success Handler ───────────────────────────────────────
  const handleMockRazorpaySuccess = async (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => {
    const targetSubId = razorpayCheckoutData?.subscriptionId || `sub_mock_rzp_${Math.random().toString(36).substring(2, 10)}`;
    const targetPlan = razorpayCheckoutData?.plan || selectedPlan;
    const targetInterval = razorpayCheckoutData?.interval || billingInterval;

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
          plan: targetPlan,
          interval: targetInterval,
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
        createSubscription(user?.email || 'user@company.com', targetPlan, targetInterval);
        confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      addLog('Subscription Service', 'Offline Mode: Creating subscription locally.', 'success');
      createSubscription(user?.email || 'user@company.com', targetPlan, targetInterval);
      confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
      setTimeout(() => navigate('/dashboard'), 1500);
    }
  };

  const handleRazorpayMockSuccessInline = () => {
    const mockSubId = razorpayCheckoutData?.subscriptionId || `sub_mock_rzp_${Math.random().toString(36).substring(2, 10)}`;
    const mockPayId = `pay_mock_rzp_${Math.random().toString(36).substring(2, 10)}`;
    const mockSig = `sig_mock_rzp_${Math.random().toString(36).substring(2, 10)}`;

    handleMockRazorpaySuccess({
      razorpay_payment_id: mockPayId,
      razorpay_subscription_id: mockSubId,
      razorpay_signature: mockSig,
    });
  };

  const handleRazorpayMockFailureInline = () => {
    setIsProcessing(true);
    setCurrentStep('processing');
    setTimeout(() => {
      setIsProcessing(false);
      setCurrentStep('payment');
      setError('Razorpay payment failed. Simulated transaction error.');
      addLog('Billing Service', 'Razorpay Mock charge failed: payment_failed', 'error');
    }, 1200);
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

  // ── Step Navigation ─────────────────────────────────────────────────────
  const steps: { key: CheckoutStep; label: string; number: number }[] = useMemo(() => {
    return [
      { key: 'review', label: 'Review Plan', number: 1 },
      { key: 'payment', label: 'Payment', number: 2 },
      { key: 'processing', label: 'Confirm', number: 3 },
    ];
  }, []);

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
                      Secure Payment Portal
                    </h2>
                    <p className="text-sm text-gray-400">
                      Select your preferred payment gateway and complete the checkout inline.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Tab Sidebar */}
                    <div className="md:col-span-4 flex flex-row md:flex-col gap-2.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
                      {[
                        { id: 'stripe', label: 'Credit/Debit Card', sub: 'Secure Stripe sandbox', icon: <CreditCard className="h-4 w-4" /> },
                        { id: 'razorpay', label: 'UPI & Netbanking', sub: 'Razorpay checkout', icon: <Zap className="h-4 w-4" /> },
                        { id: 'qr', label: 'Direct UPI QR Scan', sub: 'Scan & Pay instantly', icon: <QrCode className="h-4 w-4" /> }
                      ].map((tab) => {
                        const isSelected = paymentGateway === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => {
                              setPaymentGateway(tab.id as 'stripe' | 'razorpay' | 'qr');
                              setError(null);
                            }}
                            className={`flex items-center gap-3.5 p-4 rounded-xl border text-left cursor-pointer transition-all duration-300 min-w-[210px] md:min-w-0 flex-shrink-0 ${
                              isSelected
                                ? 'border-purple-500/40 bg-purple-500/10 text-white shadow-lg shadow-purple-500/5'
                                : 'border-white/5 bg-black/30 text-gray-400 hover:text-white hover:border-white/10'
                            }`}
                          >
                            <div className={`p-2.5 rounded-lg transition-colors ${isSelected ? 'bg-purple-500/20 text-purple-400' : 'bg-white/5 text-gray-400'}`}>
                              {tab.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate leading-snug">{tab.label}</p>
                              <p className="text-[10px] text-gray-500 truncate leading-normal mt-1">{tab.sub}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Right Column: Tab Panels */}
                    <div className="md:col-span-8 glass-panel rounded-2xl border border-white/5 bg-black/40 p-6 min-h-[460px] flex flex-col justify-between">
                      {paymentGateway === 'stripe' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <CreditCard className="h-4 w-4 text-purple-400" />
                              Stripe Credit / Debit Card Simulator
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-1">
                              Experience our interactive 3D card preview and live sandbox simulation.
                            </p>
                          </div>

                          {/* 3D Credit Card Preview */}
                          <div className="w-full max-w-[340px] mx-auto h-[190px] mb-6" style={{ perspective: '1000px' }}>
                            <div 
                              className="relative w-full h-full rounded-2xl transition-transform duration-700" 
                              style={{ 
                                transformStyle: 'preserve-3d', 
                                transform: isCardFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)' 
                              }}
                            >
                              {/* Card Front */}
                              <div 
                                className="absolute inset-0 w-full h-full rounded-2xl p-5 bg-gradient-to-br from-purple-600/90 to-indigo-600/90 border border-white/15 flex flex-col justify-between shadow-xl"
                                style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
                              >
                                <div className="flex justify-between items-start">
                                  {/* Chip */}
                                  <div className="h-8 w-11 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center relative overflow-hidden">
                                    <div className="absolute inset-1.5 border border-amber-500/40 rounded-sm" />
                                    <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-amber-500/30" />
                                    <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-amber-500/30" />
                                  </div>
                                  {/* Brand */}
                                  <div className="text-white font-extrabold text-[10px] tracking-widest uppercase bg-white/10 px-2 py-0.5 rounded border border-white/10">
                                    {getCardBrand(cardNumber) === 'visa' && 'VISA'}
                                    {getCardBrand(cardNumber) === 'mastercard' && 'MASTERCARD'}
                                    {getCardBrand(cardNumber) === 'amex' && 'AMEX'}
                                    {getCardBrand(cardNumber) === 'generic' && 'SECURE CARD'}
                                  </div>
                                </div>

                                <div className="text-lg font-mono tracking-[0.2em] text-white/90 text-center my-3">
                                  {cardNumber || '•••• •••• •••• ••••'}
                                </div>

                                <div className="flex justify-between items-end">
                                  <div className="min-w-0 flex-1 pr-2">
                                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-wider block">Card Holder</span>
                                    <span className="text-xs font-semibold text-white truncate block">
                                      {cardName.toUpperCase() || 'YOUR NAME'}
                                    </span>
                                  </div>
                                  <div className="flex-shrink-0 text-right">
                                    <span className="text-[8px] font-bold text-white/50 uppercase tracking-wider block">Expires</span>
                                    <span className="text-xs font-semibold text-white font-mono block">
                                      {cardExpiry || 'MM/YY'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Card Back */}
                              <div 
                                className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-indigo-950 to-purple-950 border border-white/15 flex flex-col justify-between py-5 shadow-xl"
                                style={{ 
                                  backfaceVisibility: 'hidden', 
                                  WebkitBackfaceVisibility: 'hidden', 
                                  transform: 'rotateY(180deg)' 
                                }}
                              >
                                <div className="w-full h-8 bg-black/60" />
                                <div className="px-5">
                                  <div className="flex justify-between items-center bg-white/5 rounded px-2.5 py-1 border border-white/5">
                                    <span className="text-[8px] font-bold text-white/30 uppercase tracking-widest font-mono">CVV SIGNATURE</span>
                                    <span className="bg-white text-black px-2 py-0.5 rounded text-xs font-mono font-bold">
                                      {cardCvv || '•••'}
                                    </span>
                                  </div>
                                </div>
                                <div className="px-5 text-[8px] text-white/40 leading-tight">
                                  This is a simulated sandbox secure checkout transaction card. No funds will be charged.
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Card Input Fields */}
                          <div className="space-y-4">
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                Card Number
                              </label>
                              <div className="relative">
                                <input
                                  type="text"
                                  placeholder="4111 1111 1111 1111"
                                  maxLength={19}
                                  value={cardNumber}
                                  onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                                />
                                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500">
                                  <CreditCard className="h-4 w-4" />
                                </div>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                  Expiry Date
                                </label>
                                <input
                                  type="text"
                                  placeholder="MM/YY"
                                  maxLength={5}
                                  value={cardExpiry}
                                  onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                  CVV
                                </label>
                                <input
                                  type="text"
                                  placeholder="123"
                                  maxLength={3}
                                  value={cardCvv}
                                  onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                                  onFocus={() => setIsCardFlipped(true)}
                                  onBlur={() => setIsCardFlipped(false)}
                                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                Cardholder Name
                              </label>
                              <input
                                type="text"
                                placeholder="Enter cardholder name"
                                value={cardName}
                                onChange={(e) => setCardName(e.target.value)}
                                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                              />
                            </div>
                          </div>

                          {/* Simulation Actions */}
                          <div className="pt-2 space-y-3">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={handleStripeMockSuccess}
                                disabled={isProcessing || !cardNumber || !cardExpiry || !cardCvv}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Pay & Simulate Success
                              </button>
                              <button
                                type="button"
                                onClick={handleStripeMockFailure}
                                disabled={isProcessing || !cardNumber}
                                className="px-4 py-3 rounded-xl border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
                              >
                                Simulate Failure
                              </button>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <span className="text-[9px] text-gray-500">Need real API checkout?</span>
                              <button
                                type="button"
                                onClick={handleProceedToPayment}
                                className="text-[10px] text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Lock className="h-3 w-3" />
                                Initiate Stripe Gateway Redirect →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentGateway === 'razorpay' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <Zap className="h-4 w-4 text-emerald-400" />
                              Razorpay UPI & Netbanking Simulator
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-1">
                              Simulate Razorpay transactions using local state or call Razorpay SDK.
                            </p>
                          </div>

                          {/* Method Selector Tabs */}
                          <div className="flex p-1 rounded-xl bg-black/30 border border-white/5">
                            <button
                              type="button"
                              onClick={() => setRazorpayMethod('upi')}
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                razorpayMethod === 'upi'
                                  ? 'bg-emerald-600 text-white shadow-md'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              UPI ID
                            </button>
                            <button
                              type="button"
                              onClick={() => setRazorpayMethod('netbanking')}
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                razorpayMethod === 'netbanking'
                                  ? 'bg-emerald-600 text-white shadow-md'
                                  : 'text-gray-400 hover:text-white'
                              }`}
                            >
                              Netbanking
                            </button>
                          </div>

                          {/* Razorpay Method Forms */}
                          {razorpayMethod === 'upi' ? (
                            <div className="space-y-4">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                  UPI VPA ID
                                </label>
                                <input
                                  type="text"
                                  value={razorpayUpiVpa}
                                  onChange={(e) => setRazorpayUpiVpa(e.target.value)}
                                  placeholder="e.g. success@upi"
                                  className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-sm font-mono"
                                />
                              </div>

                              {/* Popular Apps */}
                              <div className="space-y-1.5">
                                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block">Popular Apps</span>
                                <div className="grid grid-cols-4 gap-2">
                                  {[
                                    { name: 'GPay', vpa: 'success@upi' },
                                    { name: 'PhonePe', vpa: 'success@ybl' },
                                    { name: 'Paytm', vpa: 'success@paytm' },
                                    { name: 'BHIM', vpa: 'success@upi' }
                                  ].map((app) => (
                                    <button
                                      key={app.name}
                                      type="button"
                                      onClick={() => setRazorpayUpiVpa(app.vpa)}
                                      className={`py-2 px-1 rounded-lg border text-center text-[10px] font-semibold transition-all cursor-pointer ${
                                        razorpayUpiVpa === app.vpa
                                          ? 'border-emerald-500 bg-emerald-500/10 text-white'
                                          : 'border-white/5 bg-white/5 text-gray-400 hover:text-white hover:border-white/10'
                                      }`}
                                    >
                                      {app.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-4">
                              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">
                                Select Bank
                              </label>
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {['HDFC', 'SBI', 'ICICI', 'AXIS', 'KOTAK', 'PNB'].map((bank) => (
                                  <button
                                    key={bank}
                                    type="button"
                                    onClick={() => setSelectedBank(bank)}
                                    className={`py-3 px-2 rounded-xl border text-center text-xs font-bold transition-all cursor-pointer ${
                                      selectedBank === bank
                                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                                        : 'border-white/5 bg-white/5 text-gray-400 hover:text-white hover:border-white/10'
                                    }`}
                                  >
                                    {bank} Bank
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Simulation Actions */}
                          <div className="pt-2 space-y-3">
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={handleRazorpayMockSuccessInline}
                                disabled={isProcessing || (razorpayMethod === 'upi' && !razorpayUpiVpa)}
                                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-[0_0_15px_rgba(16,185,129,0.15)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                              >
                                <Check className="h-3.5 w-3.5" />
                                Simulate Razorpay Success
                              </button>
                              <button
                                type="button"
                                onClick={handleRazorpayMockFailureInline}
                                disabled={isProcessing}
                                className="px-4 py-3 rounded-xl border border-rose-500/25 bg-rose-500/5 hover:bg-rose-500/10 text-rose-300 font-bold text-xs transition-all cursor-pointer disabled:opacity-40"
                              >
                                Fail
                              </button>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-white/5">
                              <span className="text-[9px] text-gray-500">Need real API checkout?</span>
                              <button
                                type="button"
                                onClick={handleProceedToPayment}
                                className="text-[10px] text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Lock className="h-3 w-3" />
                                Launch Razorpay SDK overlay →
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {paymentGateway === 'qr' && (
                        <div className="space-y-6">
                          <div>
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                              <QrCode className="h-4 w-4 text-purple-400" />
                              Scan QR & Pay (Direct UPI)
                            </h3>
                            <p className="text-[11px] text-gray-400 mt-1">
                              Scan this dynamic UPI QR code with any UPI app, complete payment, and enter the UTR/Transaction Ref.
                            </p>
                          </div>

                          {/* QR Code Section */}
                          <div className="flex flex-col sm:flex-row gap-5 items-center bg-black/20 border border-white/5 p-4 rounded-xl">
                            {/* QR Code Image */}
                            <div className="p-3 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/5 flex-shrink-0">
                              <QRCodeSVG
                                value={upiUrl}
                                size={130}
                                bgColor="#ffffff"
                                fgColor="#000000"
                                level="L"
                              />
                            </div>

                            {/* Details */}
                            <div className="flex-1 w-full text-left space-y-3.5">
                              <div>
                                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">Payee UPI ID</span>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <code className="text-xs text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded font-mono border border-purple-500/10">
                                    {upiId}
                                  </code>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      navigator.clipboard.writeText(upiId);
                                      addLog('Billing Service', 'UPI ID copied to clipboard.', 'info');
                                    }}
                                    className="px-2 py-0.5 bg-white/5 hover:bg-white/10 border border-white/5 rounded text-[9px] font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
                                  >
                                    Copy
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">Payee Name</span>
                                  <span className="text-xs text-white font-semibold">{upiName}</span>
                                </div>
                                <div>
                                  <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest block">Amount To Pay</span>
                                  <span className="text-xs text-emerald-400 font-extrabold">₹{pricing.total.toLocaleString('en-IN')}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* UTR Input */}
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
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
                              className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono placeholder-gray-600 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all text-sm"
                            />
                            {utrError && (
                              <p className="text-xs text-rose-400 mt-1 flex items-center gap-1">
                                <AlertCircle className="h-3.5 w-3.5 animate-pulse" />
                                {utrError}
                              </p>
                            )}
                          </div>

                          {/* Action button */}
                          <div className="pt-2">
                            <motion.button
                              whileHover={{ scale: 1.01 }}
                              whileTap={{ scale: 0.99 }}
                              onClick={handleQrPaymentSubmit}
                              disabled={isProcessing || utrNumber.length !== 12}
                              className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(124,58,237,0.25)] hover:shadow-[0_0_30px_rgba(124,58,237,0.4)] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {isProcessing ? (
                                <>
                                  <div className="h-3.5 w-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                  Verifying Transaction...
                                </>
                              ) : (
                                <>
                                  <Check className="h-3.5 w-3.5" />
                                  Verify UTR & Activate
                                </>
                              )}
                            </motion.button>
                          </div>
                        </div>
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

                  {/* Bottom Navigation Buttons */}
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStep('review');
                        setError(null);
                      }}
                      className="px-6 py-3.5 rounded-xl border border-white/10 bg-black/20 text-gray-400 hover:text-white hover:border-white/20 text-sm font-semibold transition-all cursor-pointer"
                    >
                      ← Back
                    </button>
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
