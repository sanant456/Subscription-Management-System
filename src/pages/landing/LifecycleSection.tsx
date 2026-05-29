import React from 'react';
import { ArrowRight } from 'lucide-react';

export const LifecycleSection: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2 inline-block">Subscription Lifecycle</span>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
          Predictable Lifecycle Progression States
        </h2>
        <p className="text-gray-400 light-theme:text-gray-600">
          Understand how SubVault manages automatic state transitions to protect recurring revenue.
        </p>
      </div>

      {/* Horizontal Flow Container */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4 max-w-6xl mx-auto relative">
        
        {/* Step 1: Trialing */}
        <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
          <div className="h-14 w-14 rounded-full bg-cyan-950/50 border border-cyan-500/50 flex items-center justify-center text-cyan-300 font-bold text-sm mb-4 glow-dot">
            Trial
          </div>
          <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Trialing</div>
          <p className="text-[11px] text-gray-400 mt-1 leading-normal">Initial user trial (e.g. 14 days)</p>
        </div>

        <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

        {/* Step 2: Active */}
        <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
          <div className="h-14 w-14 rounded-full bg-emerald-950/50 border border-emerald-500/50 flex items-center justify-center text-emerald-300 font-bold text-sm mb-4 glow-dot">
            Active
          </div>
          <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Active</div>
          <p className="text-[11px] text-gray-400 mt-1 leading-normal">Successful billing cycles recurring</p>
        </div>

        <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

        {/* Step 3: Paused */}
        <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
          <div className="h-14 w-14 rounded-full bg-yellow-950/50 border border-yellow-500/50 flex items-center justify-center text-yellow-300 font-bold text-sm mb-4 glow-dot">
            Pause
          </div>
          <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Paused</div>
          <p className="text-[11px] text-gray-400 mt-1 leading-normal">Billing suspended temporarily</p>
        </div>

        <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

        {/* Step 4: Past Due */}
        <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
          <div className="h-14 w-14 rounded-full bg-orange-950/50 border border-orange-500/50 flex items-center justify-center text-orange-300 font-bold text-sm mb-4 glow-dot">
            Due
          </div>
          <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Past Due</div>
          <p className="text-[11px] text-gray-400 mt-1 leading-normal">Payment failed. Enters retry phase</p>
        </div>

        <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

        {/* Step 5: Cancelled */}
        <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
          <div className="h-14 w-14 rounded-full bg-rose-950/50 border border-rose-500/50 flex items-center justify-center text-rose-300 font-bold text-sm mb-4 glow-dot">
            Cancel
          </div>
          <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Cancelled</div>
          <p className="text-[11px] text-gray-400 mt-1 leading-normal">Grace period pending end cycle</p>
        </div>

        <ArrowRight className="h-5 w-5 text-gray-600 rotate-90 lg:rotate-0" />

        {/* Step 6: Expired */}
        <div className="flex flex-col items-center text-center relative z-10 w-full max-w-[150px]">
          <div className="h-14 w-14 rounded-full bg-gray-950 border border-gray-600 flex items-center justify-center text-gray-400 font-bold text-sm mb-4">
            End
          </div>
          <div className="font-heading font-semibold text-white light-theme:text-gray-900 text-sm">Expired</div>
          <p className="text-[11px] text-gray-400 mt-1 leading-normal">Hard cut-off. Service terminated</p>
        </div>

      </div>
    </section>
  );
};
