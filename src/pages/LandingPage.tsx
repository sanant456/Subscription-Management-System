import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Zap, Activity, FileText, RefreshCw, Key, 
  ArrowRight, Users, LayoutDashboard, Terminal, ArrowRightLeft, 
  Menu, X, Check, Globe, Github, Cpu, Lock, Sparkles, AlertCircle
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import type { PlanType, BillingInterval } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, BarChart, Bar, RadialBarChart, RadialBar, Legend
} from 'recharts';

// Recharts Dummy Data for Showcase
const revenueData = [
  { name: 'Jan', MRR: 8500, ARR: 102000 },
  { name: 'Feb', MRR: 12200, ARR: 146400 },
  { name: 'Mar', MRR: 17400, ARR: 208800 },
  { name: 'Apr', MRR: 24100, ARR: 289200 },
  { name: 'May', MRR: 31800, ARR: 381600 },
  { name: 'Jun', MRR: 44200, ARR: 530400 },
];

const churnData = [
  { name: 'Jan', Rate: 4.8 },
  { name: 'Feb', Rate: 4.2 },
  { name: 'Mar', Rate: 3.5 },
  { name: 'Apr', Rate: 2.9 },
  { name: 'May', Rate: 2.1 },
  { name: 'Jun', Rate: 1.8 },
];

const subscriberData = [
  { name: 'Jan', Users: 120 },
  { name: 'Feb', Users: 180 },
  { name: 'Mar', Users: 290 },
  { name: 'Apr', Users: 410 },
  { name: 'May', Users: 580 },
  { name: 'Jun', Users: 840 },
];

