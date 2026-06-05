import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Menu, Sparkles, ShieldAlert } from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import type { PlanType, BillingInterval, Subscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { AdminPanel } from '../components/AdminPanel';
import { MockRazorpayModal } from '../components/MockRazorpayModal';

// Subcomponents
import { DashboardSidebar } from './dashboard/DashboardSidebar';
import { OverviewTab } from './dashboard/OverviewTab';
import { SubscriptionsTab } from './dashboard/SubscriptionsTab';
import { BillingTab } from './dashboard/BillingTab';
import { ApiPlaygroundTab } from './dashboard/ApiPlaygroundTab';
import { MonitorsTab } from './dashboard/MonitorsTab';
import { ProrateModal } from './dashboard/ProrateModal';
import { PLAN_PRICES } from '../shared/pricing';

export const Dashboard: React.FC = () => {
  const { user, logout, token } = useAuth();
  
  const {
    theme,
    toggleTheme,
    setActivePage,
    subscriptions,
    invoices,
    systemLogs,
    metrics,
    createSubscription,
    updateSubscriptionStatus,
    updateSubscriptionPlan,
    retryPayment,
    deleteSubscription,
    clearLogs,
    addLog,
  } = useSubscription();

  const [currentTab, setCurrentTab] = useState<'overview' | 'subscriptions' | 'billing' | 'api' | 'monitors' | 'admin'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // WebSocket Live Alert State
  const [broadcastAlert, setBroadcastAlert] = useState<string | null>(null);

  // Proration Modal State
  const [prorateModalOpen, setProrateModalOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [proratePlan, setProratePlan] = useState<PlanType>('Pro');
  const [prorateInterval, setProrateInterval] = useState<BillingInterval>('monthly');

  // Form State
  const [newEmail, setNewEmail] = useState(() => {
    return user && user.role !== 'ADMIN' ? user.email : '';
  });
  const [newPlan, setNewPlan] = useState<PlanType>(() => {
    try {
      const pending = localStorage.getItem('pending_checkout_selection');
      if (pending) {
        const { plan } = JSON.parse(pending);
        if (plan) return plan;
      }
    } catch (e) {
      console.warn("Failed to parse pending checkout plan", e);
    }
    return 'Pro';
  });
  const [newInterval, setNewInterval] = useState<BillingInterval>(() => {
    try {
      const pending = localStorage.getItem('pending_checkout_selection');
      if (pending) {
        const { interval } = JSON.parse(pending);
        if (interval) return interval;
      }
    } catch (e) {
      console.warn("Failed to parse pending checkout interval", e);
    }
    return 'monthly';
  });
  const [paymentGateway, setPaymentGateway] = useState<'stripe' | 'razorpay'>('stripe');
  const [formError, setFormError] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // Razorpay Specific States
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayCheckoutData, setRazorpayCheckoutData] = useState<{
    amount: number;
    plan: PlanType;
    interval: BillingInterval;
    subscriptionId: string;
    mock: boolean;
    keyId?: string;
  } | null>(null);

  useEffect(() => {
    const socket = io({
      autoConnect: true,
      reconnection: true,
    });

    socket.on('broadcast', (data: { message: string }) => {
      setBroadcastAlert(data.message);
      addLog('API Gateway', `Received live broadcast packet: "${data.message}"`, 'info');
    });

    return () => {
      socket.off('broadcast');
      socket.close();
    };
  }, [addLog]);

  // Handle URL checkout redirects & mock checkout simulation webhook triggers
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mockCheckout = params.get('mock_checkout');
    const checkoutStatus = params.get('checkout_status');
    const plan = params.get('plan') as PlanType;
    const interval = params.get('interval') as BillingInterval;

    if (mockCheckout === 'true' && plan && interval) {
      const runSimulation = async () => {
        addLog('Billing Service', `Triggering mock webhook simulation for plan: ${plan} (${interval})`, 'info');
        try {
          const response = await fetch('/api/stripe/simulate-webhook', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ plan, interval })
          }).catch(() => null);
          const data = response ? await response.json() : null;
          if (data && data.success) {
            addLog('Subscription Service', `Mock subscription activated successfully!`, 'success');
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            // Frontend Fallback Mode: Trigger subscription creation directly in local storage
            addLog('Subscription Service', 'Offline Mode: Generating mock subscription registry inside client sandbox.', 'success');
            createSubscription(user?.email || 'user@company.com', plan, interval);
            confetti({
              particleCount: 150,
              spread: 80,
              origin: { y: 0.6 }
            });
            window.history.replaceState({}, document.title, window.location.pathname);
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          }
        } catch (e) {
          addLog('Subscription Service', 'Offline Mode: Generating mock subscription registry inside client sandbox.', 'success');
          createSubscription(user?.email || 'user@company.com', plan, interval);
          confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 }
          });
          window.history.replaceState({}, document.title, window.location.pathname);
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      };
      runSimulation();
    } else if (checkoutStatus === 'success') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      addLog('Billing Service', 'Stripe checkout completed successfully!', 'success');
      window.history.replaceState({}, document.title, window.location.pathname);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else if (checkoutStatus === 'cancel') {
      addLog('Billing Service', 'Stripe checkout cancelled by user.', 'warn');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [token, addLog, createSubscription, user?.email]);

  // Handle URL pending selection
  useEffect(() => {
    const pending = localStorage.getItem('pending_checkout_selection');
    if (pending && token) {
      localStorage.removeItem('pending_checkout_selection');
      try {
        const { plan, interval } = JSON.parse(pending);
        if (plan && interval) {
          addLog('Subscription Service', `Imported pending plan from Landing Page: ${plan} (${interval}). Choose a payment gateway below and complete subscription.`, 'info');
        }
      } catch (e) {
        console.error('Failed to parse pending checkout selection:', e);
      }
    }
  }, [token, addLog]);

  const navigate = useNavigate();

  const handleCreateSub = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newEmail || !newEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    
    if (user?.role === 'ADMIN') {
      createSubscription(newEmail, newPlan, newInterval);
      setNewEmail('');
      addLog('Subscription Service', `Created new subscription from Dashboard Form: ${newEmail}`, 'success');
    } else {
      // Navigate to dedicated checkout page
      navigate(`/checkout?plan=${newPlan}&interval=${newInterval}`);
    }
  };

  const handleMockRazorpaySuccess = async (response: {
    razorpay_payment_id: string;
    razorpay_subscription_id: string;
    razorpay_signature: string;
  }) => {
    setIsRazorpayModalOpen(false);
    if (!razorpayCheckoutData) return;

    setCheckoutLoading(true);
    try {
      addLog('Billing Service', `Verifying mock Razorpay subscription: ${response.razorpay_subscription_id}`, 'info');
      const verifyRes = await fetch('/api/razorpay/verify-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_subscription_id: response.razorpay_subscription_id,
          razorpay_signature: response.razorpay_signature,
          plan: razorpayCheckoutData.plan,
          interval: razorpayCheckoutData.interval
        })
      });
      const verifyData = await verifyRes.json();
      if (verifyData.success) {
        addLog('Subscription Service', 'Mock Razorpay subscription activated successfully!', 'success');
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCheckoutLoading(false);
    }
  };

  const getProrationDetails = () => {
    if (!selectedSub) return { oldPrice: 0, newPrice: 0, credit: 0, dueToday: 0, balanceRemaining: 0 };
    const oldPrice = PLAN_PRICES[selectedSub.plan][selectedSub.interval];
    const newPrice = PLAN_PRICES[proratePlan][prorateInterval];

    // Impure function Date.now() bypass logic: get now in click handler or pass down (or we can use standard Date.now() if needed)
    const now = Date.now();
    const nextBilling = new Date(selectedSub.nextBillingDate).getTime();
    const oldIntervalDays = selectedSub.interval === 'yearly' ? 365 : 30;
    const cycleDurationMs = oldIntervalDays * 24 * 60 * 60 * 1000;
    
    const remainingMs = nextBilling - now;
    const remainingProportion = Math.max(0, Math.min(1, remainingMs / cycleDurationMs));
    
    const credit = Math.round((oldPrice * remainingProportion) * 100) / 100;
    const dueToday = Math.max(0, newPrice - credit);
    const balanceRemaining = newPrice < credit ? Math.round((credit - newPrice) * 100) / 100 : 0;

    return { oldPrice, newPrice, credit, dueToday, balanceRemaining };
  };

  const handleOpenProrateModal = (sub: Subscription) => {
    setSelectedSub(sub);
    setProratePlan(sub.plan);
    setProrateInterval(sub.interval);
    setProrateModalOpen(true);
  };

  const handleProrateMigration = () => {
    if (!selectedSub) return;
    const { dueToday } = getProrationDetails();
    updateSubscriptionPlan(selectedSub.id, proratePlan, prorateInterval, dueToday);
    setProrateModalOpen(false);
    confetti();
  };

  const triggerChaosMock = () => {
    addLog('API Gateway', 'CRITICAL WARN: Simulating network packet lag test.', 'warn');
    addLog('PostgreSQL', 'DB Error: Max pool connection size reached (50/50 connections). Retrying.', 'error');
    addLog('RabbitMQ', 'RabbitMQ queue length > 10,000 threshold alarm triggered.', 'warn');
    addLog('Subscription Service', 'Graceful failover initiated on node subscriber-replica-01.', 'success');
  };

  // Static chart data for dashboard overview
  const mrrChartData = [
    { month: 'Jan', MRR: metrics.mrr * 0.7 },
    { month: 'Feb', MRR: metrics.mrr * 0.8 },
    { month: 'Mar', MRR: metrics.mrr * 0.88 },
    { month: 'Apr', MRR: metrics.mrr * 0.95 },
    { month: 'May', MRR: metrics.mrr },
  ];

  return (
    <div className="min-h-screen bg-[#050515] light-theme:bg-gray-50 flex relative overflow-hidden">
      
      {/* Sidebar Nav */}
      <DashboardSidebar 
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        user={user}
        theme={theme}
        toggleTheme={toggleTheme}
        logout={logout}
        setActivePage={setActivePage}
      />

      {/* Main Workspace Panel */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col overflow-y-auto bg-gradient-premium">
        
        {/* Top Header */}
        <header className="h-20 border-b border-white/5 px-6 flex items-center justify-between sticky top-0 bg-[#050515]/80 backdrop-blur-md z-30">
          <div className="flex items-center gap-3">
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </button>
            <h1 className="font-heading font-extrabold text-xl text-white light-theme:text-gray-900 tracking-tight capitalize animate-fade-in">
              {currentTab === 'admin' ? 'Admin Console' : currentTab === 'api' ? 'API Gateway Playground' : `${currentTab} Center`}
            </h1>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            {user?.role === 'ADMIN' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300">
                <ShieldAlert className="h-3.5 w-3.5" />
                Root Admin Mode
              </span>
            )}
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/5 bg-white/5 text-gray-300">
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              SubVault Portal
            </span>
          </div>
        </header>

        {/* Broadcast Alert Box */}
        {broadcastAlert && (
          <div className="mx-6 mt-4 p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 text-purple-200 text-xs font-semibold flex items-center justify-between shadow-lg shadow-purple-500/5 animate-pulse-slow">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-400 animate-ping" />
              <span>[SYSTEM WIDE ALERT] {broadcastAlert}</span>
            </div>
            <button 
              onClick={() => setBroadcastAlert(null)}
              className="text-purple-400 hover:text-purple-300 font-bold ml-4 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab Router Content */}
        <div className="p-6 max-w-7xl w-full mx-auto flex-grow">
          <AnimatePresence mode="wait">
            {currentTab === 'overview' && (
              <OverviewTab 
                metrics={metrics}
                subscriptions={subscriptions}
                invoices={invoices}
                user={user}
                mrrChartData={mrrChartData}
                newEmail={newEmail}
                setNewEmail={setNewEmail}
                newPlan={newPlan}
                setNewPlan={setNewPlan}
                newInterval={newInterval}
                setNewInterval={setNewInterval}
                paymentGateway={paymentGateway}
                setPaymentGateway={setPaymentGateway}
                checkoutLoading={checkoutLoading}
                formError={formError}
                handleCreateSub={handleCreateSub}
                triggerChaosMock={triggerChaosMock}
              />
            )}

            {currentTab === 'subscriptions' && (
              <SubscriptionsTab 
                subscriptions={subscriptions}
                user={user}
                updateSubscriptionStatus={updateSubscriptionStatus}
                handleOpenProrateModal={handleOpenProrateModal}
                deleteSubscription={deleteSubscription}
              />
            )}

            {currentTab === 'billing' && (
              <BillingTab 
                invoices={invoices}
                user={user}
                retryPayment={retryPayment}
                addLog={addLog}
              />
            )}

            {currentTab === 'api' && <ApiPlaygroundTab />}

            {currentTab === 'monitors' && (
              <MonitorsTab 
                systemLogs={systemLogs}
                clearLogs={clearLogs}
                triggerChaosMock={triggerChaosMock}
              />
            )}

            {currentTab === 'admin' && (
              <motion.div
                key="admin"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
              >
                <AdminPanel />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Migration Modal */}
      <AnimatePresence>
        <ProrateModal 
          prorateModalOpen={prorateModalOpen}
          setProrateModalOpen={setProrateModalOpen}
          selectedSub={selectedSub}
          proratePlan={proratePlan}
          setProratePlan={setProratePlan}
          prorateInterval={prorateInterval}
          setProrateInterval={setProrateInterval}
          getProrationDetails={getProrationDetails}
          handleProrateMigration={handleProrateMigration}
        />
      </AnimatePresence>

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
