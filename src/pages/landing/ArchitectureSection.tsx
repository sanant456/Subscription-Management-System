import React from 'react';
import { Terminal } from 'lucide-react';

export const ArchitectureSection: React.FC = () => {
  return (
    <section id="architecture" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 bg-black/20 rounded-3xl relative overflow-hidden">
      <div className="text-center max-w-2xl mx-auto mb-16 relative z-10">
        <span className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2 inline-block">System Blueprint</span>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
          High-Performance Microservices Architecture
        </h2>
        <p className="text-gray-400 light-theme:text-gray-600">
          Optimized for 99.999% reliability with isolated services and robust queue-based decoupling.
        </p>
      </div>

      {/* The Diagram UI */}
      <div className="relative p-6 lg:p-12 border border-white/5 rounded-2xl bg-black/40 overflow-x-auto min-w-[700px] lg:min-w-0">
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1000 400">
          {/* Connecting lines */}
          {/* Gateway -> Services */}
          <path d="M 120 180 Q 250 80 340 80" stroke="#8b5cf6" strokeWidth="1.5" fill="none" className="opacity-30" />
          <path d="M 120 180 H 340" stroke="#8b5cf6" strokeWidth="1.5" fill="none" className="opacity-30" />
          <path d="M 120 180 Q 250 280 340 280" stroke="#8b5cf6" strokeWidth="1.5" fill="none" className="opacity-30" />

          {/* Services -> Databases & Cache */}
          <path d="M 500 80 Q 600 80 660 140" stroke="#06b6d4" strokeWidth="1.5" fill="none" className="opacity-30" />
          <path d="M 500 180 Q 580 180 660 180" stroke="#06b6d4" strokeWidth="1.5" fill="none" className="opacity-30" />
          <path d="M 500 280 Q 600 280 660 220" stroke="#06b6d4" strokeWidth="1.5" fill="none" className="opacity-30" />

          {/* Database Sync lines */}
          <path d="M 760 180 H 840" stroke="#10b981" strokeWidth="1.5" fill="none" className="opacity-30" />
          <path d="M 880 200 V 260 H 500" stroke="#f43f5e" strokeWidth="1.5" fill="none" className="opacity-30" />
          
          {/* Moving Pulsing Circles along paths */}
          <circle r="4" fill="#a78bfa" className="glow-dot">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 120 180 Q 250 80 340 80" />
          </circle>
          <circle r="4" fill="#22d3ee" className="glow-dot">
            <animateMotion dur="3s" repeatCount="indefinite" path="M 120 180 H 340" />
          </circle>
          <circle r="4" fill="#a78bfa" className="glow-dot">
            <animateMotion dur="5s" repeatCount="indefinite" path="M 120 180 Q 250 280 340 280" />
          </circle>
          <circle r="4" fill="#34d399" className="glow-dot">
            <animateMotion dur="4s" repeatCount="indefinite" path="M 500 180 Q 580 180 660 180" />
          </circle>
          <circle r="4" fill="#fb7185" className="glow-dot">
            <animateMotion dur="6s" repeatCount="indefinite" path="M 880 200 V 260 H 500" />
          </circle>
        </svg>

        {/* Service Grid Layout */}
        <div className="grid grid-cols-12 gap-y-12 gap-x-4 items-center relative z-10 text-center text-xs font-semibold">
          {/* API GATEWAY */}
          <div className="col-span-3 flex flex-col items-center">
            <div className="h-10 w-10 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2">
              <Terminal className="h-5 w-5" />
            </div>
            <div className="glass-panel py-2.5 px-4 rounded-xl border border-purple-500/40 text-purple-300 shadow-[0_0_15px_rgba(124,58,237,0.1)]">
              API Gateway
              <div className="text-[9px] text-gray-500 font-mono mt-0.5">Rate Limit / Auth</div>
            </div>
          </div>

          {/* SERVICES COLUMN */}
          <div className="col-span-5 flex flex-col gap-6 items-center">
            {/* Auth Service */}
            <div className="w-52 glass-panel p-3.5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors">
              <div className="text-[#a78bfa] mb-1 font-bold">Auth Service</div>
              <div className="text-[10px] text-gray-400 leading-none">OAuth 2.0 / JWT Issuance</div>
            </div>
            
            {/* Subscription Service */}
            <div className="w-52 glass-panel p-3.5 rounded-xl border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.05)] hover:border-cyan-500/60 transition-colors">
              <div className="text-cyan-300 mb-1 font-bold">Subscription Service</div>
              <div className="text-[10px] text-gray-400 leading-none">Status Lifecycle & State Engine</div>
            </div>
            
            {/* Billing Service */}
            <div className="w-52 glass-panel p-3.5 rounded-xl border border-white/10 hover:border-purple-500/30 transition-colors">
              <div className="text-[#a78bfa] mb-1 font-bold">Billing Service</div>
              <div className="text-[10px] text-gray-400 leading-none">Invoicing / Retries / Stripe Integration</div>
            </div>
          </div>

          {/* DATA LAYER */}
          <div className="col-span-4 flex flex-col gap-5 items-center">
            {/* Redis Cache */}
            <div className="w-44 glass-panel p-3 rounded-xl border border-red-500/30">
              <div className="text-red-400 mb-1 font-bold">Redis Cache</div>
              <div className="text-[9px] text-gray-400">Tokens / Sessions / API rate states</div>
            </div>

            {/* PostgreSQL */}
            <div className="w-44 glass-panel p-3 rounded-xl border border-blue-500/30">
              <div className="text-blue-400 mb-1 font-bold">PostgreSQL DB</div>
              <div className="text-[9px] text-gray-400">Subscriptions / Clients / Invoices</div>
            </div>

            {/* RabbitMQ */}
            <div className="w-44 glass-panel p-3 rounded-xl border border-emerald-500/30">
              <div className="text-emerald-400 mb-1 font-bold">RabbitMQ Exchange</div>
              <div className="text-[9px] text-gray-400">Asynchronous Webhook Queues</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
