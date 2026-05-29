import React from 'react';
import { Card } from '../../components/ui/Card';

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="text-xs uppercase tracking-widest text-purple-400 font-bold mb-2 inline-block">Testimonials</span>
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
          Loved by Developers & Billing Admins
        </h2>
        <p className="text-gray-400 light-theme:text-gray-600">
          See how recurring SaaS startups successfully scaled billing automation using SubVault.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <Card className="hover:border-purple-500/20">
          <p className="text-sm text-gray-400 light-theme:text-gray-600 italic leading-relaxed">
            "We migrated over 5,000 subscriptions from custom cron-job tables to SubVault in a single afternoon. The developer SDK is rock solid and smart retries recovered $14,000 in failed charges in month one."
          </p>
          <div className="flex items-center gap-3.5 mt-6">
            <div className="h-10 w-10 rounded-full bg-purple-500/20 border border-purple-500/30 flex items-center justify-center font-bold text-sm text-white">
              SL
            </div>
            <div>
              <h5 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900">Sarah Jenkins</h5>
              <span className="text-xs text-gray-500">CTO, SaaSFlow</span>
            </div>
          </div>
        </Card>

        <Card className="hover:border-purple-500/20">
          <p className="text-sm text-gray-400 light-theme:text-gray-600 italic leading-relaxed">
            "Building proration logic manually is a nightmare. This API handles trial states, upgrades, downgrades, and credits automatically. The animated logs viewer makes debugging billing queues extremely satisfying."
          </p>
          <div className="flex items-center gap-3.5 mt-6">
            <div className="h-10 w-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center font-bold text-sm text-white">
              MT
            </div>
            <div>
              <h5 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900">Marcus Chen</h5>
              <span className="text-xs text-gray-500">Founder, MailSync</span>
            </div>
          </div>
        </Card>

        <Card className="hover:border-purple-500/20">
          <p className="text-sm text-gray-400 light-theme:text-gray-600 italic leading-relaxed">
            "The billing analytics and Cohort metrics are built directly into the core engine. We no longer have discrepancy lags between our operational database and third-party dashboards. It's a game changer."
          </p>
          <div className="flex items-center gap-3.5 mt-6">
            <div className="h-10 w-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center font-bold text-sm text-white">
              EK
            </div>
            <div>
              <h5 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900">Elena Rostova</h5>
              <span className="text-xs text-gray-500">Lead Architect, MetricBase</span>
            </div>
          </div>
        </Card>
      </div>
    </section>
  );
};
