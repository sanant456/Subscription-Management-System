import React from 'react';
import { Github } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-white/5 bg-black/40 relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-400 flex items-center justify-center shadow-lg">
            <span className="font-heading font-black text-sm text-white">S</span>
          </div>
          <div className="flex flex-col text-left">
            <span className="font-heading font-bold text-sm text-white light-theme:text-gray-900">SubVault</span>
            <span className="text-[8px] text-gray-500">Billing Infrastructure</span>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 text-xs font-semibold text-gray-400">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-purple-400 flex items-center gap-1.5">
            <Github className="h-4 w-4" /> GitHub
          </a>
          <a href="#docs" className="hover:text-purple-400">Documentation</a>
          <a href="#contact" className="hover:text-purple-400">Contact Support</a>
          <a href="#privacy" className="hover:text-purple-400">Privacy Policy</a>
        </div>

        <div className="text-xs text-gray-500 text-center md:text-right">
          &copy; {new Date().getFullYear()} SubVault Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
