import React from 'react';
import { motion } from 'framer-motion';
import { X, RotateCw } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { PLAN_TIERS } from '../../shared/pricing';
import type { PlanType, BillingInterval, Subscription } from '../../context/SubscriptionContext';

interface ProrateModalProps {
  prorateModalOpen: boolean;
  setProrateModalOpen: (open: boolean) => void;
  selectedSub: Subscription | null;
  proratePlan: PlanType;
  setProratePlan: (plan: PlanType) => void;
  prorateInterval: BillingInterval;
  setProrateInterval: (interval: BillingInterval) => void;
  getProrationDetails: () => {
    oldPrice: number;
    newPrice: number;
    credit: number;
    dueToday: number;
    balanceRemaining: number;
  };
  handleProrateMigration: () => void;
}

export const ProrateModal: React.FC<ProrateModalProps> = ({
  prorateModalOpen,
  setProrateModalOpen,
  selectedSub,
  proratePlan,
  setProratePlan,
  prorateInterval,
  setProrateInterval,
  getProrationDetails,
  handleProrateMigration,
}) => {
  if (!prorateModalOpen || !selectedSub) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="glass-panel border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl relative bg-[#0a0a20]"
      >
        <button 
          onClick={() => setProrateModalOpen(false)}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="font-heading font-bold text-lg text-white mb-2 flex items-center gap-2">
          <RotateCw className="h-5 w-5 text-purple-400" /> Plan Migration Configuration
        </h3>
        <p className="text-gray-400 text-xs mb-4">
          Migrate subscription plan cycle with instant prorated adjustments. Credits are automatically calculated and subtracted.
        </p>

        <div className="space-y-4">
          <div className="p-3 bg-black/40 border border-white/5 rounded-xl text-xs space-y-1.5">
            <div className="text-gray-500 font-bold uppercase text-[9px]">Current Cycle Plan</div>
            <div className="flex justify-between items-center text-white">
              <span className="font-bold">{selectedSub.plan} Plan</span>
              <span className="font-mono">₹{selectedSub.amount.toLocaleString()} / {selectedSub.interval}</span>
            </div>
          </div>

          {/* Target plan choice */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Select New Target Plan</label>
            <div className="grid grid-cols-3 gap-2">
              {PLAN_TIERS.map((plan) => (
                <button
                  key={plan}
                  type="button"
                  onClick={() => setProratePlan(plan)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    proratePlan === plan 
                      ? 'border-purple-500 bg-purple-500/10 text-white' 
                      : 'border-white/5 bg-black/20 text-gray-400 hover:text-white'
                  }`}
                >
                  {plan}
                </button>
              ))}
            </div>
          </div>

          {/* Billing Interval Toggle */}
          <div className="space-y-2">
            <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Interval Cycle</label>
            <div className="grid grid-cols-2 gap-2">
              {(['monthly', 'yearly'] as BillingInterval[]).map((interval) => (
                <button
                  key={interval}
                  type="button"
                  onClick={() => setProrateInterval(interval)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    prorateInterval === interval 
                      ? 'border-purple-500 bg-purple-500/10 text-white' 
                      : 'border-white/5 bg-black/20 text-gray-400 hover:text-white'
                  }`}
                >
                  {interval}
                </button>
              ))}
            </div>
          </div>

          {/* Calculations details */}
          <div className="p-4 bg-black/40 border border-white/5 rounded-xl text-xs space-y-3 font-medium">
            <div className="flex justify-between items-center text-gray-400">
              <span>New Plan Price:</span>
              <span className="text-white font-mono">₹{getProrationDetails().newPrice.toLocaleString()}.00</span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>Prorated Credit (15 days remaining):</span>
              <span className="text-emerald-400 font-mono">-₹{getProrationDetails().credit.toLocaleString()}.00</span>
            </div>
            <hr className="border-white/5" />
            <div className="flex justify-between items-center font-bold text-sm">
              <span className="text-white">Amount Due Today:</span>
              <span className="text-purple-400 font-mono">₹{getProrationDetails().dueToday.toLocaleString()}.00</span>
            </div>
            {getProrationDetails().balanceRemaining > 0 && (
              <div className="text-[10px] text-cyan-400 font-bold text-right">
                * ₹{getProrationDetails().balanceRemaining.toLocaleString()}.00 credit will remain in balance.
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              variant="glow" 
              className="flex-1 py-2.5"
              onClick={handleProrateMigration}
            >
              Confirm Migration
            </Button>
            <button
              onClick={() => setProrateModalOpen(false)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              Abort
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
