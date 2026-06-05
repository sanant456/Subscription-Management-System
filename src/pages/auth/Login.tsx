import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Github, Chrome, Linkedin, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { login, loginWithOAuth, error, clearError } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);
    clearError();

    if (!email || !password) {
      setValidationError('Please fill in all credentials.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setValidationError('Please provide a valid email format.');
      return;
    }

    setLoading(true);
    const success = await login(email, password);
    setLoading(false);

    if (success) {
      navigate('/dashboard');
    }
  };

  const handleOAuth = async (provider: 'google' | 'github' | 'linkedin') => {
    setLoading(true);
    const success = await loginWithOAuth(provider);
    setLoading(false);
    if (success) {
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
        <div className="flex flex-col items-center mb-8">
          <Link to="/" className="flex items-center gap-2 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="font-heading font-black text-xl text-white">A</span>
            </div>
            <span className="font-heading font-bold text-2xl text-white">SubVault</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Secure Auth Layer
          </span>
        </div>

        {/* Login Card */}
        <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl bg-[#08081a]/95">
          <h2 className="text-2xl font-bold font-heading text-white mb-1.5 text-center">Welcome Back</h2>
          <p className="text-gray-400 text-xs text-center mb-6">Enter your details to manage subscription assets.</p>

          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            {/* Input Email */}
            <div className="flex flex-col gap-1.5">
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
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-400">Password</label>
                <Link to="/auth/forgot" className="text-xs font-semibold text-purple-400 hover:text-purple-300">
                  Forgot?
                </Link>
              </div>
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
              Sign In to Dashboard
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <span className="h-px bg-white/5 flex-grow" />
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">or sign in with</span>
            <span className="h-px bg-white/5 flex-grow" />
          </div>

          {/* Social Sign In */}
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

          <p className="text-gray-400 text-center text-xs mt-8 font-medium">
            Don't have an account?{' '}
            <Link to="/auth/signup" className="text-purple-400 hover:text-purple-300 font-bold">
              Create an Account
            </Link>
          </p>

          {/* Demo Login Alert */}
          <div className="mt-6 p-3.5 rounded-xl border border-purple-500/10 bg-purple-950/5 text-[11px] text-purple-300 font-semibold text-center leading-normal">
            💡 For Admin Console access, use: <br />
            <span className="font-mono text-cyan-300">admin@saascorp.com</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
