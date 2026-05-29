import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { 
  AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';

interface HeroSectionProps {
  revenueData: any[];
}

export const HeroSection: React.FC<HeroSectionProps> = ({ revenueData }) => {
  const navigate = useNavigate();

  return (
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
  );
};
