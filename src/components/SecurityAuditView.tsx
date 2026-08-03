import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Edit2,
  Sparkles,
  RefreshCw,
  Clock,
  KeyRound,
  ArrowRight,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { CredentialAccount } from '../types';
import { evaluatePasswordStrength } from '../lib/crypto';
import { t } from '../lib/i18n';

interface SecurityAuditViewProps {
  accounts: CredentialAccount[];
  language: 'bn' | 'en';
  onEditAccount: (account: CredentialAccount) => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  accounts,
  language,
  onEditAccount,
}) => {
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Analyze Vault Security Metrics
  const activeAccounts = accounts.filter((a) => !a.isTrash);
  const total = activeAccounts.length;

  const weakAccounts: CredentialAccount[] = [];
  const oldAccounts: CredentialAccount[] = [];
  const passwordMap = new Map<string, CredentialAccount[]>();

  const nowMs = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

  activeAccounts.forEach((acc) => {
    // Check strength
    const strength = evaluatePasswordStrength(acc.password);
    if (strength.score < 55) {
      weakAccounts.push(acc);
    }

    // Check old passwords (>90 days)
    if (acc.updatedDate) {
      const updatedMs = new Date(acc.updatedDate).getTime();
      if (nowMs - updatedMs > ninetyDaysMs) {
        oldAccounts.push(acc);
      }
    }

    // Check duplicates
    if (acc.password) {
      const list = passwordMap.get(acc.password) || [];
      list.push(acc);
      passwordMap.set(acc.password, list);
    }
  });

  const duplicateAccounts: CredentialAccount[] = [];
  passwordMap.forEach((list) => {
    if (list.length > 1) {
      duplicateAccounts.push(...list);
    }
  });

  // Calculate Overall Vault Health Score (0-100)
  let healthScore = 100;
  if (total > 0) {
    const weakDeduction = (weakAccounts.length / total) * 40;
    const dupDeduction = (duplicateAccounts.length / total) * 40;
    const oldDeduction = (oldAccounts.length / total) * 20;
    healthScore = Math.max(0, Math.round(100 - (weakDeduction + dupDeduction + oldDeduction)));
  }

  // Get Gemini AI Advice
  const handleFetchAiAdvice = async () => {
    setLoadingAi(true);
    setAiAdvice(null);
    try {
      const categoryCounts: Record<string, number> = {};
      activeAccounts.forEach((a) => {
        categoryCounts[a.category] = (categoryCounts[a.category] || 0) + 1;
      });

      const res = await fetch('/api/ai-security-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalAccounts: total,
          weakCount: weakAccounts.length,
          duplicateCount: duplicateAccounts.length,
          oldPasswordCount: oldAccounts.length,
          categoryCounts,
          language,
        }),
      });

      const data = await res.json();
      if (data.advice) {
        setAiAdvice(data.advice);
      } else if (data.error) {
        setAiAdvice(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setAiAdvice('Could not connect to AI service.');
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Health Gauge */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Circular Score Gauge */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                className="text-slate-800"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r="40"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={251}
                strokeDashoffset={251 - (251 * healthScore) / 100}
                strokeLinecap="round"
                className={
                  healthScore > 75
                    ? 'text-emerald-500'
                    : healthScore > 50
                    ? 'text-amber-500'
                    : 'text-rose-500'
                }
                fill="transparent"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-2xl font-bold font-mono">{healthScore}%</span>
              <span className="block text-[9px] text-slate-400 uppercase tracking-wider">Health</span>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-indigo-400" />
              {t(language, 'securityAudit')}
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-md">
              {language === 'bn'
                ? 'আপনার ভল্টের সমস্ত অ্যাকাউন্ট বিশ্লেষণ করে দুর্বল বা পুনরাবৃত্ত পাসওয়ার্ড চিহ্নিত করা হয়েছে।'
                : 'Automated vault scan detecting weak passwords, reused credentials, and stale accounts.'}
            </p>
          </div>
        </div>

        {/* AI Assistant Callout Button */}
        <button
          onClick={handleFetchAiAdvice}
          disabled={loadingAi}
          className="py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition shrink-0"
        >
          {loadingAi ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
          <span>{loadingAi ? t(language, 'aiAnalyzing') : t(language, 'getAiAdvice')}</span>
        </button>
      </div>

      {/* AI Security Advice Display */}
      {aiAdvice && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-100 text-xs shadow-lg space-y-2"
        >
          <div className="flex items-center gap-2 font-bold text-sm text-indigo-300">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>AI Security Diagnosis</span>
          </div>
          <div className="whitespace-pre-line text-slate-200 leading-relaxed font-sans">{aiAdvice}</div>
        </motion.div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-rose-500/30 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 rounded-xl bg-rose-500/20 text-rose-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-rose-300">{weakAccounts.length}</span>
            <span className="block text-xs text-slate-400">{t(language, 'weakPasswords')}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-amber-500/30 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400">
            <Copy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-amber-300">{duplicateAccounts.length}</span>
            <span className="block text-xs text-slate-400">{t(language, 'duplicatePasswords')}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-blue-500/30 p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/20 text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-2xl font-bold font-mono text-blue-300">{oldAccounts.length}</span>
            <span className="block text-xs text-slate-400">{t(language, 'oldPasswords')}</span>
          </div>
        </div>
      </div>

      {/* Flagged Items Detail Sections */}
      {weakAccounts.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-rose-300 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>Weak Passwords Requiring Update</span>
          </h3>
          <div className="space-y-2">
            {weakAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200">{acc.websiteName}</span>
                  <span className="text-slate-400 block text-[11px]">{acc.email || acc.username || acc.phoneNumber}</span>
                </div>
                <button
                  onClick={() => onEditAccount(acc)}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-[11px] transition"
                >
                  Fix Password
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {duplicateAccounts.length > 0 && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5">
          <h3 className="font-bold text-sm text-amber-300 mb-3 flex items-center gap-2">
            <Copy className="w-4 h-4" />
            <span>Reused Passwords (Risk of cascading breach)</span>
          </h3>
          <div className="space-y-2">
            {duplicateAccounts.map((acc) => (
              <div
                key={acc.id}
                className="flex items-center justify-between p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-200">{acc.websiteName}</span>
                  <span className="text-slate-400 block text-[11px]">{acc.email || acc.username || acc.phoneNumber}</span>
                </div>
                <button
                  onClick={() => onEditAccount(acc)}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-medium text-[11px] transition"
                >
                  Generate Unique
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {weakAccounts.length === 0 && duplicateAccounts.length === 0 && (
        <div className="p-8 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
          <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto mb-2" />
          <h3 className="font-bold text-slate-200">Excellent Vault Hygiene!</h3>
          <p className="text-xs text-slate-400 mt-1">No weak or duplicate passwords detected.</p>
        </div>
      )}
    </div>
  );
};
