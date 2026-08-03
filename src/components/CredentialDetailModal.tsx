import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  Edit2,
  Trash2,
  Star,
  Globe,
  User,
  Mail,
  Lock,
  Calendar,
  History,
  Tag,
  FileText,
  Phone,
} from 'lucide-react';
import { CredentialAccount } from '../types';
import { evaluatePasswordStrength } from '../lib/crypto';
import { getWebsiteFaviconUrl } from '../lib/storage';
import { t } from '../lib/i18n';

interface CredentialDetailModalProps {
  account: CredentialAccount | null;
  isOpen: boolean;
  onClose: () => void;
  language: 'bn' | 'en';
  onEdit: (account: CredentialAccount) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onCopyUsername: (text: string) => void;
  onCopyPassword: (text: string) => void;
}

export const CredentialDetailModal: React.FC<CredentialDetailModalProps> = ({
  account,
  isOpen,
  onClose,
  language,
  onEdit,
  onDelete,
  onToggleFavorite,
  onCopyUsername,
  onCopyPassword,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [copiedUser, setCopiedUser] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPass, setCopiedPass] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!isOpen || !account) return null;

  const maskEmail = (email: string) => {
    if (!email) return '';
    const atIndex = email.lastIndexOf('@');
    if (atIndex < 1) return '••••••••';
    const local = email.slice(0, atIndex);
    const domain = email.slice(atIndex + 1);
    const maskedLocal = local.length <= 2 ? '••' : local[0] + '••••' + local[local.length - 1];
    return `${maskedLocal}@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    if (phone.length <= 4) return '••••••••';
    const start = phone.slice(0, 4);
    const end = phone.slice(-2);
    return `${start}••••${end}`;
  };

  const faviconUrl = getWebsiteFaviconUrl(account.websiteUrl || account.websiteName);
  const strength = evaluatePasswordStrength(account.password);

  const handleCopyUser = () => {
    if (account.username) {
      onCopyUsername(account.username);
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    }
  };

  const handleCopyEmail = () => {
    if (account.email) {
      onCopyUsername(account.email);
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyPhone = () => {
    if (account.phoneNumber) {
      navigator.clipboard.writeText(account.phoneNumber);
      setCopiedPhone(true);
      setTimeout(() => setCopiedPhone(false), 2000);
    }
  };

  const handleCopyPass = () => {
    onCopyPassword(account.password);
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  const handleLaunch = () => {
    let url = account.websiteUrl;
    if (url) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0C10]/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {faviconUrl && !imgError ? (
                <img
                  src={faviconUrl}
                  alt={account.websiteName}
                  onError={() => setImgError(true)}
                  className="w-7 h-7 object-contain"
                />
              ) : (
                <Globe className="w-6 h-6 text-blue-400" />
              )}
            </div>

            <div>
              <h2 className="font-bold text-lg text-white">{account.websiteName}</h2>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[11px] text-slate-400 font-medium mt-0.5 inline-block">
                {account.category}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(account.id)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-amber-400 transition"
            >
              <Star className={`w-4 h-4 ${account.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Credentials Info Cards */}
        <div className="space-y-4 text-xs">
          {/* Website Link */}
          {account.websiteUrl && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2 truncate text-blue-400">
                <Globe className="w-4 h-4 shrink-0" />
                <span className="truncate">{account.websiteUrl}</span>
              </div>
              <button
                onClick={handleLaunch}
                className="px-2.5 py-1 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 font-medium text-[11px] flex items-center gap-1 transition"
              >
                <span>Visit</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Username Field */}
          {account.username && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                <User className="w-3 h-3 text-blue-400" />
                {t(language, 'username')}
              </span>
              <div className="flex items-center justify-between font-mono text-sm text-slate-200">
                <span className="select-all truncate">{account.username}</span>
                <button
                  onClick={handleCopyUser}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center gap-1 text-xs transition"
                >
                  {copiedUser ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedUser ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Email Address Field */}
          {account.email && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                <Mail className="w-3 h-3 text-blue-400" />
                {t(language, 'email')}
              </span>
              <div className="flex items-center justify-between font-mono text-sm text-slate-200">
                <span className="select-all truncate text-blue-400">
                  {showEmail ? account.email : maskEmail(account.email)}
                </span>
                <div className="flex items-center gap-1 shrink-0 font-sans">
                  <button
                    onClick={() => setShowEmail(!showEmail)}
                    title={showEmail ? 'Hide Email' : 'Show Email'}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
                  >
                    {showEmail ? <EyeOff className="w-3.5 h-3.5 text-blue-400" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleCopyEmail}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center gap-1 text-xs transition"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmail ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Fallback Identity if neither Username nor Email is set */}
          {!account.username && !account.email && !account.phoneNumber && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Identity</span>
              <div className="font-mono text-sm text-slate-400">N/A</div>
            </div>
          )}

          {/* Mobile Number Field */}
          {account.phoneNumber && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                <Phone className="w-3 h-3 text-blue-400" />
                {t(language, 'mobileNumber')}
              </span>
              <div className="flex items-center justify-between font-mono text-sm text-slate-200">
                <a href={`tel:${account.phoneNumber}`} className="select-all truncate text-blue-300 hover:underline">
                  {showPhone ? account.phoneNumber : maskPhone(account.phoneNumber)}
                </a>
                <div className="flex items-center gap-1 shrink-0 font-sans">
                  <button
                    onClick={() => setShowPhone(!showPhone)}
                    title={showPhone ? 'Hide Phone' : 'Show Phone'}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
                  >
                    {showPhone ? <EyeOff className="w-3.5 h-3.5 text-blue-400" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={handleCopyPhone}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 flex items-center gap-1 text-xs transition font-sans"
                  >
                    {copiedPhone ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedPhone ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Password Field */}
          <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
              <span>Password</span>
              <span style={{ color: strength.color }}>{strength.label} ({strength.score}%)</span>
            </div>

            <div className="flex items-center justify-between font-mono text-sm text-slate-200">
              <span className="select-all tracking-wider text-blue-400">
                {showPassword ? account.password : '••••••••••••••••'}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleCopyPass}
                  className="p-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 text-xs shadow-lg shadow-blue-900/30 transition"
                >
                  {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPass ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Password History (If available) */}
          {account.passwordHistory && account.passwordHistory.length > 0 && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                <History className="w-3 h-3" />
                Previous Passwords
              </span>
              <div className="space-y-1">
                {account.passwordHistory.map((h, i) => (
                  <div key={i} className="flex justify-between text-slate-400 font-mono text-[11px]">
                    <span>{h.password}</span>
                    <span className="text-[10px] text-slate-600">{new Date(h.changedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tags */}
          {account.tags && account.tags.length > 0 && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1.5">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                <Tag className="w-3 h-3" />
                Tags
              </span>
              <div className="flex flex-wrap gap-1">
                {account.tags.map((t, i) => (
                  <span key={i} className="tag-chip">
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {account.notes && (
            <div className="p-3 rounded-xl bg-black/40 border border-white/10 space-y-1">
              <span className="text-slate-500 text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Notes
              </span>
              <p className="text-slate-300 whitespace-pre-wrap">{account.notes}</p>
            </div>
          )}

          {/* Dates */}
          <div className="flex justify-between text-[10px] text-slate-500 px-1 pt-1 font-mono">
            <span>Created: {new Date(account.createdDate).toLocaleDateString()}</span>
            <span>Updated: {new Date(account.updatedDate).toLocaleDateString()}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-white/10">
            <button
              onClick={() => {
                onClose();
                onEdit(account);
              }}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center justify-center gap-1.5 shadow-lg shadow-blue-900/30 transition"
            >
              <Edit2 className="w-4 h-4" />
              <span>{t(language, 'editAccount')}</span>
            </button>
            <button
              onClick={() => {
                onClose();
                onDelete(account.id);
              }}
              className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-300 font-semibold flex items-center gap-1.5 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
