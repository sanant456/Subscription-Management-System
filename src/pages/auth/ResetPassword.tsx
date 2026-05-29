import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, ArrowRight, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';

export const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!password || !confirmPassword) {
      setValidationError('Please fill in all details.');
      return;
    }

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setValidationError('Passwords do not match.');
      return;
    }

    setLoading(true);
    await resetPassword(password);
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
            <span className="font-heading font-bold text-2xl text-white">SubVault</span>
          </Link>
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold flex items-center gap-1.5">
            <Sparkles className="h-3 w-3" /> Secure Auth Layer
          </span>
        </div>

        {/* Card Panel */}
        <div className="glass-panel rounded-2xl p-8 border border-white/10 shadow-2xl bg-[#08081a]/95">
          {!submitted ? (
            <>
              <h2 className="text-2xl font-bold font-heading text-white mb-1.5 text-center">Reset Password</h2>
              <p className="text-gray-400 text-xs text-center mb-6">
                Establish your new account access passphrase.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Password input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">New Password</label>
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

                {/* Confirm input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-gray-500" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-white/10 bg-black/40 text-sm text-white focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all font-medium placeholder-gray-600"
                    />
                  </div>
                </div>

                {validationError && (
                  <div className="p-3.5 rounded-xl border border-rose-500/20 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4.5 w-4.5 text-rose-400 flex-shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="glow"
                  className="w-full py-3"
                  isLoading={loading}
                  rightIcon={<ArrowRight className="h-4.5 w-4.5" />}
                >
                  Update Credentials
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
              <h3 className="text-lg font-bold font-heading text-white">Password Updated</h3>
              <p className="text-gray-400 text-xs">
                Your passphrase has been updated successfully.
              </p>
              <div className="pt-2">
                <Button
                  variant="glow"
                  className="w-full py-3"
                  onClick={() => navigate('/auth/login')}
                >
                  Log In Now
                </Button>
              </div>
            </motion.div>
          )}

          <div className="pt-6 mt-6 border-t border-white/5 flex justify-center">
            <Link
              to="/auth/login"
              className="text-xs font-semibold text-gray-400 hover:text-white transition-colors"
            >
              ← Back to Sign In
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
