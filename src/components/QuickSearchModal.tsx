import React, { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Search, Globe, X, ArrowRight } from 'lucide-react';
import { CredentialAccount } from '../types';
import { getWebsiteFaviconUrl } from '../lib/storage';

interface QuickSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  accounts: CredentialAccount[];
  onSelectAccount: (account: CredentialAccount) => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  isOpen,
  onClose,
  searchQuery,
  onSearchChange,
  accounts,
  onSelectAccount,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = accounts.filter((acc) => {
    if (acc.isTrash) return false;
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      acc.websiteName.toLowerCase().includes(q) ||
      acc.websiteUrl.toLowerCase().includes(q) ||
      acc.username.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      (acc.phoneNumber && acc.phoneNumber.toLowerCase().includes(q)) ||
      acc.category.toLowerCase().includes(q) ||
      acc.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-[#0A0C10]/80 backdrop-blur-md pt-20 p-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="w-full max-w-lg glass rounded-2xl p-4 shadow-2xl text-slate-100 max-h-[70vh] flex flex-col"
      >
        {/* Search Bar */}
        <div className="relative mb-3 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Type to search accounts, emails, URLs..."
            className="w-full bg-black/40 border border-blue-500/40 focus:border-blue-500 rounded-xl py-3 pl-10 pr-10 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <Search className="w-5 h-5 text-blue-400 absolute left-3 top-3.5" />
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">No matching credentials found</div>
          ) : (
            filtered.map((acc) => {
              const favicon = getWebsiteFaviconUrl(acc.websiteUrl || acc.websiteName);
              return (
                <div
                  key={acc.id}
                  onClick={() => {
                    onSelectAccount(acc);
                    onClose();
                  }}
                  className="p-3 rounded-xl bg-black/30 hover:bg-white/5 border border-white/5 flex items-center justify-between gap-3 cursor-pointer transition text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      {favicon ? (
                        <img src={favicon} alt={acc.websiteName} className="w-5 h-5 object-contain" />
                      ) : (
                        <Globe className="w-4 h-4 text-blue-400" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-semibold text-slate-200 truncate">{acc.websiteName}</h4>
                      <p className="text-slate-400 font-mono text-[11px] truncate">
                        {acc.email || acc.username || acc.phoneNumber || 'No email'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 text-[10px]">
                      {acc.category}
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
