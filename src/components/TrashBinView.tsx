import React from 'react';
import { motion } from 'motion/react';
import { Trash2, RefreshCw, AlertTriangle, Globe } from 'lucide-react';
import { CredentialAccount } from '../types';
import { t } from '../lib/i18n';

interface TrashBinViewProps {
  trashAccounts: CredentialAccount[];
  language: 'bn' | 'en';
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmptyTrash: () => void;
}

export const TrashBinView: React.FC<TrashBinViewProps> = ({
  trashAccounts,
  language,
  onRestore,
  onPermanentDelete,
  onEmptyTrash,
}) => {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-bold text-base text-slate-100">{t(language, 'trashBin')}</h2>
            <p className="text-xs text-slate-400">Deleted items can be restored or purged permanently</p>
          </div>
        </div>

        {trashAccounts.length > 0 && (
          <button
            onClick={onEmptyTrash}
            className="py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs shadow transition flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Trash ({trashAccounts.length})</span>
          </button>
        )}
      </div>

      {/* Accounts List */}
      {trashAccounts.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
          Trash Bin is empty
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {trashAccounts.map((acc) => (
            <div
              key={acc.id}
              className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div className="min-w-0 pr-2">
                <h4 className="font-semibold text-slate-200 truncate">{acc.websiteName}</h4>
                <p className="text-slate-400 font-mono text-[11px] truncate">{acc.email || acc.username || acc.phoneNumber}</p>
                <span className="text-[10px] text-slate-500">
                  Deleted: {acc.deletedAt ? new Date(acc.deletedAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onRestore(acc.id)}
                  title={t(language, 'restoreAccount')}
                  className="px-2.5 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 font-medium text-[11px] flex items-center gap-1 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Restore</span>
                </button>
                <button
                  onClick={() => onPermanentDelete(acc.id)}
                  title={t(language, 'permanentDelete')}
                  className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/40 text-rose-300 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
