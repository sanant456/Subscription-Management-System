import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';

interface ApiShowcaseSectionProps {
  apiMethod: 'POST' | 'GET' | 'PATCH';
  apiEndpoint: string;
  apiPayload: string;
  setApiPayload: (payload: string) => void;
  apiResponse: any;
  apiLoading: boolean;
  setApiPreset: (method: 'POST' | 'GET' | 'PATCH', endpoint: string, payload: any) => void;
  handleApiRun: () => void;
}

export const ApiShowcaseSection: React.FC<ApiShowcaseSectionProps> = ({
  apiMethod,
  apiEndpoint,
  apiPayload,
  setApiPayload,
  apiResponse,
  apiLoading,
  setApiPreset,
  handleApiRun,
}) => {
  return (
    <section id="api" className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        <div className="lg:col-span-5 flex flex-col items-start gap-6">
          <span className="text-xs uppercase tracking-widest text-purple-400 font-bold">API Documentation</span>
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-white light-theme:text-gray-900 leading-tight">
            Interactive API Playground Console
          </h2>
          <p className="text-gray-400 light-theme:text-gray-600">
            Integrate with simple HTTP REST endpoints. Select an operation below to load its payload, test the mock server response, and witness live dashboard records update.
          </p>

          <div className="flex flex-col gap-2.5 w-full">
            <button 
              onClick={() => setApiPreset('POST', '/subscriptions', { email: 'billing@subvault.io', plan: 'Enterprise', interval: 'yearly' })}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${apiMethod === 'POST' ? 'bg-[#15152a] border-purple-500/40 text-white' : 'bg-black/10 hover:bg-black/30 border-white/5 text-gray-400'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-bold">POST</span>
                <span className="font-mono text-xs">/subscriptions</span>
              </div>
              <div className="text-[10px] text-purple-400 font-bold uppercase">Create Subscription</div>
            </button>

            <button 
              onClick={() => setApiPreset('GET', '/subscriptions/sub_b8d38e21', null)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${apiMethod === 'GET' ? 'bg-[#15152a] border-purple-500/40 text-white' : 'bg-black/10 hover:bg-black/30 border-white/5 text-gray-400'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded font-mono font-bold">GET</span>
                <span className="font-mono text-xs">/subscriptions/{'{id}'}</span>
              </div>
              <div className="text-[10px] text-purple-400 font-bold uppercase">Retrieve Payload</div>
            </button>

            <button 
              onClick={() => setApiPreset('PATCH', '/subscriptions/sub_e2819cd8', { status: 'Active' })}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left cursor-pointer ${apiMethod === 'PATCH' ? 'bg-[#15152a] border-purple-500/40 text-white' : 'bg-black/10 hover:bg-black/30 border-white/5 text-gray-400'}`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono font-bold">PATCH</span>
                <span className="font-mono text-xs">/subscriptions/{'{id}'}</span>
              </div>
              <div className="text-[10px] text-purple-400 font-bold uppercase">Update Status</div>
            </button>
          </div>
          
          <div className="text-xs text-gray-500 flex items-center gap-1.5 font-medium mt-1">
            <AlertCircle className="h-4.5 w-4.5 text-purple-400 flex-shrink-0" />
            Creating a subscription here will add it directly to the dashboard list!
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl bg-[#030310]/95 border border-white/10">
            {/* API Header */}
            <div className="flex items-center justify-between bg-black/30 px-5 py-4 border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                <span className="font-mono text-xs font-semibold text-gray-300">HTTP REST Sandbox Gateway</span>
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleApiRun}
                isLoading={apiLoading}
                className="shadow-sm"
              >
                Send Request
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5 h-[340px]">
              {/* Request Payload Editor */}
              <div className="p-4 flex flex-col h-full bg-[#050518]">
                <div className="text-[10px] text-purple-400 font-bold uppercase tracking-wider mb-2 font-heading">
                  Request {apiMethod === 'GET' ? 'Params' : 'Body JSON'}
                </div>
                {apiMethod === 'GET' ? (
                  <div className="text-xs font-mono text-gray-500 p-3 rounded-lg bg-black/40 border border-white/5 flex-grow">
                    // GET requests do not require a payload body. URL identifier will query PostgreSQL db.
                  </div>
                ) : (
                  <textarea
                    value={apiPayload}
                    onChange={(e) => setApiPayload(e.target.value)}
                    className="w-full flex-grow p-3 font-mono text-xs text-emerald-300 bg-black/40 border border-white/5 rounded-lg focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                )}
              </div>

              {/* Response Console */}
              <div className="p-4 flex flex-col h-full bg-[#03030d]">
                <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2 font-heading">
                  API Response Payload
                </div>
                <div className="w-full flex-grow p-3 font-mono text-[11px] bg-black/40 border border-white/5 rounded-lg overflow-y-auto max-h-[250px] text-gray-400">
                  {apiResponse ? (
                    <pre className="text-cyan-300">{JSON.stringify(apiResponse, null, 2)}</pre>
                  ) : (
                    <span className="text-gray-600">// Click "Send Request" to trigger API middleware pipeline...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
      </div>
    </section>
  );
};
