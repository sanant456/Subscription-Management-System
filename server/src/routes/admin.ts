import { Router, Response } from 'express';
import { db } from '../db';
import { authenticateToken, AuthRequest } from './auth';
import { broadcastMessage } from '../index'; // imported from server entrypoint

const router = Router();

// Middleware to restrict access to ADMIN only
const requireAdmin = (req: AuthRequest, res: Response, next: any) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ success: false, error: 'Forbidden. Requiring elevated administrator clearance.' });
  }
  next();
};

// Global memory store for mock refund queue
let refundQueue = [
  {
    id: 'ref_1',
    userEmail: 'charlie.brown@peanuts.com',
    amount: 4000,
    reason: 'Incorrect plan selected during signup migration.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ref_2',
    userEmail: 'clara.oswald@tardis.org',
    amount: 25000,
    reason: 'Billing frequency interval upgrade mismatch request.',
    status: 'Pending',
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  }
];

// List all registered platform users
router.get('/users', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.user.findMany();
    // remove passwords
    const sanitized = list.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt
    }));
    res.json({ success: true, users: sanitized });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Telemetry Server Health Indicators
router.get('/health', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const cpuLoad = Math.floor(Math.random() * 25) + 12; // 12% - 37% load
  const memoryUsed = Math.floor(Math.random() * 150) + 450; // 450MB - 600MB
  const redisQueueSize = Math.floor(Math.random() * 4); // 0-3 background items

  res.json({
    success: true,
    telemetry: {
      uptime: process.uptime(),
      cpuLoad: `${cpuLoad}%`,
      memoryUsage: `${memoryUsed} MB / 1024 MB`,
      databaseStatus: db.isFallback() ? 'Fallback JSON db' : 'PostgreSQL Online',
      redisStatus: 'Connected',
      redisQueueSize,
      apiRequestsCount: Math.floor(Math.random() * 2000) + 14000
    }
  });
});

// Refund Requests List
router.get('/refunds', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  res.json({ success: true, refunds: refundQueue });
});

// Approve Refund Request
router.post('/refunds/:id/approve', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  const request = refundQueue.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ success: false, error: 'Refund packet not found.' });

  try {
    request.status = 'Approved';
    
    // Broadcast notification
    broadcastMessage(`Refund of ₹${request.amount} approved for client: ${request.userEmail}`);
    res.json({ success: true, refunds: refundQueue });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Deny Refund Request
router.post('/refunds/:id/deny', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const request = refundQueue.find(r => r.id === req.params.id);
  if (!request) return res.status(404).json({ success: false, error: 'Refund packet not found.' });

  request.status = 'Rejected';
  broadcastMessage(`Refund of ₹${request.amount} declined for client: ${request.userEmail}`);
  res.json({ success: true, refunds: refundQueue });
});

// Broadcast Global System Announcement
router.post('/broadcast', authenticateToken, requireAdmin, (req: AuthRequest, res: Response) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ success: false, error: 'Broadcast message missing.' });

  broadcastMessage(message);
  res.json({ success: true, message: `System wide broadcast dispatched: "${message}"` });
});

// List all transactions (Payments) across the platform with filtering
router.get('/payments', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const list = await db.payment.findMany();
    
    // In-memory searching & filtering to support both database fallbacks
    const { email, plan, status } = req.query;
    
    let filtered = [...list];
    
    // Sort descending by date
    filtered.sort((a: any, b: any) => {
      const dateA = new Date(a.paymentDate).getTime();
      const dateB = new Date(b.paymentDate).getTime();
      return dateB - dateA;
    });

    const users = await db.user.findMany();
    const userMap = new Map(users.map((u: any) => [u.id, u.email.toLowerCase()]));
    const subs = await db.subscription.findMany();
    const subMap = new Map(subs.map((s: any) => [s.id, s.plan]));

    if (email) {
      const emailLower = (email as string).toLowerCase();
      filtered = filtered.filter(p => {
        const uEmail = userMap.get(p.userId) || '';
        return uEmail.includes(emailLower);
      });
    }

    if (plan) {
      filtered = filtered.filter(p => {
        const pPlan = subMap.get(p.subscriptionId) || '';
        return pPlan.toLowerCase() === (plan as string).toLowerCase();
      });
    }

    if (status) {
      filtered = filtered.filter(p => p.status.toLowerCase() === (status as string).toLowerCase());
    }

    const mapped = filtered.map(p => ({
      ...p,
      userEmail: userMap.get(p.userId) || 'unknown@company.com',
      plan: subMap.get(p.subscriptionId) || 'Pro'
    }));

    res.json({ success: true, payments: mapped });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Generate revenue reports and analytics
router.get('/revenue-report', authenticateToken, requireAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const payments = await db.payment.findMany();
    const successfulPayments = payments.filter(p => p.status === 'SUCCESS' || p.status === 'Success');
    
    const subs = await db.subscription.findMany();
    const subPlanMap = new Map(subs.map((s: any) => [s.id, s.plan]));
    
    let totalRevenue = 0;
    let successCount = successfulPayments.length;
    let failedCount = payments.filter(p => p.status === 'FAILED' || p.status === 'Failed').length;
    let pendingCount = payments.filter(p => p.status === 'PENDING' || p.status === 'Pending').length;
    
    const planBreakdown = { Basic: 0, Pro: 0, Enterprise: 0 };
    const monthlyRevenue: Record<string, number> = {};

    successfulPayments.forEach(p => {
      totalRevenue += p.amount;
      
      const plan = subPlanMap.get(p.subscriptionId) || 'Pro';
      if (plan in planBreakdown) {
        planBreakdown[plan as keyof typeof planBreakdown]++;
      }

      // Group by month
      const date = new Date(p.paymentDate);
      const monthName = date.toLocaleString('en-US', { month: 'short' });
      monthlyRevenue[monthName] = (monthlyRevenue[monthName] || 0) + p.amount;
    });

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth();
    const activeMonths = months.slice(0, currentMonth + 1);
    
    const growthChart = activeMonths.map(m => ({
      month: m,
      revenue: monthlyRevenue[m] || 0
    }));

    res.json({
      success: true,
      report: {
        totalRevenue,
        successCount,
        failedCount,
        pendingCount,
        successRate: payments.length > 0 ? Math.round((successCount / payments.length) * 100) : 100,
        planBreakdown,
        growthChart
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