const paymentSuccessData = [
  { name: 'First Attempt', value: 92.4, fill: '#06b6d4' },
  { name: 'First Retry', value: 5.1, fill: '#8b5cf6' },
  { name: 'Second Retry', value: 1.8, fill: '#3b82f6' },
  { name: 'Failed', value: 0.7, fill: '#f43f5e' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { 
    theme, toggleTheme, setActivePage, createSubscription, 
    triggerMockApi, systemLogs 
  } = useSubscription();
  const { token } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PlanType) => {
    setCheckoutError(null);
    if (token) {
      setCheckoutLoadingPlan(plan);
      try {
        const response = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ plan, interval: billingInterval })
        });
        const data = await response.json();
        if (data.success && data.url) {
          window.location.href = data.url;
        } else {
          setCheckoutError(data.error || 'Failed to create checkout session.');
        }
      } catch (err: any) {
        setCheckoutError(err.message || 'Network error initiating checkout.');
      } finally {
        setCheckoutLoadingPlan(null);
      }
    } else {
      // Save pending checkout config
      localStorage.setItem('subvault_pending_checkout', JSON.stringify({ plan, interval: billingInterval }));
      navigate('/auth/signup');
    }
  };
  const [activeChart, setActiveChart] = useState<'revenue' | 'churn' | 'growth' | 'success'>('revenue');
  
  // API Showcase playground state
  const [apiMethod, setApiMethod] = useState<'POST' | 'GET' | 'PATCH'>('POST');
  const [apiEndpoint, setApiEndpoint] = useState('/subscriptions');
  const [apiPayload, setApiPayload] = useState(
    JSON.stringify({ email: 'client@company.com', plan: 'Pro', interval: 'monthly' }, null, 2)
  );
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const features = [
    {
      icon: <Users className="h-6 w-6 text-purple-500" />,
      title: 'Subscription Management',
      desc: 'Seamlessly configure complex plan tiering, metered billing, and customized subscription options.'
    },
    {
      icon: <FileText className="h-6 w-6 text-cyan-500" />,
      title: 'Automated Billing',
      desc: 'Hands-off automatic invoicing, payment triggers, and transaction workflows synced to webhooks.'
    },
    {
      icon: <Activity className="h-6 w-6 text-indigo-500" />,
      title: 'Analytics Dashboard',
      desc: 'Real-time cohort analyses, churn tracking, MRR telemetry, and LTV forecasts at a glance.'
    },
    {
      icon: <Globe className="h-6 w-6 text-emerald-500" />,
      title: 'Invoice Generation',
      desc: 'Beautiful HTML/PDF invoice generation automatically matched to user-defined compliance and branding.'
    },
    {
      icon: <RefreshCw className="h-6 w-6 text-amber-500" />,
      title: 'Payment Retry System',
      desc: 'Smart dunning schedules powered by ML retries, reducing involuntary churn by over 35%.'
    },
    {
      icon: <Lock className="h-6 w-6 text-rose-500" />,
      title: 'Secure Authentication',
      desc: 'Built-in multi-tenant RBAC profiles, JWT token generation, OAuth 2.0 integration, and rate limiting.'
    },
    {
      icon: <Sparkles className="h-6 w-6 text-violet-500" />,
      title: 'Plan Upgrades & Downgrades',
      desc: 'Automated proration and credit allocation engine. Transition users between plans seamlessly.'
    },
    {
      icon: <Zap className="h-6 w-6 text-blue-500" />,
      title: 'Trial Management',
      desc: 'Optimize conversion with automated trial reminders, seamless credit card entry prompts, and grace periods.'
    }
  ];

  const handleApiRun = () => {
    setApiLoading(true);
    setApiResponse(null);
    setTimeout(() => {
      let parsedBody = undefined;
      try {
        if (apiMethod !== 'GET') {
          parsedBody = JSON.parse(apiPayload);
        }
        const res = triggerMockApi(apiMethod, apiEndpoint, parsedBody);
        setApiResponse(res);
      } catch (err: any) {
        setApiResponse({ success: false, error: 'Invalid JSON payload format' });
      } finally {
        setApiLoading(false);
      }
    }, 800);
  };

  const setApiPreset = (method: 'POST' | 'GET' | 'PATCH', endpoint: string, payload: any) => {
    setApiMethod(method);
    setApiEndpoint(endpoint);
    setApiPayload(JSON.stringify(payload, null, 2));
    setApiResponse(null);
  };

  return (
    <div className="relative overflow-x-hidden min-h-screen text-gray-300 light-theme:text-gray-600 bg-[#050515] light-theme:bg-gray-50 bg-gradient-premium">
      
      {/* Floating Ambient Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 light-theme:bg-purple-600/5 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-600/10 light-theme:bg-cyan-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 light-theme:bg-indigo-600/5 blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* Header & Navigation */}
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="font-heading font-black text-xl text-white">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg leading-none text-white light-theme:text-gray-900">SubVault</span>
              <span className="text-[10px] tracking-wider text-purple-400 font-bold">BY SUBVAULT</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-purple-400 transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a>
            <a href="#analytics" className="hover:text-purple-400 transition-colors">Analytics</a>
            <a href="#security" className="hover:text-purple-400 transition-colors">Security</a>
            <a href="#api" className="hover:text-purple-400 transition-colors">API Console</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-gray-300 light-theme:text-gray-700 cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {token ? (
              <Button variant="glow" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth/login')}>Sign In</Button>
                <Button variant="glow" onClick={() => navigate('/auth/signup')}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile Menu Btn */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-white/10 text-gray-300 mr-2"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/5 bg-[#08081a] relative z-40"
          >
            <div className="px-6 py-8 flex flex-col gap-5 text-base">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Features</a>
              <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Architecture</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Pricing</a>
              <a href="#analytics" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Analytics</a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Security</a>
              <a href="#api" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">API Console</a>
              <hr className="border-white/5 my-2" />
              {token ? (
                <Button variant="glow" className="w-full justify-center" onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}>Go to Dashboard</Button>
              ) : (
                <>
                  <Button variant="ghost" className="w-full justify-center" onClick={() => { navigate('/auth/login'); setMobileMenuOpen(false); }}>Sign In</Button>
                  <Button variant="glow" className="w-full justify-center" onClick={() => { navigate('/auth/signup'); setMobileMenuOpen(false); }}>Get Started</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-6 pt-16 pb-24 md:pt-24 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-6 flex flex-col items-start gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-purple-500/20 bg-purple-950/20 text-purple-300 text-xs font-semibold"
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            SaaS Billing Infrastructure Platform
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white light-theme:text-gray-900 leading-tight"
          >
            Automate Your <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 via-violet-400 to-cyan-400 animate-shine bg-[length:200%_auto]">
              Subscription Business
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-gray-400 light-theme:text-gray-600 max-w-xl"
          >
            Manage plans, billing, invoices, analytics, and recurring payments effortlessly. Free up engineering teams to focus on coding products.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
          >
            <Button variant="glow" size="lg" onClick={() => navigate('/auth/signup')} rightIcon={<ArrowRight className="h-5 w-5" />}>
              Get Started
            </Button>
            <Button variant="secondary" size="lg" onClick={() => {
              const el = document.getElementById('analytics');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}>
              View Demo
            </Button>
          </motion.div>

          {/* Stats Section in Hero */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-3 gap-8 mt-6 pt-8 border-t border-white/5 w-full max-w-lg"
          >
            <div>
              <div className="text-2xl font-bold font-heading text-white light-theme:text-gray-900">99.99%</div>
              <div className="text-xs text-gray-400 mt-1">Uptime SLA</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-heading text-white light-theme:text-gray-900">&lt;50ms</div>
              <div className="text-xs text-gray-400 mt-1">API Latency</div>
            </div>
            <div>
              <div className="text-2xl font-bold font-heading text-white light-theme:text-gray-900">30%+</div>
              <div className="text-xs text-gray-400 mt-1">Churn Reduced</div>
            </div>
          </motion.div>
        </div>

        {/* Animated Dashboard Preview Card */}
        <div className="lg:col-span-6 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-cyan-500/20 blur-2xl rounded-3xl" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="glass-panel rounded-2xl border border-white/10 p-5 shadow-2xl relative z-10 bg-[#08081a]/90 light-theme:bg-white"
          >
            {/* Window header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/5 mb-4">
              <div className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-3.5 w-3.5 rounded-full bg-amber-500/80 inline-block" />
                <span className="h-3.5 w-3.5 rounded-full bg-emerald-500/80 inline-block" />
              </div>
              <div className="text-xs text-gray-400 font-mono px-3 py-1 rounded bg-white/5 border border-white/5">
                subvault.io/dashboard/overview
              </div>
            </div>

            {/* Dashboard grid mock */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="glass-panel p-3.5 rounded-xl">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">MRR</div>
                <div className="text-lg font-bold text-white light-theme:text-gray-900">$44.2k</div>
                <div className="text-[9px] text-emerald-400 flex items-center font-bold">▲ 24% m/m</div>
              </div>
              <div className="glass-panel p-3.5 rounded-xl">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Churn Rate</div>
                <div className="text-lg font-bold text-white light-theme:text-gray-900">1.8%</div>
                <div className="text-[9px] text-emerald-400 flex items-center font-bold">▼ 0.3% m/m</div>
              </div>
              <div className="glass-panel p-3.5 rounded-xl">
                <div className="text-[10px] text-gray-400 uppercase font-semibold">Invoices</div>
                <div className="text-lg font-bold text-white light-theme:text-gray-900">99.3%</div>
                <div className="text-[9px] text-emerald-400 flex items-center font-bold">▲ 0.4% billing</div>
              </div>
            </div>

            {/* Charts preview */}
            <div className="h-44 w-full mb-3">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="colorMRR_hero" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2e304f" opacity={0.3} />
                  <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 10 }} />
                  <Area type="monotone" dataKey="MRR" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorMRR_hero)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Micro logging console */}
            <div className="bg-black/50 rounded-xl p-3 border border-white/5 font-mono text-[9px] h-20 overflow-y-auto">
              <div className="text-emerald-400">[09:50:01] ⚡ API Gateway: Routed POST /subscriptions successfully.</div>
              <div className="text-[#a78bfa]">[09:50:02] 💾 PostgreSQL: Committed invoice insert usr_81923.</div>
              <div className="text-cyan-400">[09:50:03] 🔄 Redis: Evicted caches for queries key:sub_all.</div>
              <div className="text-gray-500">[09:50:04] ✉️ RabbitMQ: Subscription notification triggered.</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trusted Companies Section */}
      <section className="border-y border-white/5 bg-black/10 py-10 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
          <span className="text-[10px] uppercase tracking-widest text-purple-400/80 font-bold">
            TRUSTED BY THE WORLD'S LEADING STARTUPS
          </span>
        </div>
        <div className="flex w-[200%] gap-12 items-center animate-scroll">
          <div className="flex justify-around items-center w-full gap-8 select-none">
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">STRIPE</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">LINEAR</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">VERCEL</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">NOTION</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">FRAMER</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">FIGMA</span>
          </div>
          <div className="flex justify-around items-center w-full gap-8 select-none">
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">STRIPE</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">LINEAR</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">VERCEL</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">NOTION</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">FRAMER</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">FIGMA</span>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
            Everything Needed to Scale Billing
          </h2>
          <p className="text-gray-400 light-theme:text-gray-600">
            Automate tedious billing setups and security guardrails with a subscription system ready for scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => (
            <Card key={i} className="hover:border-purple-500/30 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
                {feat.icon}
              </div>
              <CardContent className="p-0">
                <h4 className="font-heading font-semibold text-lg text-white light-theme:text-gray-900 mb-2">{feat.title}</h4>
                <p className="text-sm text-gray-400 light-theme:text-gray-600 leading-relaxed">{feat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Animated Architecture Diagram */}
      <section id="architecture" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 bg-black/20 rounded-3xl relative overflow-hidden">
        <div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2 inline-block">System Blueprint</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
            High-Performance Microservices Architecture
          </h2>
          <p className="text-gray-400 light-theme:text-gray-600">
            Optimized for 99.999% reliability with isolated services and robust queue-based decoupling.
          </p>
        </div>

        {/* The Diagram UI */}
        <div className="relative p-6 lg:p-12 border border-white/5 rounded-2xl bg-black/40 overflow-x-auto min-w-[700px] lg:min-w-0">
          <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 400">
            {/* Connecting lines */}
            {/* Gateway -> Services */}
            <path d="M 120 180 Q 250 80 340 80" stroke="#8b5cf6" strokeWidth="1.5" fill="none" className="opacity-30" />
            <path d="M 120 180 H 340" stroke="#8b5cf6" strokeWidth="1.5" fill="none" className="opacity-30" />
            <path d="M 120 180 Q 250 280 340 280" stroke="#8b5cf6" strokeWidth="1.5" fill="none" className="opacity-30" />

            {/* Services -> Databases & Cache */}
            <path d="M 500 80 Q 600 80 660 140" stroke="#06b6d4" strokeWidth="1.5" fill="none" className="opacity-30" />
            <path d="M 500 180 Q 580 180 660 180" stroke="#06b6d4" strokeWidth="1.5" fill="none" className="opacity-30" />
            <path d="M 500 280 Q 600 280 660 220" stroke="#06b6d4" strokeWidth="1.5" fill="none" className="opacity-30" />

            {/* Database Sync lines */}
            <path d="M 760 180 H 840" stroke="#10b981" strokeWidth="1.5" fill="none" className="opacity-30" />
            <path d="M 880 200 V 260 H 500" stroke="#f43f5e" strokeWidth="1.5" fill="none" className="opacity-30" />
            
            {/* Moving Pulsing Circles along paths */}
            <circle r="4" fill="#a78bfa" className="glow-dot">
              <animateMotion dur="4s" repeatCount="indefinite" path="M 120 180 Q 250 80 340 80" />
            </circle>
            <circle r="4" fill="#22d3ee" className="glow-dot">
              <animateMotion dur="3s" repeatCount="indefinite" path="M 120 180 H 340" />
            </circle>
            <circle r="4" fill="#a78bfa" className="glow-dot">
              <animateMotion dur="5s" repeatCount="indefinite" path="M 120 180 Q 250 280 340 280" />
            </circle>
            <circle r="4" fill="#34d399" className="glow-dot">
              <animateMotion dur="4s" repeatCount="indefinite" path="M 500 180 Q 580 180 660 180" />
            </circle>
            <circle r="4" fill="#fb7185" className="glow-dot">
              <animateMotion dur="6s" repeatCount="indefinite" path="M 880 200 V 260 H 500" />
            </circle>
          </svg>

          {/* Service Grid Layout */}
          <div className="grid grid-cols-12 gap-y-12 gap-x-4 items-center relative z-10 text-center text-xs font-semibold">
            {/* API GATEWAY */}
            <div className="col-span-3 flex flex-col items-center">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
                <Terminal className="h-5 w-5" />
              </div>
              <div className="glass-panel py-2.5 px-4 rounded-xl border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
                API Gateway
                <div className="text-[9px] text-gray-500 font-mono mt-0.5">Rate Limit / Auth</div>
              </div>
            </div>

            {/* SERVICES COLUMN */}
            <div className="col-span-5 flex flex-col gap-6 items-center">
              {/* Auth Service */}
              <div className="w-52 glass-panel p-3.5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors">
                <div className="text-[#a78bfa] mb-1 font-bold">Auth Service</div>
                <div className="text-[10px] text-gray-400 leading-none">OAuth 2.0 / JWT Issuance</div>
              </div>
              
              {/* Subscription Service */}
              <div className="w-52 glass-panel p-3.5 rounded-xl border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.05)] hover:border-cyan-500/60 transition-colors">
                <div className="text-cyan-300 mb-1 font-bold">Subscription Service</div>
                <div className="text-[10px] text-gray-400 leading-none">Status Lifecycle & State Engine</div>
              </div>
              
              {/* Billing Service */}
              <div className="w-52 glass-panel p-3.5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors">
                <div className="text-[#a78bfa] mb-1 font-bold">Billing Service</div>
                <div className="text-[10px] text-gray-400 leading-none">Invoicing / Retries / Stripe Integration</div>
              </div>
            </div>

            {/* DATA LAYER */}
            <div className="col-span-4 flex flex-col gap-5 items-center">
              {/* Redis Cache */}
              <div className="w-44 glass-panel p-3 rounded-xl border border-red-500/30">
                <div className="text-red-400 mb-1 font-bold">Redis Cache</div>
                <div className="text-[9px] text-gray-400">Tokens / Sessions / API rate states</div>
              </div>

              {/* PostgreSQL */}
              <div className="w-44 glass-panel p-3 rounded-xl border border-blue-500/30">
                <div className="text-blue-400 mb-1 font-bold">PostgreSQL DB</div>
                <div className="text-[9px] text-gray-400">Subscriptions / Clients / Invoices</div>
              </div>

              {/* RabbitMQ */}
              <div className="w-44 glass-panel p-3 rounded-xl border border-emerald-500/30">
                <div className="text-emerald-400 mb-1 font-bold">RabbitMQ Exchange</div>
                <div className="text-[9px] text-gray-400">Asynchronous Webhook Queues</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
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

        {checkoutError && (
          <div className="max-w-md mx-auto mb-8 p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-sm flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-400 flex-shrink-0" />
            <span>{checkoutError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch">
          {/* Basic Plan */}
          <Card className="flex flex-col justify-between border-white/5 hover:border-purple-500/20 bg-black/20">
            <CardContent className="p-0 flex-grow">
              <span className="text-xs uppercase text-gray-400 font-bold tracking-widest">Basic</span>
              <div className="flex items-baseline gap-1 mt-4">
                <span className="text-4xl font-extrabold text-white light-theme:text-gray-900">
                  ₹{billingInterval === 'monthly' ? '1,500' : '15,000'}
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
                  ₹{billingInterval === 'monthly' ? '4,000' : '40,000'}
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
                  ₹{billingInterval === 'monthly' ? '25,000' : '2,50,000'}
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
                  <span>Custom dunning retry intervals</span>
                </li>
                <li className="flex items-center gap-2.5">
                  <Check className="h-4.5 w-4.5 text-cyan-400" />
                  <span>24/7/365 Engineer emergency line</span>
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

      {/* Analytics Dashboard Preview */}
      <section id="analytics" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
            Live Analytics Dashboard Preview
          </h2>
          <p className="text-gray-400 light-theme:text-gray-600">
            Preview the key metrics analyzed in real time as subscriptions are processed.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
            <button 
              onClick={() => setActiveChart('revenue')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeChart === 'revenue' ? 'bg-[#1e1e38] text-purple-400 border border-purple-500/30' : 'bg-black/20 hover:bg-black/40 text-gray-400 border border-white/5'}`}
            >
              Monthly Revenue
            </button>
            <button 
              onClick={() => setActiveChart('churn')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeChart === 'churn' ? 'bg-[#1e1e38] text-purple-400 border border-purple-500/30' : 'bg-black/20 hover:bg-black/40 text-gray-400 border border-white/5'}`}
            >
              Churn Rate
            </button>
            <button 
              onClick={() => setActiveChart('growth')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeChart === 'growth' ? 'bg-[#1e1e38] text-purple-400 border border-purple-500/30' : 'bg-black/20 hover:bg-black/40 text-gray-400 border border-white/5'}`}
            >
              Subscriber Growth
            </button>
            <button 
              onClick={() => setActiveChart('success')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeChart === 'success' ? 'bg-[#1e1e38] text-purple-400 border border-purple-500/30' : 'bg-black/20 hover:bg-black/40 text-gray-400 border border-white/5'}`}
            >
              Payment Success Rate
            </button>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-2xl max-w-4xl mx-auto h-[350px] flex items-center justify-center bg-black/30 border border-white/5">
          {activeChart === 'revenue' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e304f" opacity={0.3} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                <Area type="monotone" dataKey="MRR" name="Monthly Recurring Revenue" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorMRR)" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'churn' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={churnData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e304f" opacity={0.3} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                <Bar dataKey="Rate" name="Churn Rate (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'growth' && (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={subscriberData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2e304f" opacity={0.3} />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                <YAxis stroke="#9ca3af" fontSize={11} />
                <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                <Line type="monotone" dataKey="Users" name="Active Subscribers" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          )}

          {activeChart === 'success' && (
            <div className="flex flex-col md:flex-row items-center justify-around w-full gap-6">
              <div className="w-[200px] h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="100%" barSize={8} data={paymentSuccessData}>
                    <RadialBar
                      label={{ position: 'insideStart', fill: '#fff', fontSize: 8 }}
                      background
                      dataKey="value"
                    />
                    <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col gap-3 font-medium text-sm">
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#06b6d4] inline-block"/> First Attempt: 92.4%</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#8b5cf6] inline-block"/> First Smart Retry: 5.1%</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#3b82f6] inline-block"/> Second Retry: 1.8%</div>
                <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#f43f5e] inline-block"/> Failed (Hard Churn): 0.7%</div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Subscription Lifecycle flow */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2 inline-block">Subscription Lifecycle</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
            Predictable Lifecycle Progression States
          </h2>
          <p className="text-gray-400 light-theme:text-gray-600">
            Understand how SubVault manages automatic state transitions to protect recurring revenue.
          </p>
        </div>

        {/* Horizontal Flow Container */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 max-w-6xl mx-auto relative">
          
          {/* Step 1: Trialing */}
          <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
            <div className="h-14 w-14 rounded-full bg-cyan-950/50 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-bold text-sm mb-4 glow-dot">
              Trial
            </div>
            <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Trialing</div>
            <p className="text-[11px] text-gray-400 mt-1 leading-normal">Initial user trial (e.g. 14 days)</p>
          </div>

          <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

          {/* Step 2: Active */}
          <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
            <div className="h-14 w-14 rounded-full bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-bold text-sm mb-4 glow-dot">
              Active
            </div>
            <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Active</div>
            <p className="text-[11px] text-gray-400 mt-1 leading-normal">Successful billing cycles recurring</p>
          </div>

          <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

          {/* Step 3: Paused */}
          <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
            <div className="h-14 w-14 rounded-full bg-yellow-950/50 border border-yellow-500/50 flex items-center justify-center text-yellow-300 font-bold text-sm mb-4 glow-dot">
              Pause
            </div>
            <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Paused</div>
            <p className="text-[11px] text-gray-400 mt-1 leading-normal">Billing suspended temporarily</p>
          </div>

          <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

          {/* Step 4: Past Due */}
          <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
            <div className="h-14 w-14 rounded-full bg-orange-950/50 border border-orange-500/50 flex items-center justify-center text-orange-300 font-bold text-sm mb-4 glow-dot">
              Due
            </div>
            <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Past Due</div>
            <p className="text-[11px] text-gray-400 mt-1 leading-normal">Payment failed. Enters retry phase</p>
          </div>

          <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

          {/* Step 5: Cancelled */}
          <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
            <div className="h-14 w-14 rounded-full bg-rose-950/50 border border-rose-500/50 flex items-center justify-center text-rose-300 font-bold text-sm mb-4 glow-dot">
              Cancel
            </div>
            <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Cancelled</div>
            <p className="text-[11px] text-gray-400 mt-1 leading-normal">Grace period pending end cycle</p>
          </div>

          <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

          {/* Step 6: Expired */}
          <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
            <div className="h-14 w-14 rounded-full bg-gray-950 border border-gray-600 flex items-center justify-center text-gray-400 font-bold text-sm mb-4">
              End
            </div>
            <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Expired</div>
            <p className="text-[11px] text-gray-400 mt-1 leading-normal">Hard cut-off. Service terminated</p>
          </div>

        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 bg-gradient-to-b from-purple-950/5 to-transparent rounded-3xl">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4 font-heading">
            Bank-Grade Security Framework
          </h2>
          <p className="text-gray-400 light-theme:text-gray-600">
            SubVault is engineered around modern safety protocols to secure cardholder payloads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl mx-auto text-center font-medium">
          <Card className="md:col-span-1 border-white/5">
            <Key className="h-8 w-8 text-purple-400 mx-auto mb-4" />
            <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">JWT Tokens</h4>
            <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">Cryptographically signed credentials</p>
          </Card>
          <Card className="md:col-span-1 border-white/5">
            <Globe className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
            <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">OAuth Login</h4>
            <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">OAuth2 protocols for authentication</p>
          </Card>
          <Card className="md:col-span-1 border-white/5">
            <Lock className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
            <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">AES-256</h4>
            <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">Military encryption for payloads</p>
          </Card>
          <Card className="md:col-span-1 border-white/5">
            <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
            <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">PCI-DSS</h4>
            <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">Strict tokenization compliance</p>
          </Card>
          <Card className="md:col-span-1 border-white/5">
            <Cpu className="h-8 w-8 text-rose-400 mx-auto mb-4" />
            <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">TLS 1.3</h4>
            <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">Secure sockets and transit handshakes</p>
          </Card>
        </div>
      </section>

      {/* Interactive API Showcase */}
      <section id="api" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-5 flex flex-col items-start gap-6">
            <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">API Documentation</span>
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 leading-tight">
              Interactive API Playground Console
            </h2>
            <p className="text-gray-400 light-theme:text-gray-600">
              Integrate with simple HTTP REST endpoints. Select an operation below to load its payload, test the mock server response, and witness live dashboard records update.
            </p>

            <div className="flex flex-col gap-2.5 w-full">
              <button 
                onClick={() => setApiPreset('POST', '/subscriptions', { email: 'billing@subvault.io', plan: 'Enterprise', interval: 'yearly' })}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${apiMethod === 'POST' ? 'bg-[#15152a] border-purple-500/40 text-white' : 'bg-black/10 hover:bg-black/30 border-white/5 text-gray-400'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">POST</span>
                  <span className="font-mono text-xs">/subscriptions</span>
                </div>
                <div className="text-[10px] text-purple-400 font-bold uppercase">Create Subscription</div>
              </button>

              <button 
                onClick={() => setApiPreset('GET', '/subscriptions/sub_b8d38e21', null)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${apiMethod === 'GET' ? 'bg-[#15152a] border-purple-500/40 text-white' : 'bg-black/10 hover:bg-black/30 border-white/5 text-gray-400'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">GET</span>
                  <span className="font-mono text-xs">/subscriptions/{'{id}'}</span>
                </div>
                <div className="text-[10px] text-purple-400 font-bold uppercase">Retrieve Payload</div>
              </button>

              <button 
                onClick={() => setApiPreset('PATCH', '/subscriptions/sub_e2819cd8', { status: 'Active' })}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${apiMethod === 'PATCH' ? 'bg-[#15152a] border-purple-500/40 text-white' : 'bg-black/10 hover:bg-black/30 border-white/5 text-gray-400'}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">PATCH</span>
                  <span className="font-mono text-xs">/subscriptions/{'{id}'}</span>
                </div>
                <div className="text-[10px] text-purple-400 font-bold uppercase">Update Status</div>
              </button>
            </div>
            
            <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium mt-1">
              <AlertCircle className="h-4.5 w-4.5 text-purple-400 flex-shrink-0" />
              Creating a subscription here will add it directly to the dashboard list!
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl bg-[#030310]/95 border border-white/10">
              {/* API Header */}
              <div className="flex items-center justify-between bg-black/30 px-5 py-4 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="font-mono text-xs font-semibold text-gray-300">HTTP REST Sandbox Gateway</span>
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleApiRun}
                  isLoading={apiLoading}
                  className="shadow-sm"
                >
                  Send Request
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 h-[340px]">
                {/* Request Payload Editor */}
                <div className="p-4 flex flex-col h-full bg-[#050518]">
                  <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-2 font-heading">
                    Request {apiMethod === 'GET' ? 'Params' : 'Body JSON'}
                  </div>
                  {apiMethod === 'GET' ? (
                    <div className="text-xs font-mono text-gray-500 p-3 rounded-lg bg-black/40 border border-white/5 flex-grow">
                      // GET requests do not require a payload body. URL identifier will query PostgreSQL db.
                    </div>
                  ) : (
                    <textarea
                      value={apiPayload}
                      onChange={(e) => setApiPayload(e.target.value)}
                      className="w-full flex-grow p-3 font-mono text-xs text-emerald-300 bg-black/40 border border-white/5 rounded-lg focus:outline-none focus:border-purple-500/50 resize-none"
                    />
                  )}
                </div>

                {/* Response Console */}
                <div className="p-4 flex flex-col h-full bg-[#03030d]">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2 font-heading">
                    API Response Payload
                  </div>
                  <div className="w-full flex-grow p-3 font-mono text-[11px] bg-black/40 border border-white/5 rounded-lg overflow-y-auto max-h-[250px] text-gray-400">
                    {apiResponse ? (
                      <pre className="text-cyan-300">{JSON.stringify(apiResponse, null, 2)}</pre>
                    ) : (
                      <span className="text-gray-600">// Click "Send Request" to trigger API middleware pipeline...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2 inline-block">Testimonials</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
            Loved by Developers & Billing Admins
          </h2>
          <p className="text-gray-400 light-theme:text-gray-600">
            See how recurring SaaS startups successfully scaled billing automation using SubVault.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card className="hover:border-purple-500/20">
            <p className="text-sm text-gray-400 light-theme:text-gray-600 italic leading-relaxed">
              "We migrated over 5,000 subscriptions from custom cron-job tables to SubVault in a single afternoon. The developer SDK is rock solid and smart retries recovered $14,000 in failed charges in month one."
            </p>
            <div className="flex items-center gap-3.5 mt-6">
              <div className="h-10 w-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-white">
                SL
              </div>
              <div>
                <h5 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900">Sarah Jenkins</h5>
                <span className="text-xs text-gray-500">CTO, SaaSFlow</span>
              </div>
            </div>
          </Card>

          <Card className="hover:border-purple-500/20">
            <p className="text-sm text-gray-400 light-theme:text-gray-600 italic leading-relaxed">
              "Building proration logic manually is a nightmare. This API handles trial states, upgrades, downgrades, and credits automatically. The animated logs viewer makes debugging billing queues extremely satisfying."
            </p>
            <div className="flex items-center gap-3.5 mt-6">
              <div className="h-10 w-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-sm text-white">
                MT
              </div>
              <div>
                <h5 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900">Marcus Chen</h5>
                <span className="text-xs text-gray-500">Founder, MailSync</span>
              </div>
            </div>
          </Card>

          <Card className="hover:border-purple-500/20">
            <p className="text-sm text-gray-400 light-theme:text-gray-600 italic leading-relaxed">
              "The billing analytics and Cohort metrics are built directly into the core engine. We no longer have discrepancy lags between our operational database and third-party dashboards. It's a game changer."
            </p>
            <div className="flex items-center gap-3.5 mt-6">
              <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-white">
                EK
              </div>
              <div>
                <h5 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900">Elena Rostova</h5>
                <span className="text-xs text-gray-500">Lead Architect, MetricBase</span>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-black/40 relative z-10">
        <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg">
              <span className="font-heading font-black text-sm text-white">S</span>
            </div>
            <div className="flex flex-col text-left">
              <span className="font-heading font-bold text-sm text-white light-theme:text-gray-900">SubVault</span>
              <span className="text-[8px] text-gray-500">Billing Infrastructure</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-8 text-xs font-semibold text-gray-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-purple-400 flex items-center gap-1.5">
              <Github className="h-4 w-4" /> GitHub
            </a>
            <a href="#docs" className="hover:text-purple-400">Documentation</a>
            <a href="#contact" className="hover:text-purple-400">Contact Support</a>
            <a href="#privacy" className="hover:text-purple-400">Privacy Policy</a>
          </div>

          <div className="text-xs text-gray-500 text-center md:text-right">
            &copy; {new Date().getFullYear()} SubVault Inc. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
