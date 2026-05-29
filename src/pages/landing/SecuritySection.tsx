import React from 'react';
import { Card } from '../../components/ui/Card';
import { Key, Globe, Lock, ShieldCheck, Cpu } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  return (
    <section id="security" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5 bg-gradient-to-b from-purple-950/5 to-transparent rounded-3xl">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 mb-4 font-heading">
          Bank-Grade Security Framework
        </h2>
        <p className="text-gray-400 light-theme:text-gray-600">
          SubVault is engineered around modern safety protocols to secure cardholder payloads.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 max-w-5xl mx-auto text-center font-medium">
        <Card className="md:col-span-1 border-white/5">
          <Key className="h-8 w-8 text-purple-400 mx-auto mb-4" />
          <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">JWT Tokens</h4>
          <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">Cryptographically signed credentials</p>
        </Card>
        <Card className="md:col-span-1 border-white/5">
          <Globe className="h-8 w-8 text-cyan-400 mx-auto mb-4" />
          <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">OAuth Login</h4>
          <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">OAuth2 protocols for authentication</p>
        </Card>
        <Card className="md:col-span-1 border-white/5">
          <Lock className="h-8 w-8 text-indigo-400 mx-auto mb-4" />
          <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">AES-256</h4>
          <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">Military encryption for payloads</p>
        </Card>
        <Card className="md:col-span-1 border-white/5">
          <ShieldCheck className="h-8 w-8 text-emerald-400 mx-auto mb-4" />
          <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">PCI-DSS</h4>
          <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">Strict tokenization compliance</p>
        </Card>
        <Card className="md:col-span-1 border-white/5">
          <Cpu className="h-8 w-8 text-rose-400 mx-auto mb-4" />
          <h4 className="font-heading font-semibold text-sm text-white light-theme:text-gray-900 mb-1">TLS 1.3</h4>
          <p className="text-[11px] text-gray-400 light-theme:text-gray-500 leading-normal">Secure sockets and transit handshakes</p>
        </Card>
      </div>
    </section>
  );
};
