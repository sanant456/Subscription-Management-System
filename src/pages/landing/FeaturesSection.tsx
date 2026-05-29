import React from 'react';
import { Card, CardContent } from '../../components/ui/Card';
import { 
  Users, FileText, Activity, Globe, RefreshCw, Lock, Sparkles, Zap 
} from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <Users className="h-6 w-6 text-purple-500" />,
      title: 'Subscription Management',
      desc: 'Seamlessly configure complex plan tiering, metered billing, and customized subscription options.'
    },
    {
      icon: <FileText className="h-6 w-6 text-cyan-500" />,
      title: 'Automated Billing',
      desc: 'Hands-off automatic invoicing, payment triggers, and transaction workflows synced to webhooks.'
    },
    {
      icon: <Activity className="h-6 w-6 text-indigo-500" />,
      title: 'Analytics Dashboard',
      desc: 'Real-time cohort analyses, churn tracking, MRR telemetry, and LTV forecasts at a glance.'
    },
    {
      icon: <Globe className="h-6 w-6 text-emerald-500" />,
      title: 'Invoice Generation',
      desc: 'Beautiful HTML/PDF invoice generation automatically matched to user-defined compliance and branding.'
    },
    {
      icon: <RefreshCw className="h-6 w-6 text-amber-500" />,
      title: 'Payment Retry System',
      desc: 'Smart dunning schedules powered by ML retries, reducing involuntary churn by over 35%.'
    },
    {
      icon: <Lock className="h-6 w-6 text-rose-500" />,
      title: 'Secure Authentication',
      desc: 'Built-in multi-tenant RBAC profiles, JWT token generation, OAuth 2.0 integration, and rate limiting.'
    },
    {
      icon: <Sparkles className="h-6 w-6 text-violet-500" />,
      title: 'Plan Upgrades & Downgrades',
      desc: 'Automated proration and credit allocation engine. Transition users between plans seamlessly.'
    },
    {
      icon: <Zap className="h-6 w-6 text-blue-500" />,
      title: 'Trial Management',
      desc: 'Optimize conversion with automated trial reminders, seamless credit card entry prompts, and grace periods.'
    }
  ];

  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4">
          Everything Needed to Scale Billing
        </h2>
        <p className="text-gray-400 light-theme:text-gray-600">
          Automate tedious billing setups and security guardrails with a subscription system ready for scale.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {features.map((feat, i) => (
          <Card key={i} className="hover:border-purple-500/30 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-5">
              {feat.icon}
            </div>
            <CardContent className="p-0">
              <h4 className="font-heading font-semibold text-lg text-white light-theme:text-gray-900 mb-2">{feat.title}</h4>
              <p className="text-sm text-gray-400 light-theme:text-gray-600 leading-relaxed">{feat.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};
