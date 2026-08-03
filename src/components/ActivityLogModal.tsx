import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, History, Trash2, Shield, Key, Lock, Clock } from 'lucide-react';
import { ActivityLog } from '../types';
import { fetchActivityLogs, clearActivityLogs } from '../lib/storage';
import { t } from '../lib/i18n';

interface ActivityLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'bn' | 'en';
}

export const ActivityLogModal: React.FC<ActivityLogModalProps> = ({
  isOpen,
  onClose,
  language,
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = async () => {
    setLoading(true);
    const data = await fetchActivityLogs();
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
    }
  }, [isOpen]);

  const handleClear = async () => {
    if (confirm('Clear all activity logs?')) {
      await clearActivityLogs();
      setLogs([]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">{t(language, 'activityLog')}</h2>
              <p className="text-xs text-slate-400">Audit trail of vault events & access history</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {logs.length > 0 && (
              <button
                onClick={handleClear}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 text-slate-400 hover:text-rose-200 transition"
                title="Clear Logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 text-xs">
          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading audit history...</div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No activity recorded yet</div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5">
                  <span className="font-semibold text-slate-200 block">{log.action}</span>
                  {log.details && <span className="text-slate-400 text-[11px] block">{log.details}</span>}
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] text-slate-500 font-mono block">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                  <span className="inline-block px-1.5 py-0.5 rounded bg-slate-900 text-[9px] text-slate-400 uppercase font-mono mt-0.5">
                    {log.category}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </div>
  );
};
