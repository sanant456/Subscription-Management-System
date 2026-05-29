import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Terminal } from 'lucide-react';
import { useSubscription } from '../../context/SubscriptionContext';

export const ApiPlaygroundTab: React.FC = () => {
  const { triggerMockApi } = useSubscription();

  const [payloadJson, setPayloadJson] = useState(
    JSON.stringify({ email: 'client@company.com', plan: 'Pro', interval: 'monthly' }, null, 2)
  );
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [apiMethod, setApiMethod] = useState<'POST' | 'GET' | 'PATCH'>('POST');
  const [apiEndpoint, setApiEndpoint] = useState('/subscriptions');

  const runApiConsole = async () => {
    try {
      const parsed = apiMethod === 'GET' ? null : JSON.parse(payloadJson);
      const res = await triggerMockApi(apiMethod, apiEndpoint, parsed);
      setApiResponse(res);
    } catch (e) {
      setApiResponse({ success: false, error: 'Invalid JSON format in editor.' });
    }
  };

  return (
    <motion.div
      key="api"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card className="bg-black/20 border-white/5 flex-grow">
            <CardHeader>
              <CardTitle className="text-base">Endpoint Selector</CardTitle>
              <CardDescription className="text-xs">Choose method, endpoint, and define JSON body payload to test core billing endpoints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-400">Method & Route</label>
                <div className="flex gap-2">
                  <select
                    value={apiMethod}
                    onChange={(e) => {
                      const m = e.target.value as any;
                      setApiMethod(m);
                      if (m === 'GET') {
                        setApiEndpoint('/subscriptions/sub_b8d38e21');
                      } else if (m === 'POST') {
                        setApiEndpoint('/subscriptions');
                        setPayloadJson(JSON.stringify({ email: 'client@company.com', plan: 'Pro', interval: 'monthly' }, null, 2));
                      } else {
                        setApiEndpoint('/subscriptions/sub_e2819cd8');
                        setPayloadJson(JSON.stringify({ status: 'Active' }, null, 2));
                      }
                    }}
                    className="px-3.5 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:outline-none"
                  >
                    <option value="POST">POST</option>
                    <option value="GET">GET</option>
                    <option value="PATCH">PATCH</option>
                  </select>
                  
                  <input
                    type="text"
                    value={apiEndpoint}
                    onChange={(e) => setApiEndpoint(e.target.value)}
                    className="flex-grow px-4 py-2.5 rounded-xl border border-white/10 bg-black/40 text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {apiMethod !== 'GET' && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400">Request Body Payload (JSON)</label>
                  <textarea
                    value={payloadJson}
                    onChange={(e) => setPayloadJson(e.target.value)}
                    rows={6}
                    className="w-full p-3 font-mono text-xs text-emerald-300 bg-black/40 border border-white/10 rounded-xl focus:outline-none focus:border-purple-500/50 resize-none"
                  />
                </div>
              )}

              <Button variant="primary" className="w-full mt-4" onClick={runApiConsole} leftIcon={<Terminal className="h-4 w-4" />}>
                Execute Request
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Code Console Screen */}
        <div className="lg:col-span-7 flex flex-col">
          <Card className="bg-black/30 border-white/10 overflow-hidden h-full flex flex-col justify-between">
            <div className="px-6 py-4.5 border-b border-white/5 bg-black/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-cyan-500" />
                <span className="font-mono text-xs text-gray-300">Gateway Response Payload</span>
              </div>
              <span className="text-[10px] text-gray-500 font-mono">STATUS: 200 OK</span>
            </div>

            <div className="p-6 flex-grow overflow-auto font-mono text-[11px] bg-black/40 text-cyan-300 min-h-[300px]">
              {apiResponse ? (
                <pre>{JSON.stringify(apiResponse, null, 2)}</pre>
              ) : (
                <span className="text-gray-600">// Execute request to test API filters and DB synchronization.</span>
              )}
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};
