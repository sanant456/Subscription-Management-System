import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, ShieldAlert, Radio, Cpu, RefreshCw, CheckCircle, 
  ShieldCheck, Calendar, Activity, Database, CreditCard,
  DollarSign, Percent, Search, Filter, ArrowUpRight, ArrowDownRight, Clock
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useSubscription } from '../context/SubscriptionContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/Card';
import { Button } from './ui/Button';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  plan: string;
  status: 'Active' | 'Trialing' | 'Past Due' | 'Cancelled';
  createdAt: string;
}

interface RefundRequest {
  id: string;
  userEmail: string;
  planName: string;
  amount: number;
  requestDate: string;
  reason: string;
}

export const AdminPanel: React.FC = () => {
  const { triggerMockApi, payments } = useSubscription();
  const [activeTab, setActiveTab] = useState<'users' | 'refunds' | 'broadcast' | 'health' | 'transactions'>('users');
  
  // Search and Filter States for Transactions
  const [searchEmail, setSearchEmail] = useState('');
  const [filterPlan, setFilterPlan] = useState<'All' | 'Basic' | 'Pro' | 'Enterprise'>('All');
  const [filterStatus, setFilterStatus] = useState<'All' | 'SUCCESS' | 'FAILED' | 'PENDING'>('All');

  // States
  const [users, setUsers] = useState<AdminUser[]>([
    { id: 'usr_1', name: 'Sarah Jenkins', email: 'sarah@saasflow.com', role: 'ADMIN', plan: 'Enterprise', status: 'Active', createdAt: '2026-01-15' },
    { id: 'usr_2', name: 'Marcus Chen', email: 'marcus@mailsync.io', role: 'USER', plan: 'Pro', status: 'Active', createdAt: '2026-02-10' },
    { id: 'usr_3', name: 'Elena Rostova', email: 'elena@metricbase.co', role: 'USER', plan: 'Pro', status: 'Trialing', createdAt: '2026-03-01' },
    { id: 'usr_4', name: 'John Doe', email: 'john@example.com', role: 'USER', plan: 'Starter', status: 'Past Due', createdAt: '2026-04-12' },
    { id: 'usr_5', name: 'Jane Smith', email: 'jane@sandbox.net', role: 'USER', plan: 'Starter', status: 'Cancelled', createdAt: '2026-04-18' },
  ]);
  const [refunds, setRefunds] = useState<RefundRequest[]>([
    { id: 'ref_1', userEmail: 'john@example.com', planName: 'Basic', amount: 1500, requestDate: '2026-05-19', reason: 'Accidental double checkout on dashboard' },
    { id: 'ref_2', userEmail: 'jane@sandbox.net', planName: 'Pro', amount: 4000, requestDate: '2026-05-20', reason: 'Downgraded midway through month' }
  ]);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [broadcastHistory, setBroadcastHistory] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [diagnostics, setDiagnostics] = useState<{ time: string; cpu: number; ram: number; websockets: number }[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Initialize data
  useEffect(() => {
    // Live Socket connection
    const socketUrl = window.location.origin.replace(/^http/, 'ws');
    const newSocket = io(socketUrl, {
      path: '/api/socket.io',
      autoConnect: true,
      reconnection: true,
    });
    setSocket(newSocket);

    // Initial system metrics
    const initialMetrics = Array.from({ length: 10 }, (_, i) => ({
      time: `${10 - i}s ago`,
      cpu: Math.floor(Math.random() * 30) + 15,
      ram: Math.floor(Math.random() * 20) + 40,
      websockets: Math.floor(Math.random() * 5) + 3
    }));
    setDiagnostics(initialMetrics);

    return () => {
      newSocket.close();
    };
  }, []);

  // Diagnostics ticks
  useEffect(() => {
    const timer = setInterval(() => {
      setDiagnostics((prev) => {
        const nextTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const newPoint = {
          time: nextTime,
          cpu: Math.floor(Math.random() * 40) + 10,
          ram: Math.min(100, Math.max(0, (prev[prev.length - 1]?.ram || 50) + (Math.random() * 6 - 3))),
          websockets: Math.floor(Math.random() * 8) + 4
        };
        return [...prev.slice(1), newPoint];
      });
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setRefreshing(false);
  };

  const handleToggleRole = (userId: string) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: u.role === 'ADMIN' ? 'USER' : 'ADMIN' } : u));
  };

  const handleRefundAction = (refId: string, approved: boolean) => {
    setRefunds(prev => prev.filter(r => r.id !== refId));
    // Simulate invoice logs
    const ref = refunds.find(r => r.id === refId);
    if (ref && approved) {
      triggerMockApi('POST', '/refund', { refundId: refId, user: ref.userEmail, amount: ref.amount });
    }
  };

  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMsg.trim()) return;

    if (socket && socket.connected) {
      socket.emit('admin_broadcast', { message: broadcastMsg, timestamp: new Date().toISOString() });
    } else {
      // Offline fallback: simulate local reception on client log
      triggerMockApi('POST', '/broadcast', { broadcast: broadcastMsg });
    }

    setBroadcastHistory(prev => [broadcastMsg, ...prev]);
    setBroadcastMsg('');
  };

  // Transaction tab metrics and chart computations
  const totalRevenue = React.useMemo(() => {
    return payments
      .filter(p => ['SUCCESS', 'Success'].includes(p.status))
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const successRate = React.useMemo(() => {
    if (payments.length === 0) return 100;
    const successCount = payments.filter(p => ['SUCCESS', 'Success'].includes(p.status)).length;
    return Math.round((successCount / payments.length) * 100);
  }, [payments]);

  const totalTransactionsCount = payments.length;

  const revenueChartData = React.useMemo(() => {
    const successfulPayments = payments.filter(p => ['SUCCESS', 'Success'].includes(p.status));
    
    // Setup initial dictionary to guarantee correct chronological order of standard dashboard months
    const monthlyRev: Record<string, number> = {
      'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0
    };

    successfulPayments.forEach(p => {
      try {
        const date = new Date(p.paymentDate);
        const monthName = date.toLocaleString('en-US', { month: 'short' });
        if (monthName in monthlyRev) {
          monthlyRev[monthName] += p.amount;
        } else {
          monthlyRev[monthName] = p.amount;
        }
      } catch (e) {
        // ignore invalid dates
      }
    });

    const monthsOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthsOrder
      .filter(m => m in monthlyRev || monthlyRev[m] > 0)
      .map(m => ({
        month: m,
        Revenue: monthlyRev[m] || 0
      }));
  }, [payments]);

  // Filtering payments based on search and filters
  const filteredPayments = React.useMemo(() => {
    return payments.filter(p => {
      const matchEmail = searchEmail.trim() === '' || p.userEmail.toLowerCase().includes(searchEmail.toLowerCase());
      const matchPlan = filterPlan === 'All' || p.plan === filterPlan;
      
      const normalizedStatus = ['SUCCESS', 'Success'].includes(p.status) ? 'SUCCESS' :
                               ['FAILED', 'Failed'].includes(p.status) ? 'FAILED' : 'PENDING';
      const matchStatus = filterStatus === 'All' || normalizedStatus === filterStatus;
      
      return matchEmail && matchPlan && matchStatus;
    });
  }, [payments, searchEmail, filterPlan, filterStatus]);

  return (
    <div className="space-y-6">
      {/* Admin header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white font-heading tracking-tight flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-purple-400" /> Admin Console
          </h1>
          <p className="text-gray-400 text-xs mt-1">Configure global platform roles, manage payouts, and monitor telemetry queues.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            variant="secondary" 
            size="sm" 
            onClick={handleRefresh} 
            isLoading={refreshing}
            leftIcon={<RefreshCw className="h-4 w-4" />}
          >
            Sync Node Registry
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-white/5 gap-1.5 pb-px">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'users' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Users Database ({users.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'transactions' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" /> Transactions ({payments.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('refunds')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'refunds' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Refunds Pipeline ({refunds.length})
          </div>
        </button>

        <button
          onClick={() => setActiveTab('broadcast')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'broadcast' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4" /> Socket Broadcast
          </div>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === 'health' ? 'border-purple-500 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4" /> Telemetry Diagnostics
          </div>
        </button>
      </div>

      {/* Content panes */}
      <AnimatePresence mode="wait">
        {activeTab === 'users' && (
          <motion.div
            key="users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-xl"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-black/20 text-gray-400 font-bold uppercase tracking-wider">
                    <th className="p-4">Identified User</th>
                    <th className="p-4">Email Channel</th>
                    <th className="p-4">Authorization</th>
                    <th className="p-4">Active Plan</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map((usr) => (
                    <tr key={usr.id} className="hover:bg-white/5 transition-all">
                      <td className="p-4 font-heading font-semibold text-white">{usr.name}</td>
                      <td className="p-4 font-mono text-gray-400">{usr.email}</td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                          usr.role === 'ADMIN' ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400' : 'bg-gray-800 text-gray-400'
                        }`}>
                          {usr.role === 'ADMIN' ? 'Administrator' : 'Client Access'}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-cyan-400">{usr.plan}</td>
                      <td className="p-4">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          usr.status === 'Active' ? 'bg-emerald-500' :
                          usr.status === 'Trialing' ? 'bg-cyan-500' :
                          usr.status === 'Past Due' ? 'bg-amber-500' : 'bg-rose-500'
                        }`} />
                        <span className="font-medium">{usr.status}</span>
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleRole(usr.id)}
                          className="px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-purple-500/20 bg-black/20 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-all cursor-pointer"
                        >
                          Change Role
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}

        {activeTab === 'transactions' && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* KPI Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-white/5 bg-black/10 p-4">
                <CardContent className="p-0 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-heading">Total Revenue</span>
                    <div className="text-xl font-extrabold text-white font-mono mt-1">
                      ₹{totalRevenue.toLocaleString()}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                    <DollarSign className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-black/10 p-4">
                <CardContent className="p-0 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-heading">Gateway Success Rate</span>
                    <div className="text-xl font-extrabold text-emerald-400 font-mono mt-1">
                      {successRate}%
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <Percent className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-black/10 p-4">
                <CardContent className="p-0 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-heading">Total Transactions</span>
                    <div className="text-xl font-extrabold text-white font-mono mt-1">
                      {totalTransactionsCount}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                    <CreditCard className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 bg-black/10 p-4">
                <CardContent className="p-0 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-heading">Filtered Count</span>
                    <div className="text-xl font-extrabold text-cyan-400 font-mono mt-1">
                      {filteredPayments.length}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                    <Activity className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Growth Curve Chart */}
            <Card className="border-white/5 bg-black/15">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-white">Razorpay Revenue Performance</CardTitle>
                <CardDescription className="text-xs">Accumulated successfully processed subscription order volume by month</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueChartData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                      <XAxis dataKey="month" stroke="rgba(255,255,255,0.2)" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <YAxis stroke="rgba(255,255,255,0.2)" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                      <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString()}`, 'Revenue']} contentStyle={{ background: '#08081a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 10 }} />
                      <Area type="monotone" name="Revenue" dataKey="Revenue" stroke="#8b5cf6" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRev)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Filter Section */}
            <Card className="border-white/5 bg-black/10 p-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                    <Search className="h-3 w-3" /> Search Customer Email
                  </label>
                  <input
                    type="text"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    placeholder="e.g. razorpay-saas.in"
                    className="w-full px-3 py-2 text-xs text-white bg-black/40 border border-white/5 focus:border-purple-500/50 rounded-xl focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                    <Filter className="h-3 w-3" /> Plan Filter
                  </label>
                  <select
                    value={filterPlan}
                    onChange={(e) => setFilterPlan(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs text-white bg-black/60 border border-white/5 focus:border-purple-500/50 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Plans</option>
                    <option value="Basic">Basic Plan</option>
                    <option value="Pro">Pro Plan</option>
                    <option value="Enterprise">Enterprise Plan</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> Gateway Status
                  </label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs text-white bg-black/60 border border-white/5 focus:border-purple-500/50 rounded-xl focus:outline-none cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILED">FAILED</option>
                    <option value="PENDING">PENDING</option>
                  </select>
                </div>
              </div>
            </Card>

            {/* Transactions Table */}
            <div className="glass-panel border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-black/20 text-gray-400 font-bold uppercase tracking-wider">
                      <th className="p-4">Payment ID</th>
                      <th className="p-4">Customer Email</th>
                      <th className="p-4">Plan</th>
                      <th className="p-4">Amount</th>
                      <th className="p-4">Gateway Reference</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-medium">
                    {filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500 font-mono">
                          // No matching transaction logs found
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((pay) => (
                        <tr key={pay.id} className="hover:bg-white/5 transition-all">
                          <td className="p-4 font-mono text-gray-400">{pay.id}</td>
                          <td className="p-4 text-white">{pay.userEmail}</td>
                          <td className="p-4">
                            <span className="font-semibold text-purple-400">{pay.plan || 'N/A'}</span>
                          </td>
                          <td className="p-4 font-bold text-white">₹{pay.amount.toLocaleString()}</td>
                          <td className="p-4 font-mono text-[10px] text-gray-500">
                            <div>Ord: {pay.razorpayOrderId}</div>
                            <div>Pay: {pay.razorpayPaymentId || 'N/A'}</div>
                          </td>
                          <td className="p-4 text-gray-400 font-mono">
                            {new Date(pay.paymentDate).toLocaleString()}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-0.5 rounded-md border text-[10px] font-bold ${
                              ['SUCCESS', 'Success'].includes(pay.status) ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                              ['FAILED', 'Failed'].includes(pay.status) ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            }`}>
                              {pay.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'refunds' && (
          <motion.div
            key="refunds"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {refunds.length === 0 ? (
              <div className="glass-panel border-white/5 rounded-2xl p-10 text-center text-gray-500">
                <CheckCircle className="h-10 w-10 text-emerald-500 mx-auto mb-4" />
                <h4 className="font-heading font-semibold text-white mb-1">Queue Empty</h4>
                <p className="text-xs">No pending refund cases requiring administrator signatures.</p>
              </div>
            ) : (
              refunds.map((ref) => (
                <div key={ref.id} className="glass-panel border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start justify-between gap-6 hover:border-purple-500/10 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-mono bg-purple-500/10 border border-purple-500/25 px-2 py-0.5 rounded text-purple-400 font-bold">{ref.id}</span>
                      <h4 className="font-heading font-bold text-white text-sm">{ref.userEmail}</h4>
                    </div>
                    <p className="text-xs text-gray-400"><span className="text-gray-500">Reason:</span> "{ref.reason}"</p>
                    <div className="flex flex-wrap gap-4 text-[10px] text-gray-500 pt-2">
                      <span className="flex items-center gap-1"><Database className="h-3.5 w-3.5" /> Plan: {ref.planName}</span>
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> Filed: {ref.requestDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="text-right mr-4 hidden md:block">
                      <span className="text-xs text-gray-500 uppercase tracking-widest font-bold">Total Amount</span>
                      <div className="text-xl font-extrabold text-rose-400 font-mono">₹{ref.amount.toLocaleString()}.00</div>
                    </div>
                    <Button
                      variant="glow"
                      size="sm"
                      className="flex-grow md:flex-grow-0"
                      onClick={() => handleRefundAction(ref.id, true)}
                    >
                      Approve
                    </Button>
                    <button
                      onClick={() => handleRefundAction(ref.id, false)}
                      className="px-4 py-2 rounded-xl border border-rose-500/20 hover:border-rose-500/30 bg-rose-950/10 hover:bg-rose-950/20 text-xs font-bold text-rose-400 hover:text-rose-300 transition-all cursor-pointer"
                    >
                      Deny Payout
                    </button>
                  </div>
                </div>
              ))
            )}
          </motion.div>
        )}

        {activeTab === 'broadcast' && (
          <motion.div
            key="broadcast"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Control Panel */}
            <div className="md:col-span-5 space-y-4">
              <Card className="border-white/5 bg-black/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Radio className="h-5 w-5 text-purple-400 animate-pulse" /> Channel Broadcast
                  </CardTitle>
                  <CardDescription>Transmit live marquee messages to all active dashboard user interfaces.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <form onSubmit={handleSendBroadcast} className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[10px] text-gray-400 font-bold uppercase">Broadcast Payload</label>
                      <textarea
                        value={broadcastMsg}
                        onChange={(e) => setBroadcastMsg(e.target.value)}
                        placeholder="Maintenance scheduled tonight at 02:00 UTC. Subscription updates may lag..."
                        className="w-full p-3 font-medium text-xs text-white bg-black/40 border border-white/5 rounded-xl focus:outline-none focus:border-purple-500/50 resize-none h-24"
                      />
                    </div>

                    <Button type="submit" variant="glow" className="w-full py-2.5">
                      Send Alert Packet
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* Broadcast history */}
            <div className="md:col-span-7">
              <Card className="border-white/5 h-full">
                <CardHeader>
                  <CardTitle>Broadcast Log Registry</CardTitle>
                  <CardDescription>Running sequence of previously dispatched alerts.</CardDescription>
                </CardHeader>
                <CardContent>
                  {broadcastHistory.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 text-xs">
                      // No alert packages have been dispatched in this terminal session.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[220px] overflow-y-auto pr-2">
                      {broadcastHistory.map((hist, i) => (
                        <div key={i} className="p-3 bg-black/30 border border-white/5 rounded-xl text-xs space-y-1.5">
                          <div className="flex items-center justify-between text-[9px] font-bold">
                            <span className="text-purple-400">#PACKET_{broadcastHistory.length - i}</span>
                            <span className="text-gray-500">Live Dispatched</span>
                          </div>
                          <p className="text-white leading-relaxed font-medium">{hist}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {activeTab === 'health' && (
          <motion.div
            key="health"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-12 gap-6"
          >
            {/* Diagnostics Telemetry */}
            <div className="md:col-span-8">
              <Card className="border-white/5">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-cyan-400" /> CPU & Network Telemetry</CardTitle>
                    <CardDescription>Real-time processing and socket client connection monitors.</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-[10px] font-mono font-bold text-gray-500">POLLING ACTIVE</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={diagnostics} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                        <defs>
                          <linearGradient id="colorCPU" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorRAM" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                        <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                        <YAxis stroke="rgba(255,255,255,0.2)" style={{ fontSize: 9, fontFamily: 'monospace' }} />
                        <Tooltip contentStyle={{ background: '#08081a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontSize: 10 }} />
                        <Area type="monotone" name="CPU Usage %" dataKey="cpu" stroke="#a78bfa" strokeWidth={1.5} fillOpacity={1} fill="url(#colorCPU)" />
                        <Area type="monotone" name="RAM Usage %" dataKey="ram" stroke="#06b6d4" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRAM)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Diagnostics Stats */}
            <div className="md:col-span-4 space-y-4">
              <Card className="border-white/5 p-4 bg-black/10">
                <CardContent className="p-0 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-heading">Websocket Clients</span>
                    <div className="text-2xl font-extrabold text-white font-mono mt-1">
                      {diagnostics[diagnostics.length - 1]?.websockets || 0}
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center border border-purple-500/20 text-purple-400">
                    <Radio className="h-5 w-5 animate-pulse" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 p-4 bg-black/10">
                <CardContent className="p-0 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-heading">Memory Load</span>
                    <div className="text-2xl font-extrabold text-cyan-400 font-mono mt-1">
                      {Math.floor(diagnostics[diagnostics.length - 1]?.ram || 0)}%
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 text-cyan-400">
                    <Cpu className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-white/5 p-4 bg-black/10">
                <CardContent className="p-0 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-heading">DB Query Threads</span>
                    <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-1">
                      Active
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                    <Database className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
