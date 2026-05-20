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

export default router;
