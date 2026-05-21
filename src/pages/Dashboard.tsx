import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Terminal, Activity, 
  Menu, X, Plus, AlertCircle, Trash2, CheckCircle2, 
  XCircle, Play, Pause, RotateCw, Download, ArrowLeft,
  Sparkles, Database, DatabaseZap, ShieldAlert
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import type { SubscriptionStatus, PlanType, BillingInterval, Subscription } from '../context/SubscriptionContext';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/Card';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { io } from 'socket.io-client';
import confetti from 'canvas-confetti';
import { AdminPanel } from '../components/AdminPanel';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
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
    triggerMockApi
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

  useEffect(() => {
    const socketUrl = window.location.origin.replace(/^http/, 'ws');
    const socket = io(socketUrl, {
      path: '/api/socket.io',
      autoConnect: true,
      reconnection: true,
    });

    socket.on('broadcast', (data: any) => {
      setBroadcastAlert(data.message);
      addLog('API Gateway', `Received live broadcast packet: "${data.message}"`, 'info');
    });

    return () => {
      socket.off('broadcast');
      socket.close();
    };
  }, []);

  // Form State
  const [newEmail, setNewEmail] = useState('');
  const [newPlan, setNewPlan] = useState<PlanType>('Pro');
  const [newInterval, setNewInterval] = useState<BillingInterval>('monthly');
  const [formError, setFormError] = useState('');

  // API Tester State
  const [payloadJson, setPayloadJson] = useState(
    JSON.stringify({ email: 'client@company.com', plan: 'Pro', interval: 'monthly' }, null, 2)
  );
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiMethod, setApiMethod] = useState<'POST' | 'GET' | 'PATCH'>('POST');
  const [apiEndpoint, setApiEndpoint] = useState('/subscriptions');

  const handleCreateSub = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!newEmail || !newEmail.includes('@')) {
      setFormError('Please enter a valid email address.');
      return;
    }
    
    createSubscription(newEmail, newPlan, newInterval);
    setNewEmail('');
    addLog('Subscription Service', `Created new subscription from Dashboard Form: ${newEmail}`, 'success');
  };

  const runApiConsole = async () => {
    try {
      let parsed = undefined;
      if (apiMethod !== 'GET') {
        parsed = JSON.parse(payloadJson);
      }
      const res = await triggerMockApi(apiMethod, apiEndpoint, parsed);
      setApiResponse(res);
    } catch (e) {
      setApiResponse({ success: false, error: 'Invalid JSON format in editor.' });
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
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

  const getProrationDetails = () => {
    if (!selectedSub) return { oldPrice: 0, newPrice: 0, credit: 0, dueToday: 0, balanceRemaining: 0 };
    
    const pricing = {
      Basic: { monthly: 1500, yearly: 15000 },
      Pro: { monthly: 4000, yearly: 40000 },
      Enterprise: { monthly: 25000, yearly: 250000 },
    };

    const oldPrice = pricing[selectedSub.plan][selectedSub.interval];
    const newPrice = pricing[proratePlan][prorateInterval];

    // Align with dynamic backend proration calculation
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
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-white/5 backdrop-blur-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 flex flex-col justify-between`}>
        <div>
          {/* Brand header */}
          <div className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-black/10">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage('landing')}>
              <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center">
                <span className="font-heading font-black text-base text-white">A</span>
              </div>
              <div className="flex flex-col">
                <span className="font-heading font-bold text-sm text-white light-theme:text-gray-900 leading-none">AchieveSub</span>
                <span className="text-[9px] text-purple-400 font-bold">DASHBOARD</span>
              </div>
            </div>
            <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="p-4 flex flex-col gap-1.5">
            <button
              onClick={() => { setCurrentTab('overview'); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'overview' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" /> Overview
            </button>

            <button
              onClick={() => { setCurrentTab('subscriptions'); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'subscriptions' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Users className="h-4.5 w-4.5" /> Subscriptions
            </button>

            <button
              onClick={() => { setCurrentTab('billing'); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'billing' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <FileText className="h-4.5 w-4.5" /> Billing & Invoices
            </button>

            <button
              onClick={() => { setCurrentTab('api'); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'api' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Terminal className="h-4.5 w-4.5" /> API Playground
            </button>

            <button
              onClick={() => { setCurrentTab('monitors'); setSidebarOpen(false); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'monitors' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <Activity className="h-4.5 w-4.5" /> System Monitors
            </button>

            {user?.role === 'ADMIN' && (
              <div className="pt-2 mt-2 border-t border-white/5">
                <button
                  onClick={() => { setCurrentTab('admin'); setSidebarOpen(false); }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold w-full transition-all text-left cursor-pointer ${
                    currentTab === 'admin' 
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-500/15' 
                      : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20 bg-purple-500/5'
                  }`}
                >
                  <ShieldAlert className="h-4.5 w-4.5 text-purple-400" /> Admin Console
                </button>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5 bg-black/10 flex flex-col gap-2.5">
          {user && (
            <div className="px-2 py-1 flex flex-col">
              <span className="text-white text-xs font-bold truncate">{user.name}</span>
              <span className="text-[10px] text-gray-500 truncate">{user.email}</span>
            </div>
          )}
          
          <button 
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/5 bg-black/20 text-gray-400 hover:text-white hover:bg-black/30 transition-all cursor-pointer"
          >
            <span>Theme Toggle</span>
            <span>{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
          </button>
          
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/20 bg-rose-950/10 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" /> Sign Out Session
          </button>
        </div>
      </aside>

      {/* Main Workspace Panel */}
      <main className="flex-1 md:ml-64 min-h-screen flex flex-col overflow-y-auto bg-gradient-premium">
        
        {/* Top Navbar */}
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

        {/* Dashboard Pages Router */}
        <div className="p-6 max-w-7xl w-full mx-auto flex-grow">
          <AnimatePresence mode="wait">
            
            {/* 1. OVERVIEW VIEW */}
            {currentTab === 'overview' && (
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
                      <CardDescription className="uppercase tracking-wider font-semibold text-[10px]">Monthly Revenue</CardDescription>
                      <CardTitle className="text-3xl font-extrabold text-white light-theme:text-gray-900 mt-1">₹{metrics.mrr.toLocaleString()}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        ▲ 12.8% <span className="text-gray-500">from last week</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:border-purple-500/20 bg-black/20">
                    <CardHeader className="pb-2">
                      <CardDescription className="uppercase tracking-wider font-semibold text-[10px]">Active Subscribers</CardDescription>
                      <CardTitle className="text-3xl font-extrabold text-white light-theme:text-gray-900 mt-1">{metrics.activeUsers}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        ▲ {subscriptions.filter(s => s.status === 'Active').length} active tiers
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:border-purple-500/20 bg-black/20">
                    <CardHeader className="pb-2">
                      <CardDescription className="uppercase tracking-wider font-semibold text-[10px]">Churn Rate</CardDescription>
                      <CardTitle className="text-3xl font-extrabold text-white light-theme:text-gray-900 mt-1">{metrics.churnRate}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        ▼ 0.2% <span className="text-gray-500">target &lt; 3.0%</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="hover:border-purple-500/20 bg-black/20">
                    <CardHeader className="pb-2">
                      <CardDescription className="uppercase tracking-wider font-semibold text-[10px]">Payment Success</CardDescription>
                      <CardTitle className="text-3xl font-extrabold text-white light-theme:text-gray-900 mt-1">{metrics.successRate}%</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                        ▲ {invoices.filter(i => i.status === 'Paid').length} paid invoices
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Big MRR Chart */}
                <Card className="p-6 bg-black/30 border-white/5">
                  <CardHeader className="p-0 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Monthly Recurring Revenue Growth</CardTitle>
                      <CardDescription className="text-xs">Visualizing historical performance curves of sub database</CardDescription>
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
                      <CardTitle className="text-base">Quick Subscription Creation</CardTitle>
                      <CardDescription className="text-xs">Inject new client accounts directly into DB repository</CardDescription>
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
                            className="px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:outline-none focus:border-purple-500/50"
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
                              <option value="Basic">Basic (₹1,500)</option>
                              <option value="Pro">Pro (₹4,000)</option>
                              <option value="Enterprise">Enterprise (₹25,000)</option>
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

                        {formError && (
                          <div className="text-rose-400 text-xs flex items-center gap-1.5">
                            <AlertCircle className="h-4 w-4" /> {formError}
                          </div>
                        )}

                        <Button type="submit" variant="primary" className="w-full" leftIcon={<Plus className="h-4 w-4" />}>
                          Add Subscriber
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
            )}

            {/* 2. SUBSCRIPTIONS MANAGER VIEW */}
            {currentTab === 'subscriptions' && (
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
                      <CardDescription className="text-xs">Showing database records matching SELECT * FROM subscriptions;</CardDescription>
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
                              <td className="px-6 py-4.5">{getStatusBadge(sub.status)}</td>
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
            )}

            {/* 3. BILLING & INVOICES VIEW */}
            {currentTab === 'billing' && (
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
                    <CardDescription className="text-xs">Generated dynamically via billing cron triggers</CardDescription>
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
            )}

            {/* 4. API SANDBOX VIEW */}
            {currentTab === 'api' && (
              <motion.div
                key="api"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <Card className="bg-black/20 border-white/5 flex-grow">
                      <CardHeader>
                        <CardTitle className="text-base">Endpoint Selector</CardTitle>
                        <CardDescription className="text-xs">Choose method, endpoint, and define JSON body payload to test core billing endpoints.</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-gray-400">Method & Route</label>
                          <div className="flex gap-2">
                            <select
                              value={apiMethod}
                              onChange={(e) => {
                                const m = e.target.value as any;
                                setApiMethod(m);
                                if (m === 'GET') {
                                  setApiEndpoint('/subscriptions/sub_b8d38e21');
                                } else if (m === 'POST') {
                                  setApiEndpoint('/subscriptions');
                                  setPayloadJson(JSON.stringify({ email: 'client@company.com', plan: 'Pro', interval: 'monthly' }, null, 2));
                                } else {
                                  setApiEndpoint('/subscriptions/sub_e2819cd8');
                                  setPayloadJson(JSON.stringify({ status: 'Active' }, null, 2));
                                }
                              }}
                              className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:outline-none"
                            >
                              <option value="POST">POST</option>
                              <option value="GET">GET</option>
                              <option value="PATCH">PATCH</option>
                            </select>
                            
                            <input
                              type="text"
                              value={apiEndpoint}
                              onChange={(e) => setApiEndpoint(e.target.value)}
                              className="flex-grow px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>

                        {apiMethod !== 'GET' && (
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-400">Request Body Payload (JSON)</label>
                            <textarea
                              value={payloadJson}
                              onChange={(e) => setPayloadJson(e.target.value)}
                              rows={6}
                              className="w-full p-3 font-mono text-xs text-emerald-300 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 resize-none"
                            />
                          </div>
                        )}

                        <Button variant="primary" className="w-full mt-4" onClick={runApiConsole} leftIcon={<Terminal className="h-4 w-4" />}>
                          Execute Request
                        </Button>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Code Console Screen */}
                  <div className="lg:col-span-7 flex flex-col">
                    <Card className="bg-black/30 border-white/10 overflow-hidden h-full flex flex-col justify-between">
                      <div className="px-6 py-4.5 border-b border-white/5 bg-black/20 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-3 w-3 rounded-full bg-cyan-500" />
                          <span className="font-mono text-xs text-gray-300">Gateway Response Payload</span>
                        </div>
                        <span className="text-[10px] text-gray-500 font-mono">STATUS: 200 OK</span>
                      </div>

                      <div className="p-6 flex-grow overflow-auto font-mono text-[11px] bg-black/40 text-cyan-300 min-h-[300px]">
                        {apiResponse ? (
                          <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
                        ) : (
                          <span className="text-gray-600">// Execute request to test API filters and DB synchronization.</span>
                        )}
                      </div>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {/* 5. SYSTEM MONITORS VIEW */}
            {currentTab === 'monitors' && (
              <motion.div
                key="monitors"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="font-heading text-lg font-bold text-white light-theme:text-gray-900">Live Microservices Telemetry</h3>
                    <p className="text-xs text-gray-400">Stream logs directly showing routing, database commits, cache checks, and messaging pipelines</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" className="text-xs" onClick={clearLogs}>
                      Clear Feed
                    </Button>
                    <Button variant="secondary" size="sm" className="text-xs border-amber-500/20 text-amber-300" onClick={triggerChaosMock}>
                      Inject Logs Test
                    </Button>
                  </div>
                </div>

                <Card className="bg-[#03030d] border-white/10 overflow-hidden font-mono text-xs flex flex-col">
                  {/* Console Header */}
                  <div className="px-6 py-4 border-b border-white/5 bg-black/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500 inline-block animate-ping" />
                      <span className="text-gray-300 font-semibold uppercase text-[10px] tracking-wider">subvaultd.service.log</span>
                    </div>
                    <span className="text-[10px] text-purple-400 font-bold">CONNECTED</span>
                  </div>

                  {/* Terminal display */}
                  <div className="p-6 h-[400px] overflow-y-auto space-y-2 bg-[#050518]/90">
                    {systemLogs.length === 0 ? (
                      <div className="text-gray-600">// No active server events log entries. Trigger actions inside other tabs!</div>
                    ) : (
                      systemLogs.map((log) => {
                        const colors = {
                          info: 'text-gray-400',
                          success: 'text-emerald-400',
                          warn: 'text-amber-400',
                          error: 'text-rose-400 font-bold',
                        };
                        const icons = {
                          info: 'ℹ️',
                          success: '✅',
                          warn: '⚠️',
                          error: '🚨',
                        };
                        return (
                          <div key={log.id} className={`flex items-start gap-3 py-1 border-b border-white/2 hover:bg-white/2 transition-colors ${colors[log.type]}`}>
                            <span className="text-gray-600 flex-shrink-0">{log.timestamp}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 flex-shrink-0 text-purple-300 w-32 truncate text-center">
                              {log.service}
                            </span>
                            <span className="flex-shrink-0">{icons[log.type]}</span>
                            <span className="flex-grow font-medium leading-relaxed">{log.message}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </Card>
              </motion.div>
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

      {/* Proration Upgrade/Downgrade Modal */}
      <AnimatePresence>
        {prorateModalOpen && selectedSub && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative bg-[#0a0a20]"
            >
              <button 
                onClick={() => setProrateModalOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>

              <h3 className="font-heading font-bold text-lg text-white mb-2 flex items-center gap-2">
                <RotateCw className="h-5 w-5 text-purple-400" /> Plan Migration Configuration
              </h3>
              <p className="text-gray-400 text-xs mb-4">
                Migrate subscription plan cycle with instant prorated adjustments. Credits are automatically calculated and subtracted.
              </p>

              <div className="space-y-4">
                <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-xs space-y-1.5">
                  <div className="text-gray-500 font-bold uppercase text-[9px]">Current Cycle Plan</div>
                  <div className="flex justify-between items-center text-white">
                    <span className="font-bold">{selectedSub.plan} Plan</span>
                    <span className="font-mono">₹{selectedSub.amount.toLocaleString()} / {selectedSub.interval}</span>
                  </div>
                </div>

                {/* Target plan choice */}
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Select New Target Plan</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Basic', 'Pro', 'Enterprise'] as PlanType[]).map((plan) => (
                      <button
                        key={plan}
                        type="button"
                        onClick={() => setProratePlan(plan)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                          proratePlan === plan 
                            ? 'border-purple-500 bg-purple-500/10 text-white' 
                            : 'border-white/5 bg-black/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        {plan}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Billing Interval Toggle */}
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Interval Cycle</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['monthly', 'yearly'] as BillingInterval[]).map((interval) => (
                      <button
                        key={interval}
                        type="button"
                        onClick={() => setProrateInterval(interval)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                          prorateInterval === interval 
                            ? 'border-purple-500 bg-purple-500/10 text-white' 
                            : 'border-white/5 bg-black/20 text-gray-400 hover:text-white'
                        }`}
                      >
                        {interval}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Calculations details */}
                <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs space-y-3 font-medium">
                  <div className="flex justify-between items-center text-gray-400">
                    <span>New Plan Price:</span>
                    <span className="text-white font-mono">₹{getProrationDetails().newPrice.toLocaleString()}.00</span>
                  </div>
                  <div className="flex justify-between items-center text-gray-400">
                    <span>Prorated Credit (15 days remaining):</span>
                    <span className="text-emerald-400 font-mono">-₹{getProrationDetails().credit.toLocaleString()}.00</span>
                  </div>
                  <hr className="border-white/5" />
                  <div className="flex justify-between items-center font-bold text-sm">
                    <span className="text-white">Amount Due Today:</span>
                    <span className="text-purple-400 font-mono">₹{getProrationDetails().dueToday.toLocaleString()}.00</span>
                  </div>
                  {getProrationDetails().balanceRemaining > 0 && (
                    <div className="text-[10px] text-cyan-400 font-bold text-right">
                      * ₹{getProrationDetails().balanceRemaining.toLocaleString()}.00 credit will remain in balance.
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2">
                  <Button 
                    variant="glow" 
                    className="flex-1 py-2.5"
                    onClick={handleProrateMigration}
                  >
                    Confirm Migration
                  </Button>
                  <button
                    onClick={() => setProrateModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
                  >
                    Abort
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
