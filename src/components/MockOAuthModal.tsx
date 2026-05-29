import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Github, X, Mail, Shield, User, Info, Check, LogIn } from 'lucide-react';

interface MockOAuthModalProps {
  isOpen: boolean;
  provider: 'google' | 'github' | 'linkedin' | null;
  onResolve: (value: { email: string; name: string } | null) => void;
}

export const MockOAuthModal: React.FC<MockOAuthModalProps> = ({
  isOpen,
  provider,
  onResolve,
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState(''); // Only used as a design placeholder for LinkedIn
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear fields when modal state or provider changes
  useEffect(() => {
    if (isOpen && provider) {
      setError(null);
      setShowCustomForm(false);
      setSubmitting(false);
      
      // Default placeholder based on provider
      if (provider === 'google') {
        setEmail('user@gmail.com');
        setName('Google User');
      } else if (provider === 'github') {
        setEmail('developer@github.com');
        setName('GitHub Dev');
      } else if (provider === 'linkedin') {
        setEmail('user@linkedin.com');
        setName('LinkedIn Pro');
        setPassword('••••••••');
      }
    }
  }, [isOpen, provider]);

  if (!isOpen || !provider) return null;

  const handleCancel = () => {
    onResolve(null);
  };

  const handleQuickSelect = (selectedEmail: string, selectedName: string) => {
    setSubmitting(true);
    setTimeout(() => {
      onResolve({ email: selectedEmail, name: selectedName });
      setSubmitting(false);
    }, 700);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email format.');
      return;
    }
    if (!name.trim()) {
      setError('Display name is required.');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      onResolve({ email: email.trim(), name: name.trim() });
      setSubmitting(false);
    }, 800);
  };

  // Google Account Choices
  const googleAccounts = [
    { email: 'sarah.connor@gmail.com', name: 'Sarah Connor', avatar: 'SC' },
    { email: 'alex.carter@gmail.com', name: 'Alex Carter', avatar: 'AC' },
    { email: 'dev.tester@gmail.com', name: 'Dev Tester', avatar: 'DT' },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Dark blur backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.95, y: 20, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.95, y: 20, opacity: 0 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className={`w-full max-w-md overflow-hidden rounded-2xl border shadow-2xl relative z-10 ${
            provider === 'google'
              ? 'bg-white text-gray-800 border-gray-200'
              : provider === 'github'
              ? 'bg-[#0d1117] text-gray-200 border-[#30363d]'
              : 'bg-[#f3f4f6] text-gray-800 border-gray-300 light-theme:bg-white'
          }`}
        >
          {/* Close indicator button */}
          <button
            onClick={handleCancel}
            className={`absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer ${
              provider === 'github' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <X className="h-4 w-4" />
          </button>

          {/* 1. GOOGLE BRANDED CONSENT OVERLAY */}
          {provider === 'google' && (
            <div className="p-6 md:p-8">
              <div className="flex flex-col items-center mb-6">
                {/* Simulated Google Logo (colorful G) */}
                <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-50 shadow-sm border border-gray-100 mb-3">
                  <svg className="h-6 w-6" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.2-5.137 4.2a5.714 5.714 0 0 1-5.714-5.715 5.714 5.714 0 0 1 5.714-5.714c1.47 0 2.8.5 3.86 1.48L21 5.09A9.97 9.97 0 0 0 12.24 2C6.584 2 2 6.584 2 12.24S6.584 22.48 12.24 22.48c5.804 0 9.873-4.08 9.873-10.05 0-.68-.06-1.345-.193-2.145H12.24Z"
                    />
                  </svg>
                </div>
                <h3 className="font-heading font-semibold text-xl text-gray-900">Choose an account</h3>
                <p className="text-sm text-gray-500 mt-1">to continue to <span className="font-medium text-purple-600 font-heading">SubVault</span></p>
              </div>

              {submitting && (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="h-10 w-10 border-4 border-purple-500/20 border-t-purple-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-gray-600">Simulating secure Google redirection...</p>
                </div>
              )}

              {!submitting && !showCustomForm && (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {googleAccounts.map((acc, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickSelect(acc.email, acc.name)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-gray-200 bg-gray-50/50 hover:bg-gray-100/70 transition-all text-left group cursor-pointer"
                    >
                      <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {acc.avatar}
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{acc.name}</p>
                        <p className="text-xs text-gray-500 truncate">{acc.email}</p>
                      </div>
                      <LogIn className="h-4 w-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))}

                  <button
                    onClick={() => setShowCustomForm(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-dashed border-gray-200 hover:border-purple-300 hover:bg-purple-50/20 transition-all text-left text-sm font-medium text-purple-600 cursor-pointer"
                  >
                    <div className="h-9 w-9 rounded-full border border-dashed border-purple-200 flex items-center justify-center text-purple-500">
                      <User className="h-4 w-4" />
                    </div>
                    <span>Use another Google account</span>
                  </button>
                </div>
              )}

              {!submitting && showCustomForm && (
                <form onSubmit={handleSubmitCustom} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        placeholder="john.doe@gmail.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Display Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all placeholder-gray-400"
                        required
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl flex items-center gap-2 border border-red-100">
                      <Info className="h-4 w-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCustomForm(false)}
                      className="flex-1 py-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-sm font-semibold text-gray-600 transition-all cursor-pointer"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-500/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                </form>
              )}

              <div className="border-t border-gray-100 mt-6 pt-4 text-center">
                <span className="text-[11px] text-gray-400 leading-normal block">
                  To safe-test login, use standard mock emails. The application secures credentials off-grid.
                </span>
              </div>
            </div>
          )}

          {/* 2. GITHUB BRANDED CONSENT OVERLAY */}
          {provider === 'github' && (
            <div className="p-6 md:p-8">
              <div className="flex items-center justify-between border-b border-[#30363d] pb-4 mb-6">
                <div className="flex items-center gap-2">
                  <Github className="h-6 w-6 text-white" />
                  <span className="font-semibold text-white text-sm">GitHub Authorization</span>
                </div>
                <span className="text-xs text-green-400 font-bold px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" /> Mock Integration
                </span>
              </div>

              {submitting ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="h-10 w-10 border-4 border-green-500/20 border-t-green-500 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-gray-400">Transmitting OAuth state to backend...</p>
                </div>
              ) : (
                <div>
                  {/* Connection Visualizer */}
                  <div className="flex items-center justify-center gap-8 my-6">
                    <div className="h-14 w-14 rounded-2xl bg-[#1f242c] border border-[#30363d] flex items-center justify-center shadow-lg">
                      <Github className="h-8 w-8 text-white" />
                    </div>
                    
                    {/* Animated Line Connector */}
                    <div className="flex-grow max-w-[100px] h-0.5 bg-gradient-to-r from-gray-600 via-green-500 to-purple-600 relative">
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 rounded-full bg-green-500 border-4 border-[#0d1117] flex items-center justify-center">
                        <Check className="h-2.5 w-2.5 text-white" />
                      </div>
                    </div>

                    <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
                      <span className="font-heading font-black text-xl text-white">A</span>
                    </div>
                  </div>

                  <h4 className="text-center font-semibold text-lg text-white mb-1">
                    Authorize saascorp-org
                  </h4>
                  <p className="text-center text-xs text-gray-400 mb-6 leading-relaxed">
                    wants to access your basic GitHub account information to sign in to <strong className="text-purple-400">SubVault</strong>.
                  </p>

                  <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 mb-6 space-y-3.5">
                    <div className="flex gap-3 items-start">
                      <User className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">Public User Data</h5>
                        <p className="text-xs text-gray-400 leading-normal">
                          Read profile info, including your name, username, and public avatar.
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-3 items-start">
                      <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                      <div>
                        <h5 className="text-xs font-bold text-white uppercase tracking-wider">Email Addresses</h5>
                        <p className="text-xs text-gray-400 leading-normal">
                          Read-only access to your primary email address.
                        </p>
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSubmitCustom} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">GitHub Username</label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#30363d] bg-[#161b22] text-xs text-white focus:outline-none focus:border-green-500 transition-all"
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account Email</label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-[#30363d] bg-[#161b22] text-xs text-white focus:outline-none focus:border-green-500 transition-all"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-950/20 text-red-400 text-xs rounded-xl border border-red-900/30">
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="flex-1 py-2.5 rounded-xl border border-[#30363d] bg-[#21262d] hover:bg-[#30363d] text-xs font-bold text-[#c9d1d9] transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-[#238636] hover:bg-[#2ea043] text-xs font-bold text-white rounded-xl shadow-md active:scale-[0.98] transition-all cursor-pointer"
                      >
                        Authorize saascorp-org
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* 3. LINKEDIN BRANDED CONSENT OVERLAY */}
          {provider === 'linkedin' && (
            <div className="p-6 md:p-8 bg-[#f3f4f6] text-gray-800">
              <div className="flex items-center justify-between border-b border-gray-200 pb-4 mb-6">
                <div className="flex items-center gap-1.5">
                  <span className="font-heading font-black text-xl text-[#0a66c2]">Linked</span>
                  <div className="bg-[#0a66c2] text-white font-heading font-black px-1.5 py-0.5 rounded text-sm">in</div>
                </div>
                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider bg-gray-200/80 px-2.5 py-1 rounded-lg">
                  Mock Console
                </span>
              </div>

              {submitting ? (
                <div className="flex flex-col items-center justify-center py-10">
                  <div className="h-10 w-10 border-4 border-[#0a66c2]/20 border-t-[#0a66c2] rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-gray-600">Simulating secure LinkedIn verification...</p>
                </div>
              ) : (
                <div>
                  <h4 className="font-heading font-bold text-lg text-gray-900 mb-1">
                    Sign in to LinkedIn
                  </h4>
                  <p className="text-xs text-gray-500 mb-5 leading-normal">
                    Authorize <span className="font-semibold text-purple-600 font-heading">SubVault</span> to access your professional credentials.
                  </p>

                  <form onSubmit={handleSubmitCustom} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Email or Phone</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="email"
                          placeholder="user@linkedin.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] transition-all placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Password</label>
                      <div className="relative">
                        <Shield className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] transition-all placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-600">Full Name (Display Profile)</label>
                      <div className="relative">
                        <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Alex Carter"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-300 bg-white text-sm text-gray-800 focus:outline-none focus:border-[#0a66c2] focus:ring-1 focus:ring-[#0a66c2] transition-all placeholder-gray-400"
                          required
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-50 text-red-600 text-xs rounded-xl border border-red-200">
                        <span>{error}</span>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 pt-2">
                      <button
                        type="submit"
                        className="w-full py-2.5 bg-[#0a66c2] hover:bg-[#004b93] text-white font-bold rounded-full text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Sign in & Authorize
                      </button>
                      <button
                        type="button"
                        onClick={handleCancel}
                        className="w-full py-2 bg-transparent hover:bg-gray-200/50 text-gray-600 hover:text-gray-800 rounded-full text-xs font-bold transition-all cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
