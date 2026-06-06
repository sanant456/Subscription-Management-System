import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, FileText, Terminal, Activity, 
  X, ArrowLeft, ShieldAlert, CreditCard
} from 'lucide-react';

interface DashboardSidebarProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentTab: string;
  setCurrentTab: (tab: any) => void;
  user: any;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  logout: () => void;
  setActivePage: (page: 'landing' | 'dashboard') => void;
}

export const DashboardSidebar: React.FC<DashboardSidebarProps> = ({
  sidebarOpen,
  setSidebarOpen,
  currentTab,
  setCurrentTab,
  user,
  theme,
  toggleTheme,
  logout,
  setActivePage,
}) => {
  const navigate = useNavigate();

  return (
    <aside className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-white/5 backdrop-blur-lg transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-transform duration-300 flex flex-col justify-between`}>
      <div>
        {/* Brand header */}
        <div className="h-20 px-6 flex items-center justify-between border-b border-white/5 bg-black/10">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActivePage('landing')}>
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center">
              <span className="font-heading font-black text-base text-white">S</span>
            </div>
            <div className="flex flex-col">
              <span className="font-heading font-bold text-sm text-white light-theme:text-gray-900 leading-none">SubVault</span>
              <span className="text-[9px] text-purple-400 font-bold">DASHBOARD</span>
            </div>
          </div>
          <button className="md:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="p-4 flex flex-col gap-1.5">
          <button
            onClick={() => { setCurrentTab('overview'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'overview' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <LayoutDashboard className="h-4.5 w-4.5" /> Overview
          </button>

          <button
            onClick={() => { setCurrentTab('subscriptions'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'subscriptions' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Users className="h-4.5 w-4.5" /> Subscriptions
          </button>

          <button
            onClick={() => { setCurrentTab('billing'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'billing' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <FileText className="h-4.5 w-4.5" /> Billing & Invoices
          </button>

          <button
            onClick={() => { setCurrentTab('payments'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'payments' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <CreditCard className="h-4.5 w-4.5" /> Payments & Receipts
          </button>

          <button
            onClick={() => { setCurrentTab('api'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'api' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Terminal className="h-4.5 w-4.5" /> API Playground
          </button>

          <button
            onClick={() => { setCurrentTab('monitors'); setSidebarOpen(false); }}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${currentTab === 'monitors' ? 'bg-purple-600 text-white shadow-md shadow-purple-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
          >
            <Activity className="h-4.5 w-4.5" /> System Monitors
          </button>

          {user?.role === 'ADMIN' && (
            <div className="pt-2 mt-2 border-t border-white/5">
              <button
                onClick={() => { setCurrentTab('admin'); setSidebarOpen(false); }}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold w-full transition-all text-left cursor-pointer ${
                  currentTab === 'admin' 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-500/15' 
                    : 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20 bg-purple-500/5'
                }`}
              >
                <ShieldAlert className="h-4.5 w-4.5 text-purple-400" /> Admin Console
              </button>
            </div>
          )}
        </nav>
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-white/5 bg-black/10 flex flex-col gap-2.5">
        {user && (
          <div className="px-2 py-1 flex flex-col">
            <span className="text-white text-xs font-bold truncate">{user.name}</span>
            <span className="text-[10px] text-gray-500 truncate">{user.email}</span>
          </div>
        )}
        
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl text-xs font-semibold border border-white/5 bg-black/20 text-gray-400 hover:text-white hover:bg-black/30 transition-all cursor-pointer"
        >
          <span>Theme Toggle</span>
          <span>{theme === 'dark' ? '☀️ Light' : '🌙 Dark'}</span>
        </button>
        
        <button
          onClick={() => { logout(); navigate('/'); }}
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-xl text-xs font-bold border border-rose-500/20 bg-rose-950/10 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 transition-all cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Sign Out Session
        </button>
      </div>
    </aside>
  );
};
