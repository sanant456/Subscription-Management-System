import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Menu } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface NavbarProps {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  token: string | null;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  toggleTheme,
  token,
  mobileMenuOpen,
  setMobileMenuOpen,
}) => {
  const navigate = useNavigate();

  return (
    <>
      <header className="sticky top-0 z-50 glass-panel border-b border-white/5 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <span className="font-heading font-black text-xl text-white">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-lg leading-none text-white light-theme:text-gray-900">SubVault</span>
              <span className="text-[10px] tracking-wider text-purple-400 font-bold">BY SUBVAULT</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-purple-400 transition-colors">Features</a>
            <a href="#architecture" className="hover:text-purple-400 transition-colors">Architecture</a>
            <a href="#pricing" className="hover:text-purple-400 transition-colors">Pricing</a>
            <a href="#analytics" className="hover:text-purple-400 transition-colors">Analytics</a>
            <a href="#security" className="hover:text-purple-400 transition-colors">Security</a>
            <a href="#api" className="hover:text-purple-400 transition-colors">API Console</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 transition-all text-gray-300 light-theme:text-gray-700 cursor-pointer"
              title="Toggle theme"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            {token ? (
              <Button variant="glow" onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate('/auth/login')}>Sign In</Button>
                <Button variant="glow" onClick={() => navigate('/auth/signup')}>Get Started</Button>
              </>
            )}
          </div>

          {/* Mobile Menu Btn */}
          <div className="flex items-center gap-2 md:hidden">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-white/10 text-gray-300 mr-2"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-b border-white/5 bg-[#08081a] relative z-40"
          >
            <div className="px-6 py-8 flex flex-col gap-5 text-base">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Features</a>
              <a href="#architecture" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Architecture</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Pricing</a>
              <a href="#analytics" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Analytics</a>
              <a href="#security" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">Security</a>
              <a href="#api" onClick={() => setMobileMenuOpen(false)} className="hover:text-purple-400">API Console</a>
              <hr className="border-white/5 my-2" />
              {token ? (
                <Button variant="glow" className="w-full justify-center" onClick={() => { navigate('/dashboard'); setMobileMenuOpen(false); }}>Go to Dashboard</Button>
              ) : (
                <>
                  <Button variant="ghost" className="w-full justify-center" onClick={() => { navigate('/auth/login'); setMobileMenuOpen(false); }}>Sign In</Button>
                  <Button variant="glow" className="w-full justify-center" onClick={() => { navigate('/auth/signup'); setMobileMenuOpen(false); }}>Get Started</Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
