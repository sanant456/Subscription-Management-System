import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSubscription } from '../context/SubscriptionContext';
import type { PlanType, BillingInterval } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';

// Subcomponents
import { Navbar } from './landing/Navbar';
import { HeroSection } from './landing/HeroSection';
import { FeaturesSection } from './landing/FeaturesSection';
import { ArchitectureSection } from './landing/ArchitectureSection';
import { PricingSection } from './landing/PricingSection';
import { AnalyticsSection } from './landing/AnalyticsSection';
import { LifecycleSection } from './landing/LifecycleSection';
import { SecuritySection } from './landing/SecuritySection';
import { ApiShowcaseSection } from './landing/ApiShowcaseSection';
import { TestimonialsSection } from './landing/TestimonialsSection';
import { Footer } from './landing/Footer';

// Recharts Dummy Data for Showcase
const revenueData = [
  { name: 'Dec', MRR: 28000 },
  { name: 'Jan', MRR: 31000 },
  { name: 'Feb', MRR: 35000 },
  { name: 'Mar', MRR: 39000 },
  { name: 'Apr', MRR: 41500 },
  { name: 'May', MRR: 44200 },
];

const churnData = [
  { name: 'Dec', Rate: 2.4 },
  { name: 'Jan', Rate: 2.1 },
  { name: 'Feb', Rate: 1.9 },
  { name: 'Mar', Rate: 1.9 },
  { name: 'Apr', Rate: 1.8 },
  { name: 'May', Rate: 1.8 },
];

const subscriberData = [
  { name: 'Dec', Users: 1200 },
  { name: 'Jan', Users: 1450 },
  { name: 'Feb', Users: 1700 },
  { name: 'Mar', Users: 1950 },
  { name: 'Apr', Users: 2200 },
  { name: 'May', Users: 2480 },
];

const paymentSuccessData = [
  { name: 'First Attempt', value: 92.4, fill: '#06b6d4' },
  { name: 'Smart Retry', value: 5.1, fill: '#8b5cf6' },
  { name: 'Second Retry', value: 1.8, fill: '#3b82f6' },
  { name: 'Failed (Hard Churn)', value: 0.7, fill: '#f43f5e' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme, toggleTheme, triggerMockApi } = useSubscription();
  const { token } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [checkoutLoadingPlan, setCheckoutLoadingPlan] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleSelectPlan = async (plan: PlanType) => {
    setCheckoutError(null);
    if (token) {
      // Navigate to dedicated checkout page
      navigate(`/checkout?plan=${plan}&interval=${billingInterval}`);
    } else {
      // Save pending checkout config
      localStorage.setItem('pending_checkout_selection', JSON.stringify({ plan, interval: billingInterval }));
      navigate('/auth/signup');
    }
  };

  const [activeChart, setActiveChart] = useState<'revenue' | 'churn' | 'growth' | 'success'>('revenue');
  
  // API Showcase playground state
  const [apiMethod, setApiMethod] = useState<'POST' | 'GET' | 'PATCH'>('POST');
  const [apiEndpoint, setApiEndpoint] = useState('/subscriptions');
  const [apiPayload, setApiPayload] = useState(
    JSON.stringify({ email: 'client@company.com', plan: 'Pro', interval: 'monthly' }, null, 2)
  );
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const handleApiRun = () => {
    setApiLoading(true);
    setApiResponse(null);
    setTimeout(() => {
      let parsedBody = undefined;
      try {
        if (apiMethod !== 'GET') {
          parsedBody = JSON.parse(apiPayload);
        }
        const res = triggerMockApi(apiMethod, apiEndpoint, parsedBody);
        setApiResponse(res);
      } catch (err: any) {
        setApiResponse({ success: false, error: 'Invalid JSON payload format' });
      } finally {
        setApiLoading(false);
      }
    }, 800);
  };

  const setApiPreset = (method: 'POST' | 'GET' | 'PATCH', endpoint: string, payload: any) => {
    setApiMethod(method);
    setApiEndpoint(endpoint);
    setApiPayload(JSON.stringify(payload, null, 2));
    setApiResponse(null);
  };

  return (
    <div className="relative overflow-x-hidden min-h-screen text-gray-300 light-theme:text-gray-600 bg-[#050515] light-theme:bg-gray-50 bg-gradient-premium">
      
      {/* Floating Ambient Glowing Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-600/10 light-theme:bg-purple-600/5 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-[40%] right-[-10%] w-[45%] h-[45%] rounded-full bg-cyan-600/10 light-theme:bg-cyan-600/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 light-theme:bg-indigo-600/5 blur-[120px] pointer-events-none animate-pulse-slow" />

      {/* 1. Header & Navigation */}
      <Navbar 
        theme={theme}
        toggleTheme={toggleTheme}
        token={token}
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
      />

      {/* 2. Hero Section */}
      <HeroSection revenueData={revenueData} />

      {/* 3. Trusted Companies Section */}
      <section className="border-y border-white/5 bg-black/10 py-10 overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 mb-6 text-center">
          <span className="text-[10px] uppercase tracking-widest text-purple-400/80 font-bold">
            TRUSTED BY THE WORLD'S LEADING STARTUPS
          </span>
        </div>
        <div className="flex w-[200%] gap-12 items-center animate-scroll">
          <div className="flex justify-around items-center w-full gap-8 select-none">
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">STRIPE</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">LINEAR</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">VERCEL</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">NOTION</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">FRAMER</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">FIGMA</span>
          </div>
          <div className="flex justify-around items-center w-full gap-8 select-none">
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">STRIPE</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">LINEAR</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">VERCEL</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">NOTION</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">FRAMER</span>
            <span className="font-heading font-black text-lg text-gray-500 tracking-wider">FIGMA</span>
          </div>
        </div>
      </section>

      {/* 4. Features Section */}
      <FeaturesSection />

      {/* 5. Animated Architecture Diagram */}
      <ArchitectureSection />

      {/* 6. Pricing Section */}
      <PricingSection 
        billingInterval={billingInterval}
        setBillingInterval={setBillingInterval}
        handleSelectPlan={handleSelectPlan}
        checkoutLoadingPlan={checkoutLoadingPlan}
      />

      {checkoutError && (
        <div className="max-w-md mx-auto mb-8 p-4 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-sm flex items-center gap-2.5">
          <span>{checkoutError}</span>
        </div>
      )}

      {/* 7. Live Analytics Dashboard Preview */}
      <AnalyticsSection 
        activeChart={activeChart}
        setActiveChart={setActiveChart}
        revenueData={revenueData}
        churnData={churnData}
        subscriberData={subscriberData}
        paymentSuccessData={paymentSuccessData}
      />

      {/* 8. Subscription Lifecycle flow */}
      <LifecycleSection />

      {/* 9. Security Section */}
      <SecuritySection />

      {/* 10. Interactive API Showcase */}
      <ApiShowcaseSection 
        apiMethod={apiMethod}
        apiEndpoint={apiEndpoint}
        apiPayload={apiPayload}
        setApiPayload={setApiPayload}
        apiResponse={apiResponse}
        apiLoading={apiLoading}
        setApiPreset={setApiPreset}
        handleApiRun={handleApiRun}
      />

      {/* 11. Testimonials */}
      <TestimonialsSection />

      {/* 12. Footer */}
      <Footer />

    </div>
  );
};
