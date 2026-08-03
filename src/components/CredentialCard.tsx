import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Star,
  Copy,
  Check,
  ExternalLink,
  Trash2,
  Globe,
  Tag,
  User,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { CredentialAccount } from '../types';
import { getWebsiteFaviconUrl } from '../lib/storage';
import { t } from '../lib/i18n';

interface CredentialCardProps {
  account: CredentialAccount;
  language: 'bn' | 'en';
  onSelect: (account: CredentialAccount) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onCopyUsername: (text: string, e: React.MouseEvent) => void;
  onCopyPassword: (text: string, e: React.MouseEvent) => void;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export const CredentialCard: React.FC<CredentialCardProps> = ({
  account,
  language,
  onSelect,
  onToggleFavorite,
  onCopyUsername,
  onDelete,
}) => {
  const [copiedUser, setCopiedUser] = useState(false);
  const [imgError, setImgError] = useState(false);

  const faviconUrl = getWebsiteFaviconUrl(account.websiteUrl || account.websiteName);

  const primaryIdentity = account.username || account.email || account.phoneNumber || 'N/A';

  const handleCopyUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (primaryIdentity && primaryIdentity !== 'N/A') {
      onCopyUsername(primaryIdentity, e);
      setCopiedUser(true);
      setTimeout(() => setCopiedUser(false), 2000);
    }
  };

  const handleLaunchUrl = (e: React.MouseEvent) => {
    e.stopPropagation();
    let url = account.websiteUrl;
    if (url) {
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => onSelect(account)}
      className="group relative glass-card rounded-2xl p-4 cursor-pointer flex flex-col justify-between hover:border-blue-500/40 transition-all duration-200 shadow-lg hover:shadow-blue-900/10"
    >
      <div>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Logo / Favicon */}
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
              {faviconUrl && !imgError ? (
                <img
                  src={faviconUrl}
                  alt={account.websiteName}
                  onError={() => setImgError(true)}
                  className="w-5 h-5 object-contain"
                />
              ) : (
                <Globe className="w-5 h-5 text-blue-400" />
              )}
            </div>

            <div className="min-w-0">
              <h3 className="font-semibold text-sm text-slate-100 group-hover:text-blue-400 transition truncate">
                {account.websiteName}
              </h3>
              <span className="inline-block px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 font-medium mt-0.5">
                {account.category}
              </span>
            </div>
          </div>

          {/* Actions: External Link, Favorite, Delete */}
          <div className="flex items-center gap-1 shrink-0">
            {account.websiteUrl && (
              <button
                onClick={handleLaunchUrl}
                title="Open Website"
                className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={(e) => onToggleFavorite(account.id, e)}
              title={account.isFavorite ? 'Remove Favorite' : 'Mark Favorite'}
              className="p-1.5 rounded-lg transition"
            >
              <Star
                className={`w-4 h-4 ${
                  account.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-600 hover:text-slate-300'
                }`}
              />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(account.id, e);
              }}
              title={t(language, 'deleteAccount')}
              className="p-1.5 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-500/10 transition opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Identity Details */}
        <div className="mb-3 bg-black/30 p-2.5 rounded-xl border border-white/5 text-xs">
          {/* Username / Primary Identity */}
          <div className="flex items-center justify-between text-slate-300 font-mono gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span className="truncate">{primaryIdentity}</span>
            </div>
            {primaryIdentity !== 'N/A' && (
              <button
                onClick={handleCopyUserClick}
                title={t(language, 'copyUsername')}
                className="p-1 rounded bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 transition shrink-0"
              >
                {copiedUser ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Tags */}
        {account.tags && account.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {account.tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="tag-chip flex items-center gap-1 text-[10px]">
                <Tag className="w-2.5 h-2.5 opacity-60" />
                <span>{tag}</span>
              </span>
            ))}
            {account.tags.length > 3 && (
              <span className="text-[10px] text-slate-500 font-mono self-center">
                +{account.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>

      {/* View Full Details Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onSelect(account);
        }}
        className="w-full mt-2 py-2 px-3 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/20 hover:border-blue-500/40 text-blue-300 text-xs font-medium flex items-center justify-between transition-all group/btn"
      >
        <span className="flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5 text-blue-400" />
          <span>{t(language, 'viewDetails')}</span>
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-blue-400 group-hover/btn:translate-x-0.5 transition-transform" />
      </button>
    </motion.div>
  );
};

