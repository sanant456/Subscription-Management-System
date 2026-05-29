import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { SystemLog } from '../../context/SubscriptionContext';

interface MonitorsTabProps {
  systemLogs: SystemLog[];
  clearLogs: () => void;
  triggerChaosMock: () => void;
}

export const MonitorsTab: React.FC<MonitorsTabProps> = ({
  systemLogs,
  clearLogs,
  triggerChaosMock,
}) => {
  return (
    <motion.div
      key="monitors"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="font-heading text-lg font-bold text-white light-theme:text-gray-900">Live Microservices Telemetry</h3>
          <p className="text-xs text-gray-400">Stream logs directly showing routing, database commits, cache checks, and messaging pipelines</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="text-xs" onClick={clearLogs}>
            Clear Feed
          </Button>
          <Button variant="secondary" size="sm" className="text-xs border-amber-500/20 text-amber-300" onClick={triggerChaosMock}>
            Inject Logs Test
          </Button>
        </div>
      </div>

      <Card className="bg-[#03030d] border-white/10 overflow-hidden font-mono text-xs flex flex-col">
        {/* Console Header */}
        <div className="px-6 py-4 border-b border-white/5 bg-black/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-purple-500 inline-block animate-ping" />
            <span className="text-gray-300 font-semibold uppercase text-[10px] tracking-wider">subvaultd.service.log</span>
          </div>
          <span className="text-[10px] text-purple-400 font-bold">CONNECTED</span>
        </div>

        {/* Terminal display */}
        <div className="p-6 h-[400px] overflow-y-auto space-y-2 bg-[#050518]/90">
          {systemLogs.length === 0 ? (
            <div className="text-gray-600">// No active server events log entries. Trigger actions inside other tabs!</div>
          ) : (
            systemLogs.map((log) => {
              const colors = {
                info: 'text-gray-400',
                success: 'text-emerald-400',
                warn: 'text-amber-400',
                error: 'text-rose-400 font-bold',
              };
              const icons = {
                info: 'ℹ️',
                success: '✅',
                warn: '⚠️',
                error: '🚨',
              };
              return (
                <div key={log.id} className={`flex items-start gap-3 py-1 border-b border-white/2 hover:bg-white/2 transition-colors ${colors[log.type]}`}>
                  <span className="text-gray-600 flex-shrink-0">{log.timestamp}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-white/5 border border-white/5 flex-shrink-0 text-purple-300 w-32 truncate text-center">
                    {log.service}
                  </span>
                  <span className="flex-shrink-0">{icons[log.type]}</span>
                  <span className="flex-grow font-medium leading-relaxed">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </motion.div>
  );
};
