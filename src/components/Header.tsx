import React, { useState, useEffect } from 'react';
import {
  Shield,
  Search,
  Plus,
  Lock,
  Moon,
  Sun,
  Globe,
  Sliders,
  History,
  KeyRound,
  Download,
  AlertTriangle,
  Menu,
} from 'lucide-react';
import { t } from '../lib/i18n';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  language: 'bn' | 'en';
  theme: 'dark' | 'light';
  autoLockMinutes: number;
  weakCount: number;
  duplicateCount: number;
  onToggleLanguage: () => void;
  onToggleTheme: () => void;
  onLockVault: () => void;
  onOpenAddModal: () => void;
  onOpenGenerator: () => void;
  onOpenBackup: () => void;
  onOpenSettings: () => void;
  onOpenAudit: () => void;
  onToggleMobileSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  language,
  theme,
  autoLockMinutes,
  weakCount,
  duplicateCount,
  onToggleLanguage,
  onToggleTheme,
  onLockVault,
  onOpenAddModal,
  onOpenGenerator,
  onOpenBackup,
  onOpenSettings,
  onOpenAudit,
  onToggleMobileSidebar,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(
    autoLockMinutes > 0 ? autoLockMinutes * 60 : null
  );

  // Auto-lock countdown timer
  useEffect(() => {
    if (autoLockMinutes <= 0) {
      setSecondsRemaining(null);
      return;
    }

    setSecondsRemaining(autoLockMinutes * 60);

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          onLockVault();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Reset timer on user interaction
    const handleActivity = () => {
      setSecondsRemaining(autoLockMinutes * 60);
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
    };
  }, [autoLockMinutes, onLockVault]);

  const formatTimer = (totalSecs: number | null) => {
    if (totalSecs === null) return '∞';
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const totalSecurityAlerts = weakCount + duplicateCount;

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0D1117]/80 backdrop-blur-md px-4 sm:px-6 py-3 text-slate-100 flex items-center justify-between gap-3">
      {/* Mobile Menu & Logo */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileSidebar}
          className="md:hidden p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/30">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-sm tracking-tight leading-tight text-white">{t(language, 'appName')}</h1>
            <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
              <span className="status-dot status-secure"></span>
              256-Bit AES Encrypted
            </span>
          </div>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="flex-1 max-w-md mx-2">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t(language, 'searchPlaceholder')}
            className="w-full bg-white/5 border border-white/10 focus:border-blue-500/80 focus:bg-white/[0.07] rounded-xl py-2 pl-9 pr-12 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition"
          />
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <kbd className="hidden lg:inline-block absolute right-3 top-2 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-white/5 rounded border border-white/10">
            Ctrl+K
          </kbd>
        </div>
      </div>

      {/* Quick Action Controls */}
      <div className="flex items-center gap-2">
        {/* Security Alert Badge Button */}
        {totalSecurityAlerts > 0 && (
          <button
            onClick={onOpenAudit}
            title={`${totalSecurityAlerts} Security Alerts`}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium hover:bg-rose-500/20 transition"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>{totalSecurityAlerts}</span>
          </button>
        )}

        {/* Password Generator Quick Button */}
        <button
          onClick={onOpenGenerator}
          title={t(language, 'passwordGenerator')}
          className="hidden md:flex p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
        >
          <KeyRound className="w-4 h-4 text-blue-400" />
        </button>

        {/* Add Account Button */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t(language, 'addAccount')}</span>
        </button>

        {/* Auto Lock Timer Badge */}
        {autoLockMinutes > 0 && (
          <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400">
            <Lock className="w-3 h-3 text-emerald-400" />
            <span>{formatTimer(secondsRemaining)}</span>
          </div>
        )}

        {/* Language Switch */}
        <button
          onClick={onToggleLanguage}
          title="Switch Language (বাংলা / English)"
          className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          {language === 'bn' ? 'English' : 'বাংলা'}
        </button>

        {/* Theme Switch */}
        <button
          onClick={onToggleTheme}
          title="Toggle Theme"
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-slate-300" />}
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title={t(language, 'settings')}
          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition"
        >
          <Sliders className="w-4 h-4" />
        </button>

        {/* Lock Vault Button */}
        <button
          onClick={onLockVault}
          title={t(language, 'lockVault')}
          className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 transition"
        >
          <Lock className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
