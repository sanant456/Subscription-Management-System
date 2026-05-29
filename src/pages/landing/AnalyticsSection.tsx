import React from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, LineChart, Line, RadialBarChart, RadialBar 
} from 'recharts';

interface AnalyticsSectionProps {
  activeChart: 'revenue' | 'churn' | 'growth' | 'success';
  setActiveChart: (chart: 'revenue' | 'churn' | 'growth' | 'success') => void;
  revenueData: any[];
  churnData: any[];
  subscriberData: any[];
  paymentSuccessData: any[];
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({
  activeChart,
  setActiveChart,
  revenueData,
  churnData,
  subscriberData,
  paymentSuccessData,
}) => {
  return (
    <section id="analytics" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-12">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
          Live Analytics Dashboard Preview
        </h2>
        <p className="text-gray-400 light-theme:text-gray-600">
          Preview the key metrics analyzed in real time as subscriptions are processed.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 mt-8">
          <button 
            onClick={() => setActiveChart('revenue')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeChart === 'revenue' ? 'bg-[#1e1e38] text-purple-400 border border-purple-500/30' : 'bg-black/20 hover:bg-black/40 text-gray-400 border border-white/5'}`}
          >
            Monthly Revenue
          </button>
          <button 
            onClick={() => setActiveChart('churn')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeChart === 'churn' ? 'bg-[#1e1e38] text-purple-400 border border-purple-500/30' : 'bg-black/20 hover:bg-black/40 text-gray-400 border border-white/5'}`}
          >
            Churn Rate
          </button>
          <button 
            onClick={() => setActiveChart('growth')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeChart === 'growth' ? 'bg-[#1e1e38] text-purple-400 border border-purple-500/30' : 'bg-black/20 hover:bg-black/40 text-gray-400 border border-white/5'}`}
          >
            Subscriber Growth
          </button>
          <button 
            onClick={() => setActiveChart('success')}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer ${activeChart === 'success' ? 'bg-[#1e1e38] text-purple-400 border border-purple-500/30' : 'bg-black/20 hover:bg-black/40 text-gray-400 border border-white/5'}`}
          >
            Payment Success Rate
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl max-w-4xl mx-auto h-[350px] flex items-center justify-center bg-black/30 border border-white/5">
        {activeChart === 'revenue' && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorMRR" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e304f" opacity={0.3} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <Area type="monotone" dataKey="MRR" name="Monthly Recurring Revenue" stroke="#a78bfa" strokeWidth={2} fillOpacity={1} fill="url(#colorMRR)" />
            </AreaChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'churn' && (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={churnData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e304f" opacity={0.3} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <Bar dataKey="Rate" name="Churn Rate (%)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'growth' && (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={subscriberData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2e304f" opacity={0.3} />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
              <YAxis stroke="#9ca3af" fontSize={11} />
              <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
              <Line type="monotone" dataKey="Users" name="Active Subscribers" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        )}

        {activeChart === 'success' && (
          <div className="flex flex-col md:flex-row items-center justify-around w-full gap-6">
            <div className="w-[200px] h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="25%" outerRadius="100%" barSize={8} data={paymentSuccessData}>
                  <RadialBar
                    label={{ position: 'insideStart', fill: '#fff', fontSize: 8 }}
                    background
                    dataKey="value"
                  />
                  <Tooltip contentStyle={{ background: '#0a0a1a', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-3 font-medium text-sm">
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#06b6d4] inline-block"/> First Attempt: 92.4%</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#8b5cf6] inline-block"/> First Smart Retry: 5.1%</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#3b82f6] inline-block"/> Second Retry: 1.8%</div>
              <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-[#f43f5e] inline-block"/> Failed (Hard Churn): 0.7%</div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
