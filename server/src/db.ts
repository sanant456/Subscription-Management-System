import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

// Local storage fallback file
const STORAGE_FILE = path.join(__dirname, 'db_fallback.json');

// Memory cache for fallback
let localStore = {
  users: [] as any[],
  subscriptions: [] as any[],
  invoices: [] as any[],
  payments: [] as any[]
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
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: 'inactive',
      createdAt: new Date()
    },
    {
      id: 'usr_admin',
      name: 'Root Admin',
      email: 'admin@saascorp.com',
      password: '$2a$10$MeVExSoIGSe7sIOz5ojBS.VCgRN6DICCFRafaq9529vzmiJBboR5W', // hashed "password"
      role: 'ADMIN',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: 'inactive',
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
  localStore.payments = [
    {
      id: 'pay_b8d38e21',
      userId: 'usr_81923',
      subscriptionId: 'sub_b8d38e21',
      razorpayOrderId: 'order_b8d38e21_id',
      razorpayPaymentId: 'pay_b8d38e21_id',
      amount: 49,
      currency: 'INR',
      status: 'SUCCESS',
      paymentDate: new Date()
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
      createdAt: new Date(),
      paymentId: 'pay_b8d38e21',
      invoiceNumber: 'INV-2026-81923',
      generatedAt: new Date()
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

  if (!localStore.payments) {
    localStore.payments = [];
  }

  // Ensure admin@saascorp.com is present in localStore.users
  const adminEmail = 'admin@saascorp.com';
  const hasAdmin = localStore.users.some(u => u.email.toLowerCase() === adminEmail);
  if (!hasAdmin) {
    localStore.users.push({
      id: 'usr_admin',
      name: 'Root Admin',
      email: adminEmail,
      password: '$2a$10$MeVExSoIGSe7sIOz5ojBS.VCgRN6DICCFRafaq9529vzmiJBboR5W', // hashed "password"
      role: 'ADMIN',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      subscriptionStatus: 'inactive',
      createdAt: new Date()
    });
    saveLocalStore();
  }
};

const saveLocalStore = () => {
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(localStore, null, 2), 'utf-8');
};

// Initialize
loadLocalStore();

let prisma: PrismaClient | null = null;
let useFallback = true;

const seedPostgresStore = async () => {
  if (!prisma) return;
  try {
    const userCount = await prisma.user.count();
    if (userCount === 0) {
      console.log('🌱 Seeding PostgreSQL database with default data...');
      
      // 1. Create Users
      await prisma.user.createMany({
        data: [
          {
            id: 'usr_81923',
            name: 'Sarah Jenkins',
            email: 'sarah@saasflow.com',
            password: '$2a$10$U.V1Z4j73j5N.qQ1S.t6A.d08B5o2C0t1y0eU8z8K1L4U4d4e4F4G',
            role: 'ADMIN',
            stripeCustomerId: 'cus_sarah_123',
            stripeSubscriptionId: 'sub_b8d38e21',
            subscriptionStatus: 'active',
            createdAt: new Date()
          },
          {
            id: 'usr_admin',
            name: 'Root Admin',
            email: 'admin@saascorp.com',
            password: '$2a$10$MeVExSoIGSe7sIOz5ojBS.VCgRN6DICCFRafaq9529vzmiJBboR5W', // password
            role: 'ADMIN',
            stripeCustomerId: null,
            stripeSubscriptionId: null,
            subscriptionStatus: 'inactive',
            createdAt: new Date()
          }
        ]
      });

      // 2. Create Subscriptions
      await prisma.subscription.create({
        data: {
          id: 'sub_b8d38e21',
          userId: 'usr_81923',
          userEmail: 'sarah@saasflow.com',
          plan: 'Pro',
          status: 'Active',
          amount: 4000,
          interval: 'monthly',
          trialDaysLeft: null,
          createdAt: new Date(),
          nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      });

      // 3. Create Invoices
      await prisma.invoice.create({
        data: {
          id: 'inv_b8d38e21',
          subscriptionId: 'sub_b8d38e21',
          userId: 'usr_81923',
          userEmail: 'sarah@saasflow.com',
          plan: 'Pro',
          amount: 4000,
          status: 'Paid',
          createdAt: new Date(),
          invoiceNumber: 'INV-2026-81923',
          generatedAt: new Date()
        }
      });

      console.log('✅ PostgreSQL seeding completed.');
    }
  } catch (e) {
    console.error('❌ Failed to seed PostgreSQL database:', e);
  }
};

if (process.env.DATABASE_URL) {
  try {
    prisma = new PrismaClient();
    useFallback = false;
    console.log('🔌 Connected successfully to PostgreSQL via Prisma Client.');
    // Run async seed
    seedPostgresStore();
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
      const newUser = { 
        id: `usr_${Math.random().toString(36).substring(2, 9)}`, 
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: 'inactive',
        createdAt: new Date(), 
        ...args.data 
      };
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
      const newInvoice = { 
        id: `inv_${Math.random().toString(36).substring(2, 9)}`, 
        createdAt: new Date(), 
        generatedAt: new Date(),
        invoiceNumber: `INV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`,
        ...args.data 
      };
      localStore.invoices.push(newInvoice);
      saveLocalStore();
      return newInvoice;
    }
  },

  payment: {
    findMany: async (args?: { where?: { userId?: string } }) => {
      if (!useFallback && prisma) return prisma.payment.findMany(args);
      if (args?.where?.userId) {
        return (localStore.payments || []).filter(p => p.userId === args.where?.userId);
      }
      return localStore.payments || [];
    },
    findUnique: async (args: { where: { id: string } }) => {
      if (!useFallback && prisma) return prisma.payment.findUnique(args);
      return (localStore.payments || []).find(p => p.id === args.where.id) || null;
    },
    findFirst: async (args: { where: { razorpayOrderId: string } }) => {
      if (!useFallback && prisma) return prisma.payment.findFirst(args);
      return (localStore.payments || []).find(p => p.razorpayOrderId === args.where.razorpayOrderId) || null;
    },
    create: async (args: { data: any }) => {
      if (!useFallback && prisma) return prisma.payment.create(args);
      const newPayment = {
        id: `pay_${Math.random().toString(36).substring(2, 9)}`,
        paymentDate: new Date(),
        currency: 'INR',
        ...args.data
      };
      if (!localStore.payments) localStore.payments = [];
      localStore.payments.push(newPayment);
      saveLocalStore();
      return newPayment;
    },
    update: async (args: { where: { id: string }, data: any }) => {
      if (!useFallback && prisma) return prisma.payment.update(args);
      const idx = (localStore.payments || []).findIndex(p => p.id === args.where.id);
      if (idx === -1) throw new Error('Payment not found');
      localStore.payments[idx] = { ...localStore.payments[idx], ...args.data };
      saveLocalStore();
      return localStore.payments[idx];
    }
  }
};
