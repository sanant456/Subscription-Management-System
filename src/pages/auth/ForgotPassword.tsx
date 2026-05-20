import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { forgotPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email) {
      setErrorMsg('Please specify your account email address.');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setErrorMsg('Please enter a valid email format.');
      return;
    }

    setLoading(true);
    await forgotPassword(email);
    setLoading(false);
    setSubmitted(true);
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
            <span className="font-heading font-bold text-2xl text-white">AchieveSub</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Secure Auth Layer
          </span>
        </div>

        {/* Card Panel */}
        <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl bg-[#08081a]/95">
          {!submitted ? (
            <>
              <h2 className="text-2xl font-bold font-heading text-white mb-1.5 text-center">Recover Password</h2>
              <p className="text-gray-400 text-xs text-center mb-6">
                Enter your email address and we'll dispatch reset instructions.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
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

                {errorMsg && (
                  <div className="p-3 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs">
                    {errorMsg}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="glow"
                  className="w-full py-3 animate-pulse-slow"
                  isLoading={loading}
                  rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
                >
                  Send Recovery Link
                </Button>
              </form>
            </>
          ) : (
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="text-center space-y-4"
            >
              <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold font-heading text-white">Check Your Mailbox</h3>
              <p className="text-gray-400 text-xs leading-relaxed">
                If an account matches <span className="font-semibold text-purple-400">{email}</span>, a secure recovery connection has been dispatched.
              </p>
              <div className="pt-2">
                <Link to="/auth/reset" className="text-xs font-semibold text-purple-400 hover:text-purple-300">
                  Simulate Password Reset Page →
                </Link>
              </div>
            </motion.div>
          )}

          <div className="pt-6 mt-6 border-t border-white/5 flex justify-center">
            <Link
              to="/auth/login"
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
