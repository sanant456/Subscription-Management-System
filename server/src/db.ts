import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Local storage fallback file
const STORAGE_FILE = path.join(__dirname, 'db_fallback.json');

// Memory cache for fallback
let localStore = {
  users: [] as any[],
  subscriptions: [] as any[],
  invoices: [] as any[]
};

// Seed administrative user
const seedLocalStore = () => {
  localStore.users = [
    {
      id: 'usr_81923',
      name: 'Sarah Jenkins',
      email: 'sarah@saasflow.com',
      password: '$2a$10$U.V1Z4j73j5N.qQ1S.t6A.d08B5o2C0t1y0eU8z8K1L4U4d4e4F4G', // mock hashed password
      role: 'ADMIN',
      createdAt: new Date()
    }
  ];
  localStore.subscriptions = [
    {
      id: 'sub_b8d38e21',
      userId: 'usr_81923',
      userEmail: 'sarah@saasflow.com',
      plan: 'Pro',
      status: 'Active',
      amount: 49,
      interval: 'monthly',
      trialDaysLeft: null,
      createdAt: new Date(),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  ];
  localStore.invoices = [
    {
      id: 'inv_b8d38e21',
      subscriptionId: 'sub_b8d38e21',
      userId: 'usr_81923',
      userEmail: 'sarah@saasflow.com',
      plan: 'Pro',
      amount: 49,
      status: 'Paid',
      createdAt: new Date()
    }
  ];
  saveLocalStore();
};

const loadLocalStore = () => {
  if (fs.existsSync(STORAGE_FILE)) {
    try {
      const data = fs.readFileSync(STORAGE_FILE, 'utf-8');
      localStore = JSON.parse(data);
    } catch (e) {
      console.warn('⚠️ Could not load fallback JSON store, resetting.');
      seedLocalStore();
    }
  } else {
    seedLocalStore();
  }
};

const saveLocalStore = () => {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
};

// Initialize
loadLocalStore();

let prisma: PrismaClient | null = null;
let useFallback = true;

if (process.env.DATABASE_URL) {
  try {
    prisma = new PrismaClient();
    useFallback = false;
    console.log('🔌 Connected successfully to PostgreSQL via Prisma Client.');
  } catch (e) {
    console.warn('⚠️ Prisma Client initialization failed. Falling back to JSON database.');
    useFallback = true;
  }
} else {
  console.log('ℹ️ DATABASE_URL not set. Running database client in JSON local storage mode.');
  useFallback = true;
}

export const db = {
  isFallback: () => useFallback,
  
  user: {
    findUnique: async (args: { where: { email: string } }) => {
      if (!useFallback && prisma) return prisma.user.findUnique(args);
      return localStore.users.find(u => u.email === args.where.email) || null;
    },
    findMany: async () => {
      if (!useFallback && prisma) return prisma.user.findMany();
      return localStore.users;
    },
    create: async (args: { data: any }) => {
      if (!useFallback && prisma) return prisma.user.create(args);
      const newUser = { id: `usr_${Math.random().toString(36).substring(2, 9)}`, createdAt: new Date(), ...args.data };
      localStore.users.push(newUser);
      saveLocalStore();
      return newUser;
    },
    update: async (args: { where: { id: string }, data: any }) => {
      if (!useFallback && prisma) return prisma.user.update(args);
      const userIdx = localStore.users.findIndex(u => u.id === args.where.id);
      if (userIdx === -1) throw new Error('User not found');
      localStore.users[userIdx] = { ...localStore.users[userIdx], ...args.data };
      saveLocalStore();
      return localStore.users[userIdx];
    }
  },

  subscription: {
    findMany: async (args?: { where?: { userId?: string } }) => {
      if (!useFallback && prisma) return prisma.subscription.findMany(args);
      if (args?.where?.userId) {
        return localStore.subscriptions.filter(s => s.userId === args.where?.userId);
      }
      return localStore.subscriptions;
    },
    findFirst: async (args: { where: { id: string } }) => {
      if (!useFallback && prisma) return prisma.subscription.findFirst(args);
      return localStore.subscriptions.find(s => s.id === args.where.id) || null;
    },
    create: async (args: { data: any }) => {
      if (!useFallback && prisma) return prisma.subscription.create(args);
      const newSub = { 
        createdAt: new Date(), 
        nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ...args.data 
      };
      localStore.subscriptions.push(newSub);
      saveLocalStore();
      return newSub;
    },
    update: async (args: { where: { id: string }, data: any }) => {
      if (!useFallback && prisma) return prisma.subscription.update(args);
      const idx = localStore.subscriptions.findIndex(s => s.id === args.where.id);
      if (idx === -1) throw new Error('Subscription not found');
      localStore.subscriptions[idx] = { ...localStore.subscriptions[idx], ...args.data };
      saveLocalStore();
      return localStore.subscriptions[idx];
    },
    delete: async (args: { where: { id: string } }) => {
      if (!useFallback && prisma) return prisma.subscription.delete(args);
      const idx = localStore.subscriptions.findIndex(s => s.id === args.where.id);
      if (idx === -1) throw new Error('Subscription not found');
      const deleted = localStore.subscriptions[idx];
      localStore.subscriptions.splice(idx, 1);
      
      // Cascade delete: filter out invoices associated with this subscription
      localStore.invoices = localStore.invoices.filter(i => i.subscriptionId !== args.where.id);
      
      saveLocalStore();
      return deleted;
    }
  },

  invoice: {
    findMany: async (args?: { where?: { userId?: string } }) => {
      if (!useFallback && prisma) return prisma.invoice.findMany(args);
      if (args?.where?.userId) {
        return localStore.invoices.filter(i => i.userId === args.where?.userId);
      }
      return localStore.invoices;
    },
    create: async (args: { data: any }) => {
      if (!useFallback && prisma) return prisma.invoice.create(args);
      const newInvoice = { id: `inv_${Math.random().toString(36).substring(2, 9)}`, createdAt: new Date(), ...args.data };
      localStore.invoices.push(newInvoice);
      saveLocalStore();
      return newInvoice;
    }
  }
};
