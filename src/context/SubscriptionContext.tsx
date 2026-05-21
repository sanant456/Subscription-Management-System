import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { useAuth } from './AuthContext';
import { kaggleSubscriptions, kaggleInvoices } from '../data/kaggleDataset';

export type SubscriptionStatus = 'Trialing' | 'Active' | 'Paused' | 'Past Due' | 'Cancelled' | 'Expired';
export type PlanType = 'Basic' | 'Pro' | 'Enterprise';
export type BillingInterval = 'monthly' | 'yearly';

export interface Subscription {
  id: string;
  userId: string;
  userEmail: string;
  plan: PlanType;
  status: SubscriptionStatus;
  amount: number;
  interval: BillingInterval;
  trialDaysLeft?: number;
  createdAt: string;
  nextBillingDate: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  userEmail: string;
  plan: PlanType;
  amount: number;
  status: 'Paid' | 'Unpaid' | 'Failed';
  createdAt: string;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  service: 'API Gateway' | 'Auth Service' | 'Subscription Service' | 'Billing Service' | 'PostgreSQL' | 'Redis' | 'RabbitMQ';
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

interface SubscriptionMetrics {
  mrr: number;
  activeUsers: number;
  churnRate: number;
  successRate: number;
}

interface SubscriptionContextType {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  activePage: 'landing' | 'dashboard';
  setActivePage: (page: 'landing' | 'dashboard') => void;
  dashboardTab: 'overview' | 'subscriptions' | 'billing' | 'api' | 'monitors';
  setDashboardTab: (tab: 'overview' | 'subscriptions' | 'billing' | 'api' | 'monitors') => void;
  subscriptions: Subscription[];
  invoices: Invoice[];
  systemLogs: SystemLog[];
  metrics: SubscriptionMetrics;
  createSubscription: (email: string, plan: PlanType, interval: BillingInterval) => Subscription;
  updateSubscriptionStatus: (id: string, status: SubscriptionStatus) => void;
  updateSubscriptionPlan: (id: string, plan: PlanType, interval: BillingInterval, amount: number) => void;
  retryPayment: (invoiceId: string) => boolean;
  deleteSubscription: (id: string) => void;
  clearLogs: () => void;
  addLog: (service: SystemLog['service'], message: string, type?: SystemLog['type']) => void;
  triggerMockApi: (method: string, endpoint: string, body?: any) => any;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

// ── Merged: hand-crafted Indian SaaS seed + IBM Telco Kaggle dataset ──────────
// kaggleSubscriptions = 60 real-world-derived records (7,043 source rows)
// Combined total: 82 subscriptions at startup, growing via live engine
const initialSubscriptions: Subscription[] = [
  // ── Enterprise ───────────────────────────────────────────────────────────
  { id: 'sub_ent_001', userId: 'usr_e1001', userEmail: 'cto@razorpay-saas.in',        plan: 'Enterprise', status: 'Active',    amount: 25000,  interval: 'monthly', createdAt: '2026-01-10', nextBillingDate: '2026-06-10' },
  { id: 'sub_ent_002', userId: 'usr_e1002', userEmail: 'billing@freshworks-saas.com', plan: 'Enterprise', status: 'Active',    amount: 250000, interval: 'yearly',  createdAt: '2025-12-01', nextBillingDate: '2026-12-01' },
  { id: 'sub_ent_003', userId: 'usr_e1003', userEmail: 'ops@zoho-saas.com',           plan: 'Enterprise', status: 'Active',    amount: 25000,  interval: 'monthly', createdAt: '2026-02-15', nextBillingDate: '2026-06-15' },
  { id: 'sub_ent_004', userId: 'usr_e1004', userEmail: 'finance@chargebee-saas.com',  plan: 'Enterprise', status: 'Active',    amount: 250000, interval: 'yearly',  createdAt: '2025-11-20', nextBillingDate: '2026-11-20' },
  { id: 'sub_ent_005', userId: 'usr_e1005', userEmail: 'devops@browserstack-s.com',   plan: 'Enterprise', status: 'Paused',   amount: 25000,  interval: 'monthly', createdAt: '2026-03-01', nextBillingDate: '2026-07-01' },
  // ── Pro ──────────────────────────────────────────────────────────────────
  { id: 'sub_pro_001', userId: 'usr_p2001', userEmail: 'engineering@meesho-s.com',   plan: 'Pro',        status: 'Active',    amount: 4000,   interval: 'monthly', createdAt: '2026-03-22', nextBillingDate: '2026-06-22' },
  { id: 'sub_pro_002', userId: 'usr_p2002', userEmail: 'payments@cashfree-s.com',    plan: 'Pro',        status: 'Active',    amount: 40000,  interval: 'yearly',  createdAt: '2025-10-01', nextBillingDate: '2026-10-01' },
  { id: 'sub_pro_003', userId: 'usr_p2003', userEmail: 'cto@darwinbox-saas.com',     plan: 'Pro',        status: 'Active',    amount: 4000,   interval: 'monthly', createdAt: '2026-04-10', nextBillingDate: '2026-07-10' },
  { id: 'sub_pro_004', userId: 'usr_p2004', userEmail: 'growth@leadsquared-s.com',   plan: 'Pro',        status: 'Active',    amount: 40000,  interval: 'yearly',  createdAt: '2025-09-15', nextBillingDate: '2026-09-15' },
  { id: 'sub_pro_005', userId: 'usr_p2005', userEmail: 'infra@hasura-saas.io',       plan: 'Pro',        status: 'Active',    amount: 4000,   interval: 'monthly', createdAt: '2026-04-28', nextBillingDate: '2026-07-28' },
  { id: 'sub_pro_006', userId: 'usr_p2006', userEmail: 'api@setu-saas.co',           plan: 'Pro',        status: 'Paused',   amount: 4000,   interval: 'monthly', createdAt: '2026-02-01', nextBillingDate: '2026-08-01' },
  { id: 'sub_pro_007', userId: 'usr_p2007', userEmail: 'tech@sprinklr-saas.com',     plan: 'Pro',        status: 'Past Due', amount: 4000,   interval: 'monthly', createdAt: '2026-04-18', nextBillingDate: '2026-05-18' },
  // ── Basic ─────────────────────────────────────────────────────────────────
  { id: 'sub_bas_001', userId: 'usr_b3001', userEmail: 'founder@khatabook-s.com',    plan: 'Basic',      status: 'Active',    amount: 1500,   interval: 'monthly', createdAt: '2026-05-01', nextBillingDate: '2026-06-01' },
  { id: 'sub_bas_002', userId: 'usr_b3002', userEmail: 'dev@spinny-saas.com',        plan: 'Basic',      status: 'Active',    amount: 15000,  interval: 'yearly',  createdAt: '2025-08-20', nextBillingDate: '2026-08-20' },
  { id: 'sub_bas_003', userId: 'usr_b3003', userEmail: 'hello@decentro-saas.tech',   plan: 'Basic',      status: 'Trialing',  amount: 1500,   interval: 'monthly', trialDaysLeft: 9,  createdAt: '2026-05-11', nextBillingDate: '2026-05-25' },
  { id: 'sub_bas_004', userId: 'usr_b3004', userEmail: 'ceo@signalx-saas.ai',        plan: 'Basic',      status: 'Trialing',  amount: 1500,   interval: 'monthly', trialDaysLeft: 4,  createdAt: '2026-05-16', nextBillingDate: '2026-05-30' },
  { id: 'sub_bas_005', userId: 'usr_b3005', userEmail: 'sales@ofbusiness-s.com',     plan: 'Basic',      status: 'Active',    amount: 1500,   interval: 'monthly', createdAt: '2026-05-03', nextBillingDate: '2026-06-03' },
  { id: 'sub_bas_006', userId: 'usr_b3006', userEmail: 'accounts@pepperfry-s.com',   plan: 'Basic',      status: 'Active',    amount: 1500,   interval: 'monthly', createdAt: '2026-04-25', nextBillingDate: '2026-05-25' },
  // ── Churn / Past-Due / Expired ─────────────────────────────────────────────
  { id: 'sub_churn_1', userId: 'usr_c4001', userEmail: 'billing@failstartup-s.in',   plan: 'Basic',      status: 'Past Due',  amount: 1500,   interval: 'monthly', createdAt: '2026-04-15', nextBillingDate: '2026-05-15' },
  { id: 'sub_churn_2', userId: 'usr_c4002', userEmail: 'cto@pivotedco-saas.in',      plan: 'Pro',        status: 'Cancelled', amount: 4000,   interval: 'monthly', createdAt: '2026-02-10', nextBillingDate: '2026-05-10' },
  { id: 'sub_churn_3', userId: 'usr_c4003', userEmail: 'admin@sunsetapp-saas.io',    plan: 'Basic',      status: 'Cancelled', amount: 15000,  interval: 'yearly',  createdAt: '2025-05-20', nextBillingDate: '2026-05-20' },
  { id: 'sub_churn_4', userId: 'usr_c4004', userEmail: 'dev@legacysaas-io.net',      plan: 'Enterprise', status: 'Expired',   amount: 25000,  interval: 'monthly', createdAt: '2025-12-01', nextBillingDate: '2026-03-01' },
  // ── Kaggle / IBM Telco Churn Dataset (60 real-world-derived records) ────────
  ...(kaggleSubscriptions as Subscription[]),
];

const initialInvoices: Invoice[] = [
  // Enterprise
  { id: 'inv_e0001', subscriptionId: 'sub_ent_001', userEmail: 'cto@razorpay-saas.in',        plan: 'Enterprise', amount: 25000,  status: 'Paid',   createdAt: '2026-05-10' },
  { id: 'inv_e0002', subscriptionId: 'sub_ent_001', userEmail: 'cto@razorpay-saas.in',        plan: 'Enterprise', amount: 25000,  status: 'Paid',   createdAt: '2026-04-10' },
  { id: 'inv_e0003', subscriptionId: 'sub_ent_002', userEmail: 'billing@freshworks-saas.com', plan: 'Enterprise', amount: 250000, status: 'Paid',   createdAt: '2025-12-01' },
  { id: 'inv_e0004', subscriptionId: 'sub_ent_003', userEmail: 'ops@zoho-saas.com',           plan: 'Enterprise', amount: 25000,  status: 'Paid',   createdAt: '2026-05-15' },
  { id: 'inv_e0005', subscriptionId: 'sub_ent_004', userEmail: 'finance@chargebee-saas.com',  plan: 'Enterprise', amount: 250000, status: 'Paid',   createdAt: '2025-11-20' },
  // Pro
  { id: 'inv_p0001', subscriptionId: 'sub_pro_001', userEmail: 'engineering@meesho-s.com',   plan: 'Pro',        amount: 4000,   status: 'Paid',   createdAt: '2026-05-22' },
  { id: 'inv_p0002', subscriptionId: 'sub_pro_001', userEmail: 'engineering@meesho-s.com',   plan: 'Pro',        amount: 4000,   status: 'Paid',   createdAt: '2026-04-22' },
  { id: 'inv_p0003', subscriptionId: 'sub_pro_002', userEmail: 'payments@cashfree-s.com',    plan: 'Pro',        amount: 40000,  status: 'Paid',   createdAt: '2025-10-01' },
  { id: 'inv_p0004', subscriptionId: 'sub_pro_003', userEmail: 'cto@darwinbox-saas.com',     plan: 'Pro',        amount: 4000,   status: 'Paid',   createdAt: '2026-05-10' },
  { id: 'inv_p0005', subscriptionId: 'sub_pro_004', userEmail: 'growth@leadsquared-s.com',   plan: 'Pro',        amount: 40000,  status: 'Paid',   createdAt: '2025-09-15' },
  { id: 'inv_p0006', subscriptionId: 'sub_pro_005', userEmail: 'infra@hasura-saas.io',       plan: 'Pro',        amount: 4000,   status: 'Paid',   createdAt: '2026-05-28' },
  { id: 'inv_p0007', subscriptionId: 'sub_pro_007', userEmail: 'tech@sprinklr-saas.com',     plan: 'Pro',        amount: 4000,   status: 'Failed', createdAt: '2026-05-18' },
  { id: 'inv_p0008', subscriptionId: 'sub_pro_007', userEmail: 'tech@sprinklr-saas.com',     plan: 'Pro',        amount: 4000,   status: 'Failed', createdAt: '2026-04-18' },
  // Basic
  { id: 'inv_b0001', subscriptionId: 'sub_bas_001', userEmail: 'founder@khatabook-s.com',    plan: 'Basic',      amount: 1500,   status: 'Paid',   createdAt: '2026-05-01' },
  { id: 'inv_b0002', subscriptionId: 'sub_bas_002', userEmail: 'dev@spinny-saas.com',        plan: 'Basic',      amount: 15000,  status: 'Paid',   createdAt: '2025-08-20' },
  { id: 'inv_b0003', subscriptionId: 'sub_bas_005', userEmail: 'sales@ofbusiness-s.com',     plan: 'Basic',      amount: 1500,   status: 'Paid',   createdAt: '2026-05-03' },
  { id: 'inv_b0004', subscriptionId: 'sub_bas_006', userEmail: 'accounts@pepperfry-s.com',   plan: 'Basic',      amount: 1500,   status: 'Paid',   createdAt: '2026-04-25' },
  // Churn / Failed
  { id: 'inv_c0001', subscriptionId: 'sub_churn_1', userEmail: 'billing@failstartup-s.in',   plan: 'Basic',      amount: 1500,   status: 'Failed', createdAt: '2026-05-15' },
  { id: 'inv_c0002', subscriptionId: 'sub_churn_1', userEmail: 'billing@failstartup-s.in',   plan: 'Basic',      amount: 1500,   status: 'Failed', createdAt: '2026-04-15' },
  { id: 'inv_c0003', subscriptionId: 'sub_churn_2', userEmail: 'cto@pivotedco-saas.in',      plan: 'Pro',        amount: 4000,   status: 'Paid',   createdAt: '2026-04-10' },
  { id: 'inv_c0004', subscriptionId: 'sub_churn_3', userEmail: 'admin@sunsetapp-saas.io',    plan: 'Basic',      amount: 15000,  status: 'Paid',   createdAt: '2025-05-20' },
  { id: 'inv_c0005', subscriptionId: 'sub_churn_4', userEmail: 'dev@legacysaas-io.net',      plan: 'Enterprise', amount: 25000,  status: 'Paid',   createdAt: '2025-12-01' },
  { id: 'inv_c0006', subscriptionId: 'sub_churn_4', userEmail: 'dev@legacysaas-io.net',      plan: 'Enterprise', amount: 25000,  status: 'Paid',   createdAt: '2026-01-01' },
  { id: 'inv_c0007', subscriptionId: 'sub_churn_4', userEmail: 'dev@legacysaas-io.net',      plan: 'Enterprise', amount: 25000,  status: 'Failed', createdAt: '2026-03-01' },
  // ── Kaggle / IBM Telco Churn Dataset (133 real-world-derived invoices) ───────
  ...(kaggleInvoices as Invoice[]),
];

const initialLogs: SystemLog[] = [
  { id: 'log_01', timestamp: '09:42:01', service: 'API Gateway',          message: 'GET /subscriptions — 200 OK (8ms). JWT auth verified.', type: 'info' },
  { id: 'log_02', timestamp: '09:42:02', service: 'Redis',                message: 'Cache hit for subscription index (ttl: 300s). Hit ratio: 94.7%.', type: 'success' },
  { id: 'log_03', timestamp: '09:43:17', service: 'Billing Service',      message: '✅ ₹25,000 charge captured for cto@razorpay-saas.in via Razorpay. Settlement T+1.', type: 'success' },
  { id: 'log_04', timestamp: '09:43:18', service: 'RabbitMQ',             message: '"invoice.generated" published to billing.exchange (routing: enterprise)', type: 'info' },
  { id: 'log_05', timestamp: '09:44:05', service: 'PostgreSQL',           message: 'Pool: 14/50 active. WAL replication lag: 0ms. Primary healthy.', type: 'success' },
  { id: 'log_06', timestamp: '09:44:55', service: 'Subscription Service', message: '🆕 New Pro (monthly) subscription created for engineering@meesho-s.com', type: 'success' },
  { id: 'log_07', timestamp: '09:45:10', service: 'Billing Service',      message: '❌ Charge FAILED for tech@sprinklr-saas.com — card_declined (insufficient_funds)', type: 'error' },
  { id: 'log_08', timestamp: '09:45:11', service: 'RabbitMQ',             message: '"dunning.retry" queued for tech@sprinklr-saas.com — attempt 1/3 in 24h', type: 'warn' },
  { id: 'log_09', timestamp: '09:45:12', service: 'Subscription Service', message: 'Transitioned sub_pro_007 Active → Past Due. Retry window open.', type: 'error' },
  { id: 'log_10', timestamp: '09:46:00', service: 'PostgreSQL',           message: "UPDATE subscriptions SET status='Past Due' WHERE id='sub_pro_007'; 1 row affected", type: 'success' },
  { id: 'log_11', timestamp: '09:47:30', service: 'Auth Service',         message: 'OAuth2.0 token issued — scope: read:subscriptions write:billing. TTL: 3600s', type: 'success' },
  { id: 'log_12', timestamp: '09:48:05', service: 'API Gateway',          message: 'Rate limit check: 2,341/10,000 req/min. Node sg-3 healthy.', type: 'info' },
  { id: 'log_13', timestamp: '09:49:20', service: 'Redis',                message: 'Eviction policy LRU — 0 keys evicted. Memory: 214MB/2048MB (10.4%).', type: 'success' },
  { id: 'log_14', timestamp: '09:50:01', service: 'Billing Service',      message: 'GST invoice #INV-2026-0421 dispatched via SendGrid to billing@freshworks-saas.com', type: 'success' },
  { id: 'log_15', timestamp: '09:51:12', service: 'Subscription Service', message: 'Trial expiry reminder sent to decentro-saas.tech (9 days remaining)', type: 'info' },
];

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, user } = useAuth();
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activePage, setActivePage] = useState<'landing' | 'dashboard'>('landing');
  const [dashboardTab, setDashboardTab] = useState<'overview' | 'subscriptions' | 'billing' | 'api' | 'monitors'>('overview');
  
  // ── localStorage version-busting: clears stale cache when dataset changes ──
  const DATA_VERSION = 'subvault_v3_kaggle';
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => {
    try {
      const version = localStorage.getItem('subvault_data_version');
      if (version !== DATA_VERSION) {
        // New dataset version — wipe old cache so Kaggle data loads fresh
        localStorage.removeItem('subvault_sub_db');
        localStorage.removeItem('subvault_invoices_db');
        localStorage.setItem('subvault_data_version', DATA_VERSION);
        return initialSubscriptions;
      }
      const saved = localStorage.getItem('subvault_sub_db');
      return saved ? JSON.parse(saved) : initialSubscriptions;
    } catch (e) {
      console.warn('Failed to parse subscriptions from localStorage, resetting...', e);
      return initialSubscriptions;
    }
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    try {
      const saved = localStorage.getItem('subvault_invoices_db');
      return saved ? JSON.parse(saved) : initialInvoices;
    } catch (e) {
      console.warn("Failed to parse invoices from localStorage, resetting...", e);
      return initialInvoices;
    }
  });

  const [systemLogs, setSystemLogs] = useState<SystemLog[]>(initialLogs);
  const [metrics, setMetrics] = useState<SubscriptionMetrics>({
    mrr: 0,
    activeUsers: 0,
    churnRate: 0,
    successRate: 0,
  });

  // Filter subscriptions and invoices based on logged-in user role
  const filteredSubscriptions = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return subscriptions;
    return subscriptions.filter(s => s.userEmail.toLowerCase() === user.email.toLowerCase());
  }, [subscriptions, user]);

  const filteredInvoices = React.useMemo(() => {
    if (!user) return [];
    if (user.role === 'ADMIN') return invoices;
    return invoices.filter(i => i.userEmail.toLowerCase() === user.email.toLowerCase());
  }, [invoices, user]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem('subvault_sub_db', JSON.stringify(subscriptions));
  }, [subscriptions]);

  useEffect(() => {
    localStorage.setItem('subvault_invoices_db', JSON.stringify(invoices));
  }, [invoices]);

  // Load from backend API if a real token is available
  useEffect(() => {
    const fetchBillingData = async () => {
      if (!token || token.startsWith('mock_')) return;
      try {
        addLog('Subscription Service', 'Syncing billing records from Express DB backend.', 'info');
        const subRes = await fetch('/api/subscriptions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());
        if (subRes.success) {
          setSubscriptions(subRes.subscriptions);
          addLog('PostgreSQL', `Successfully fetched ${subRes.subscriptions.length} active subscription rows.`, 'success');
        }

        const invRes = await fetch('/api/subscriptions/invoices', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json());
        if (invRes.success) {
          setInvoices(invRes.invoices);
          addLog('PostgreSQL', `Successfully loaded ${invRes.invoices.length} historical invoices from DB.`, 'success');
        }
      } catch (e) {
        addLog('API Gateway', 'Connection to database server timed out. Running in mock offline mode.', 'warn');
        console.warn("Could not retrieve real database billing records. Using localStorage cache.", e);
      }
    };

    fetchBillingData();
  }, [token]);

  // Recalculate KPIs based on subscriptions
  useEffect(() => {
    const activeSubs = filteredSubscriptions.filter(s => s.status === 'Active' || s.status === 'Trialing');
    
    // MRR calculation: Sum up amount normalized to monthly
    const mrrTotal = filteredSubscriptions.reduce((sum, s) => {
      if (s.status !== 'Active' && s.status !== 'Trialing' && s.status !== 'Paused' && s.status !== 'Past Due') return sum;
      const subAmount = s.amount;
      const monthlyAmount = s.interval === 'yearly' ? subAmount / 12 : subAmount;
      return sum + monthlyAmount;
    }, 0);

    // Churn calculation: Cancelled + Expired over total historical subs
    const cancelledCount = filteredSubscriptions.filter(s => s.status === 'Cancelled' || s.status === 'Expired').length;
    const totalHistorical = filteredSubscriptions.length;
    const churn = totalHistorical > 0 ? (cancelledCount / totalHistorical) * 100 : 0;

    // Success Rate calculation: Paid invoices / Total invoices
    const paidCount = filteredInvoices.filter(i => i.status === 'Paid').length;
    const totalInvoices = filteredInvoices.length;
    const successRate = totalInvoices > 0 ? (paidCount / totalInvoices) * 100 : 100;

    setMetrics({
      mrr: Math.round(mrrTotal),
      activeUsers: activeSubs.length,
      churnRate: parseFloat(churn.toFixed(1)),
      successRate: parseFloat(successRate.toFixed(1)),
    });
  }, [filteredSubscriptions, filteredInvoices]);

  // Handle Theme switching
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const root = window.document.documentElement;
    if (newTheme === 'light') {
      root.classList.add('light-theme');
    } else {
      root.classList.remove('light-theme');
    }
  };

  const addLog = (service: SystemLog['service'], message: string, type: SystemLog['type'] = 'info') => {
    const now = new Date();
    const timestamp = now.toTimeString().split(' ')[0];
    const newLog: SystemLog = {
      id: `log_${Math.random().toString(36).substr(2, 9)}`,
      timestamp,
      service,
      message,
      type,
    };
    setSystemLogs(prev => [newLog, ...prev].slice(0, 50)); // limit to 50 logs
  };

  const clearLogs = () => setSystemLogs([]);

  // Mock Endpoints API Gateway
  const triggerMockApi = async (method: string, endpoint: string, body?: any) => {
    addLog('API Gateway', `HTTP Request: ${method} ${endpoint}`, 'info');
    
    // Auth Check simulation
    addLog('Auth Service', 'Validating API Client Key. Success.', 'success');
    addLog('Redis', 'API Rate limit checked (1/1000 requests/s).', 'success');

    if (token && !token.startsWith('mock_')) {
      try {
        const fetchOptions: any = {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        };
        if (method !== 'GET' && body) {
          fetchOptions.body = JSON.stringify(body);
        }
        const res = await fetch(`/api${endpoint}`, fetchOptions).then(r => r.json());
        
        // Auto-refresh subscriptions and invoices lists to keep dashboard accurate
        fetch('/api/subscriptions', {
          headers: { 'Authorization': `Bearer ${token}` }
        }).then(r => r.json()).then(subRes => {
          if (subRes.success) setSubscriptions(subRes.subscriptions);
        });

        if (res.success) {
          addLog('PostgreSQL', `Synchronous API Gateway execute succeeded.`, 'success');
          return { success: true, data: res.subscription || res.data || res };
        } else {
          addLog('API Gateway', `Server returned error: ${res.error || 'Unknown error'}`, 'error');
          return { success: false, error: res.error || 'Server error' };
        }
      } catch (e: any) {
        addLog('API Gateway', `Connection error: ${e.message}`, 'error');
        return { success: false, error: e.message || 'API Connection failure' };
      }
    }

    if (method === 'POST' && endpoint === '/subscriptions') {
      if (!body || !body.email || !body.plan) {
        addLog('API Gateway', 'Validation Error: email and plan are required.', 'error');
        return { success: false, error: 'Email and Plan fields are required.' };
      }
      
      const newSub = createSubscription(body.email, body.plan, body.interval || 'monthly');
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      return { success: true, data: newSub };
    }

    if (method === 'PATCH' && endpoint.startsWith('/subscriptions/')) {
      const subId = endpoint.split('/')[2];
      const sub = subscriptions.find(s => s.id === subId);
      if (!sub) {
        addLog('API Gateway', `Subscription ${subId} not found in repository.`, 'error');
        return { success: false, error: 'Subscription not found' };
      }

      if (body && body.status) {
        updateSubscriptionStatus(subId, body.status);
        return { success: true, data: { ...sub, status: body.status } };
      }
    }

    if (method === 'GET' && endpoint.startsWith('/subscriptions/')) {
      const subId = endpoint.split('/')[2];
      const sub = subscriptions.find(s => s.id === subId);
      if (!sub) {
        addLog('API Gateway', `Subscription ${subId} database lookup missed.`, 'error');
        addLog('PostgreSQL', 'SELECT FROM subscriptions WHERE id = NULL;', 'warn');
        return { success: false, error: 'Subscription not found' };
      }
      
      addLog('PostgreSQL', `SELECT * FROM subscriptions WHERE id = '${subId}';`, 'success');
      addLog('Redis', `Cached subscription payload for id ${subId}.`, 'success');
      return { success: true, data: sub };
    }

    return { success: false, error: 'Endpoint or Method not supported in mock Gateway.' };
  };

  // Actions
  const createSubscription = (email: string, plan: PlanType, interval: BillingInterval): Subscription => {
    addLog('Subscription Service', `Creating new subscription on plan "${plan}" (${interval}) for ${email}`, 'info');
    
    const amounts = { Basic: 1500, Pro: 4000, Enterprise: 25000 };
    const amount = interval === 'yearly' ? amounts[plan] * 10 : amounts[plan]; // 2 months discount

    const subId = `sub_${Math.random().toString(36).substr(2, 8)}`;
    const userId = `usr_${Math.random().toString(36).substr(2, 5)}`;
    
    const now = new Date();
    const createdAt = now.toISOString().split('T')[0];
    
    // Set next billing date
    const nextDate = new Date();
    if (interval === 'monthly') {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }
    const nextBillingDate = nextDate.toISOString().split('T')[0];

    const newSub: Subscription = {
      id: subId,
      userId,
      userEmail: email,
      plan,
      status: 'Active',
      amount,
      interval,
      createdAt,
      nextBillingDate,
    };

    setSubscriptions(prev => [newSub, ...prev]);

    // Create Invoice
    const newInvoice: Invoice = {
      id: `inv_${Math.floor(80000 + Math.random() * 19000)}`,
      subscriptionId: subId,
      userEmail: email,
      plan,
      amount,
      status: 'Paid',
      createdAt,
    };
    setInvoices(prev => [newInvoice, ...prev]);

    // Sync to Express Backend
    if (token && !token.startsWith('mock_')) {
      fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email, plan, interval })
      }).then(r => r.json()).then(res => {
        if (res.success) {
          setSubscriptions(prev => prev.map(s => s.id === subId ? { ...s, id: res.subscription.id } : s));
          setInvoices(prev => prev.map(inv => inv.subscriptionId === subId ? { ...inv, subscriptionId: res.subscription.id } : inv));
          addLog('PostgreSQL', `Committed subscription registry sync: ${res.subscription.id}`, 'success');
        }
      }).catch(e => console.error("Subscription sync failed", e));
    }

    addLog('PostgreSQL', `INSERT INTO subscriptions VALUES ('${subId}', '${email}', 'Active', ${amount});`, 'success');
    addLog('Billing Service', `Generated initial invoice ${newInvoice.id} for ${amount} INR. Transaction successful.`, 'success');
    addLog('RabbitMQ', `Emitted "subscription.created" message to telemetry queue.`, 'info');

    return newSub;
  };

  const updateSubscriptionStatus = (id: string, status: SubscriptionStatus) => {
    addLog('Subscription Service', `Requested status transition for ${id} -> ${status}`, 'info');
    
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        
        let update: Partial<Subscription> = { status };
        if (status === 'Trialing' && !s.trialDaysLeft) {
          update.trialDaysLeft = 14;
        } else if (status !== 'Trialing') {
          update.trialDaysLeft = undefined;
        }

        return { ...s, ...update };
      })
    );

    // Sync to Express Backend
    if (token && !token.startsWith('mock_')) {
      fetch(`/api/subscriptions/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      }).then(r => r.json()).then(res => {
        if (res.success) {
          addLog('PostgreSQL', `Synced status change with server for ID ${id}`, 'success');
        }
      }).catch(e => console.error("Status transition sync failed", e));
    }

    addLog('PostgreSQL', `UPDATE subscriptions SET status = '${status}' WHERE id = '${id}';`, 'success');
    addLog('RabbitMQ', `Broadcasted event "subscription.updated" (id: ${id}, status: ${status})`, 'info');
    
    // If transitioning back to active, trigger a logs entry
    if (status === 'Active') {
      addLog('Billing Service', `Verified billing status for sub ${id}. Invoices up-to-date.`, 'success');
    }
  };

  const updateSubscriptionPlan = (id: string, plan: PlanType, interval: BillingInterval, amount: number) => {
    addLog('Subscription Service', `Requested plan change for ${id} -> ${plan} (${interval})`, 'info');
    
    setSubscriptions(prev =>
      prev.map(s => {
        if (s.id !== id) return s;
        return { ...s, plan, interval, amount };
      })
    );

    const invoiceId = `inv_${Math.random().toString(36).substring(2, 10)}`;
    
    setInvoices(prev => {
      const parentEmail = subscriptions.find(s => s.id === id)?.userEmail || 'unknown@company.com';
      const newInvoice = {
        id: invoiceId,
        subscriptionId: id,
        userEmail: parentEmail,
        plan,
        amount,
        status: 'Paid' as const,
        createdAt: new Date().toISOString().split('T')[0],
      };
      return [newInvoice, ...prev];
    });

    // Sync to Express Backend
    if (token && !token.startsWith('mock_')) {
      fetch(`/api/subscriptions/${id}/migrate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ plan, interval })
      }).then(r => r.json()).then(res => {
        if (res.success) {
          addLog('PostgreSQL', `Database plan migration transaction confirmed for ${id}`, 'success');
          // Re-sync backend invoices to sync proration details
          fetch('/api/subscriptions/invoices', {
            headers: { 'Authorization': `Bearer ${token}` }
          }).then(r => r.json()).then(invRes => {
            if (invRes.success) setInvoices(invRes.invoices);
          });
        }
      }).catch(e => console.error("Migration sync failed", e));
    }

    addLog('PostgreSQL', `UPDATE subscriptions SET plan = '${plan}', interval = '${interval}', amount = ${amount} WHERE id = '${id}';`, 'success');
    addLog('PostgreSQL', `INSERT INTO invoices (id, subscription_id, plan, amount, status) VALUES ('${invoiceId}', '${id}', '${plan}', ${amount}, 'Paid');`, 'success');
    addLog('RabbitMQ', `Broadcasted event "subscription.plan_changed" (id: ${id}, plan: ${plan}, amount: ${amount})`, 'info');
  };

  const retryPayment = (invoiceId: string): boolean => {
    addLog('Billing Service', `Retrying transaction for invoice ${invoiceId}...`, 'info');
    
    let isSuccess = false;
    
    setInvoices(prev =>
      prev.map(inv => {
        if (inv.id !== invoiceId) return inv;
        
        // Successful payment retry simulation
        isSuccess = true;
        
        // Also update the parent subscription state to Active if it was Past Due
        setSubscriptions(subs =>
          subs.map(s => {
            if (s.id === inv.subscriptionId && s.status === 'Past Due') {
              addLog('Subscription Service', `Subscription ${s.id} restored to Active status via payment retry.`, 'success');
              return { ...s, status: 'Active' };
            }
            return s;
          })
        );

        addLog('Billing Service', `Card charge approved. Captured ${inv.amount} INR.`, 'success');
        addLog('PostgreSQL', `UPDATE invoices SET status = 'Paid' WHERE id = '${invoiceId}';`, 'success');
        addLog('RabbitMQ', `Dispatched event "invoice.payment_succeeded" to notifications worker.`, 'info');

        return { ...inv, status: 'Paid' };
      })
    );

    if (isSuccess) {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }

    return isSuccess;
  };

  const deleteSubscription = (id: string) => {
    addLog('Subscription Service', `Hard deleting subscription ${id}`, 'warn');
    setSubscriptions(prev => prev.filter(s => s.id !== id));
    setInvoices(prev => prev.filter(inv => inv.subscriptionId !== id));

    // Sync to Express Backend
    if (token && !token.startsWith('mock_')) {
      fetch(`/api/subscriptions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(r => r.json()).then(res => {
        if (res.success) {
          addLog('PostgreSQL', `Successfully deleted subscription registry database record for ${id}`, 'success');
        }
      }).catch(e => console.error("Deletion sync failed", e));
    }

    addLog('PostgreSQL', `DELETE FROM subscriptions WHERE id = '${id}';`, 'success');
    addLog('PostgreSQL', `DELETE FROM invoices WHERE subscription_id = '${id}';`, 'success');
    addLog('Redis', `Evicted cache keys matching subscription id ${id}.`, 'success');
  };

  return (
    <SubscriptionContext.Provider
      value={{
        theme,
        toggleTheme,
        activePage,
        setActivePage,
        dashboardTab,
        setDashboardTab,
        subscriptions: filteredSubscriptions,
        invoices: filteredInvoices,
        systemLogs,
        metrics,
        createSubscription,
        updateSubscriptionStatus,
        updateSubscriptionPlan,
        retryPayment,
        deleteSubscription,
        clearLogs,
        addLog,
        triggerMockApi,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
