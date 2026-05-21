import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

import authRouter from './routes/auth';
import subscriptionRouter from './routes/subscriptions';
import adminRouter from './routes/admin';
import stripeRouter from './routes/stripe';

dotenv.config();

const app = express();
const port = process.env.PORT || 5001;

// Setup HTTP Server & Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // open CORS for development simplicity
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
  }
});

// Configure Middlewares
app.use(cors());
app.use(express.json({
  verify: (req: any, res, buf) => {
    req.rawBody = buf;
  }
}));

// Bind API Routers
app.use('/api/auth', authRouter);
app.use('/api/subscriptions', subscriptionRouter);
app.use('/api/admin', adminRouter);
app.use('/api/stripe', stripeRouter);

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
  io.emit('broadcast', message);
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
