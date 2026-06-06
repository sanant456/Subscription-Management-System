import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import subscriptionRouter from './routes/subscriptions';
import adminRouter from './routes/admin';
import stripeRouter from './routes/stripe';
import razorpayRouter from './routes/razorpay';
import qrRouter from './routes/qr';
import paymentsRouter from './routes/payments';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// ── Allowed Origins ────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:80',
  'http://localhost',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Setup HTTP Server & Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ALLOWED_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
  }
});

// ── Rate Limiter (in-memory, per-IP) ───────────────────────────────────────────
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 100; // 100 requests per window

const rateLimiter: express.RequestHandler = (req, res, next) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return next();
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    res.status(429).json({ success: false, error: 'Too many requests. Please try again later.' });
    return;
  }

  entry.count++;
  next();
};

// ── Configure Middlewares ──────────────────────────────────────────────────────
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use('/api', rateLimiter);

// ── Bind API Routers ───────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stripe', stripeRouter);
app.use('/api/razorpay', razorpayRouter);
app.use('/api/qr', qrRouter);
app.use('/api/payments', paymentsRouter);

// ── Health Check Endpoint (for Docker / k8s readiness probes) ──────────────────
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    memoryUsage: process.memoryUsage().rss,
  });
});

// Base Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'SubVault Subscription Management System API Gateway v1.0',
    timestamp: new Date()
  });
});

// Broadcast export function
export const broadcastMessage = (message: string) => {
  io.emit('broadcast', { message });
};

// WebSocket Event Listeners
io.on('connection', (socket) => {
  console.log(`🔌 Client connected to WebSocket: ${socket.id}`);
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected from WebSocket: ${socket.id}`);
  });
});

// Start listening
server.listen(port, () => {
  console.log(`🚀 Gateway Server running on http://localhost:${port}`);
  console.log(`🚀 WebSocket socket.io endpoint attached.`);
});

