import React from 'react';
import {
  KeyRound,
  Star,
  Trash2,
  ShieldAlert,
  Folder,
  Layers,
  History,
  Download,
  Mail,
  Share2,
  Globe,
  Briefcase,
  Gamepad2,
  Tv,
  ShoppingBag,
  Server,
  Building2,
  Sparkles,
  Plus,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import { CategoryType } from '../types';
import { t } from '../lib/i18n';

interface SidebarProps {
  selectedCategory: string; // 'ALL' | 'FAVORITES' | 'TRASH' | 'AUDIT' | CategoryType
  onSelectCategory: (category: string) => void;
  categoryCounts: Record<string, number>;
  totalAccounts: number;
  favoriteCount: number;
  trashCount: number;
  securityIssueCount: number;
  language: 'bn' | 'en';
  customCategories: string[];
  onOpenGenerator: () => void;
  onOpenBackup: () => void;
  onOpenActivityLogs: () => void;
  onOpenAudit: () => void;
  isMobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  selectedCategory,
  onSelectCategory,
  categoryCounts,
  totalAccounts,
  favoriteCount,
  trashCount,
  securityIssueCount,
  language,
  customCategories,
  onOpenGenerator,
  onOpenBackup,
  onOpenActivityLogs,
  onOpenAudit,
  isMobileOpen,
  onCloseMobile,
}) => {
  const presetCategories: { name: CategoryType; icon: React.ReactNode; color: string }[] = [
    { name: 'Gmail', icon: <Mail className="w-4 h-4" />, color: 'text-red-400' },
    { name: 'Facebook', icon: <Share2 className="w-4 h-4" />, color: 'text-blue-500' },
    { name: 'Instagram', icon: <Share2 className="w-4 h-4" />, color: 'text-pink-500' },
    { name: 'X (Twitter)', icon: <Share2 className="w-4 h-4" />, color: 'text-slate-300' },
    { name: 'LinkedIn', icon: <Briefcase className="w-4 h-4" />, color: 'text-sky-500' },
    { name: 'GitHub', icon: <Globe className="w-4 h-4" />, color: 'text-slate-200' },
    { name: 'Microsoft', icon: <Building2 className="w-4 h-4" />, color: 'text-cyan-400' },
    { name: 'Apple', icon: <Smartphone className="w-4 h-4" />, color: 'text-slate-300' },
    { name: 'Banking', icon: <Building2 className="w-4 h-4" />, color: 'text-emerald-400' },
    { name: 'Hosting', icon: <Server className="w-4 h-4" />, color: 'text-amber-400' },
    { name: 'Domain', icon: <Globe className="w-4 h-4" />, color: 'text-violet-400' },
    { name: 'Shopping', icon: <ShoppingBag className="w-4 h-4" />, color: 'text-orange-400' },
    { name: 'Entertainment', icon: <Tv className="w-4 h-4" />, color: 'text-purple-400' },
    { name: 'Gaming', icon: <Gamepad2 className="w-4 h-4" />, color: 'text-indigo-400' },
    { name: 'Work', icon: <Briefcase className="w-4 h-4" />, color: 'text-blue-400' },
  ];

  const handleSelect = (catKey: string) => {
    onSelectCategory(catKey);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex flex-col h-full overflow-y-auto p-3 text-slate-300 text-xs">
      {/* Main Views */}
      <div className="px-3 pt-2 pb-1 text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
        Menu
      </div>
      <div className="space-y-1 mb-4">
        <button
          onClick={() => handleSelect('ALL')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
            selectedCategory === 'ALL'
              ? 'bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20'
              : 'hover:bg-blue-500/10 hover:text-blue-400 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4" />
            <span>{t(language, 'totalAccounts')}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-400">
            {totalAccounts}
          </span>
        </button>

        <button
          onClick={() => handleSelect('FAVORITES')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
            selectedCategory === 'FAVORITES'
              ? 'bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20'
              : 'hover:bg-blue-500/10 hover:text-blue-400 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Star className="w-4 h-4 text-amber-400" />
            <span>{t(language, 'favorites')}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-400">
            {favoriteCount}
          </span>
        </button>

        <button
          onClick={() => {
            onOpenAudit();
            onCloseMobile();
          }}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
            selectedCategory === 'AUDIT'
              ? 'bg-blue-500/10 text-blue-400 font-semibold border border-blue-500/20'
              : 'hover:bg-blue-500/10 hover:text-blue-400 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>{t(language, 'securityAudit')}</span>
          </div>
          {securityIssueCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 font-bold text-[10px]">
              {securityIssueCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleSelect('TRASH')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-colors ${
            selectedCategory === 'TRASH'
              ? 'bg-rose-500/10 text-rose-400 font-semibold border border-rose-500/20'
              : 'hover:bg-white/5 text-slate-400 hover:text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span>{t(language, 'trashBin')}</span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold text-slate-400">
            {trashCount}
          </span>
        </button>
      </div>

      <div className="border-t border-white/5 my-2"></div>

      {/* Preset Categories */}
      <div className="mb-4">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Categories
        </div>
        <div className="space-y-0.5 mt-1">
          {presetCategories.map((cat) => {
            const count = categoryCounts[cat.name] || 0;
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                onClick={() => handleSelect(cat.name)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left ${
                  isSelected
                    ? 'bg-white/10 text-white font-semibold border border-white/10'
                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={cat.color}>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </div>
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
                    {count}
                  </span>
                )}
              </button>
            );
          })}

          {/* Custom Categories */}
          {customCategories.map((cName) => {
            const count = categoryCounts[cName] || 0;
            const isSelected = selectedCategory === cName;
            return (
              <button
                key={cName}
                onClick={() => handleSelect(cName)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition-colors text-left ${
                  isSelected
                    ? 'bg-white/10 text-white font-semibold border border-white/10'
                    : 'hover:bg-white/5 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <Folder className="w-4 h-4 text-blue-400" />
                  <span className="truncate">{cName}</span>
                </div>
                {count > 0 && (
                  <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-slate-400">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="border-t border-white/5 my-2"></div>

      {/* Tools & Utilities */}
      <div className="space-y-1 mb-4">
        <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
          Tools
        </div>
        <button
          onClick={() => {
            onOpenGenerator();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 text-slate-400 transition-colors"
        >
          <KeyRound className="w-4 h-4 text-blue-400" />
          <span>{t(language, 'passwordGenerator')}</span>
        </button>

        <button
          onClick={() => {
            onOpenBackup();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 text-slate-400 transition-colors"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>{t(language, 'backupRestore')}</span>
        </button>

        <button
          onClick={() => {
            onOpenActivityLogs();
            onCloseMobile();
          }}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-blue-500/10 hover:text-blue-400 text-slate-400 transition-colors"
        >
          <History className="w-4 h-4 text-cyan-400" />
          <span>{t(language, 'activityLog')}</span>
        </button>
      </div>

      {/* Bottom Glass Security Status Badge */}
      <div className="mt-auto pt-2">
        <div className="glass rounded-xl p-3.5 space-y-2">
          <div className="flex items-center space-x-2 text-xs text-slate-300 font-medium">
            <span className="status-dot status-secure"></span>
            <span>AES-256 Encrypted</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1 overflow-hidden">
            <div className="bg-blue-500 h-1 rounded-full" style={{ width: '100%' }}></div>
          </div>
          <p className="text-[10px] text-slate-500 font-mono">End-to-end Local Zero-Knowledge</p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 shrink-0 border-r border-white/5 bg-[#0D1117] h-[calc(100vh-61px)] sticky top-[61px]">
        {navContent}
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onCloseMobile}></div>
          <div className="relative w-72 max-w-[80vw] bg-[#0D1117] border-r border-white/10 h-full flex flex-col z-10 shadow-2xl">
            <div className="p-3 border-b border-white/10 flex items-center justify-between">
              <span className="font-bold text-xs text-slate-200">Vault Navigation</span>
              <button onClick={onCloseMobile} className="p-1 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
