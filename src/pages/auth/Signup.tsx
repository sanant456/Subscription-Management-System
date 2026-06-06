import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Mail, Lock, ArrowRight, Github, Chrome, Linkedin, AlertCircle, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export const Signup: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { signup, loginWithOAuth, error, clearError } = useAuth();
  const navigate = useNavigate();

  // Derived password strength
  let strength = 0;
  let strengthLabel = 'Empty';
  let strengthColor = 'bg-gray-700';

  if (password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    strength = score;

    const labels = ['Weak', 'Weak', 'Fair', 'Strong', 'Excellent'];
    const colors = [
      'bg-rose-500',
      'bg-rose-500',
      'bg-amber-500',
      'bg-indigo-500',
      'bg-emerald-500'
    ];

    strengthLabel = labels[score];
    strengthColor = colors[score];
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!name || !email || !password) {
      setValidationError('Please fill in all details.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Please enter a valid email format.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    const success = await signup(name, email, password);
    setLoading(false);

    if (success) {
      const pending = localStorage.getItem('pending_checkout_selection');
      if (pending) {
        try {
          const { plan, interval } = JSON.parse(pending);
          if (plan && interval) {
            navigate(`/checkout?plan=${plan}&interval=${interval}`);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse pending checkout", e);
        }
      }
      navigate('/dashboard');
    }
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'linkedin') => {
    setLoading(true);
    const success = await loginWithOAuth(provider);
    setLoading(false);
    if (success) {
      const pending = localStorage.getItem('pending_checkout_selection');
      if (pending) {
        try {
          const { plan, interval } = JSON.parse(pending);
          if (plan && interval) {
            navigate(`/checkout?plan=${plan}&interval=${interval}`);
            return;
          }
        } catch (e) {
          console.warn("Failed to parse pending checkout", e);
        }
      }
      navigate('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen bg-[#050515] flex items-center justify-center p-6 overflow-hidden bg-gradient-premium">
      {/* Floating Ambient Glowing Blobs */}
      <div className="absolute top-[10%] left-[10%] w-[40%] h-[40%] rounded-full bg-purple-600/10 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-[10%] right-[10%] w-[40%] h-[40%] rounded-full bg-cyan-600/10 blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center mb-6">
          <Link to="/" className="flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="font-heading font-black text-xl text-white">A</span>
            </div>
            <span className="font-heading font-bold text-2xl text-white">SubVault</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Secure Auth Layer
          </span>
        </div>

        {/* Signup Card */}
        <div className="glass-panel rounded-2xl p-7 border border-white/10 shadow-2xl bg-[#08081a]/95">
          <h2 className="text-2xl font-bold font-heading text-white mb-1 text-center">Create Your Account</h2>
          <p className="text-gray-400 text-xs text-center mb-5">Start your 14-day free trial on us.</p>

          <form onSubmit={handleSignup} className="space-y-4" noValidate>
            {/* Input Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Full Name</label>
              <div className="relative">
                <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Alex Carter"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium placeholder-gray-600"
                />
              </div>
            </div>

            {/* Input Email */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium placeholder-gray-600"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium placeholder-gray-600"
                />
              </div>

              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center justify-between text-[10px] font-bold">
                    <span className="text-gray-400">Strength:</span>
                    <span className={
                      strength <= 1 ? 'text-rose-400' :
                      strength === 2 ? 'text-amber-400' :
                      strength === 3 ? 'text-indigo-400' : 'text-emerald-400'
                    }>{strengthLabel}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5 h-1">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-full rounded-full transition-all duration-300 ${
                          step <= strength ? strengthColor : 'bg-gray-800'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-[10px] text-gray-500 leading-normal flex flex-wrap gap-x-2 gap-y-0.5">
                    <span className={`flex items-center gap-1 ${password.length >= 8 ? 'text-emerald-400' : ''}`}>
                      {password.length >= 8 && <Check className="h-3 w-3" />} 8+ chars
                    </span>
                    <span className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-emerald-400' : ''}`}>
                      {/[A-Z]/.test(password) && <Check className="h-3 w-3" />} Upper case
                    </span>
                    <span className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-emerald-400' : ''}`}>
                      {/[0-9]/.test(password) && <Check className="h-3 w-3" />} Digit
                    </span>
                    <span className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(password) ? 'text-emerald-400' : ''}`}>
                      {/[^A-Za-z0-9]/.test(password) && <Check className="h-3 w-3" />} Special
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Error Indicators */}
            {(validationError || error) && (
              <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs flex items-start gap-2.5">
                <AlertCircle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{validationError || error}</span>
              </div>
            )}

            <Button
              type="submit"
              variant="glow"
              className="w-full py-3"
              isLoading={loading}
              rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
            >
              Start My Free Trial
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <span className="h-px bg-white/5 flex-grow" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">or register with</span>
            <span className="h-px bg-white/5 flex-grow" />
          </div>

          {/* Social Sign Up */}
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-black/20 hover:bg-black/40 text-gray-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              <Chrome className="h-4 w-4 flex-shrink-0" /> Google
            </button>
            <button
              onClick={() => handleOAuth('github')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-black/20 hover:bg-black/40 text-gray-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              <Github className="h-4 w-4 flex-shrink-0" /> GitHub
            </button>
            <button
              onClick={() => handleOAuth('linkedin')}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-white/10 hover:border-white/20 bg-black/20 hover:bg-black/40 text-gray-300 hover:text-white transition-all text-xs font-semibold cursor-pointer"
            >
              <Linkedin className="h-4 w-4 flex-shrink-0 text-[#0a66c2]" /> LinkedIn
            </button>
          </div>

          <p className="text-gray-400 text-center text-xs mt-6 font-medium">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-purple-400 hover:text-purple-300 font-bold">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
