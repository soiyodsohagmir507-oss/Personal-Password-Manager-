import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Lock,
  Globe,
  User,
  Mail,
  FileText,
  Tag,
  Star,
  RefreshCw,
  Eye,
  EyeOff,
  Check,
  KeyRound,
  History,
  Shield,
  Plus,
  Phone,
} from 'lucide-react';
import { CredentialAccount, CategoryType } from '../types';
import { generatePassword, evaluatePasswordStrength } from '../lib/crypto';
import { t } from '../lib/i18n';

interface AddEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (account: Partial<CredentialAccount>) => void;
  accountToEdit?: CredentialAccount | null;
  presetCategory?: string;
  customCategories: string[];
  language: 'bn' | 'en';
  onOpenGeneratorModal: () => void;
}

export const AddEditModal: React.FC<AddEditModalProps> = ({
  isOpen,
  onClose,
  onSave,
  accountToEdit,
  presetCategory,
  customCategories,
  language,
  onOpenGeneratorModal,
}) => {
  const [websiteName, setWebsiteName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<CategoryType>('General');
  const [newCustomCategory, setNewCustomCategory] = useState('');
  const [isAddingCustomCategory, setIsAddingCustomCategory] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [notes, setNotes] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const defaultCategories: CategoryType[] = [
    'Gmail',
    'Facebook',
    'Instagram',
    'X (Twitter)',
    'LinkedIn',
    'GitHub',
    'Microsoft',
    'Apple',
    'Banking',
    'Hosting',
    'Domain',
    'Shopping',
    'Entertainment',
    'Gaming',
    'Work',
    'General',
  ];

  const allCategories = Array.from(new Set([...defaultCategories, ...customCategories]));

  useEffect(() => {
    if (accountToEdit) {
      setWebsiteName(accountToEdit.websiteName || '');
      setWebsiteUrl(accountToEdit.websiteUrl || '');
      setUsername(accountToEdit.username || '');
      setEmail(accountToEdit.email || '');
      setPhoneNumber(accountToEdit.phoneNumber || '');
      setPassword(accountToEdit.password || '');
      setCategory(accountToEdit.category || 'General');
      setTagsInput((accountToEdit.tags || []).join(', '));
      setNotes(accountToEdit.notes || '');
      setIsFavorite(accountToEdit.isFavorite || false);
    } else {
      setWebsiteName('');
      setWebsiteUrl('');
      setUsername('');
      setEmail('');
      setPhoneNumber('');
      setPassword('');
      setCategory((presetCategory && presetCategory !== 'ALL' && presetCategory !== 'FAVORITES') ? presetCategory : 'Gmail');
      setTagsInput('');
      setNotes('');
      setIsFavorite(false);
    }
    setShowHistory(false);
    setIsAddingCustomCategory(false);
  }, [accountToEdit, presetCategory, isOpen]);

  if (!isOpen) return null;

  const strength = evaluatePasswordStrength(password);

  const handleGenerateInlinePassword = () => {
    const newPass = generatePassword({
      length: 16,
      useUppercase: true,
      useLowercase: true,
      useNumbers: true,
      useSymbols: true,
      excludeAmbiguous: true,
      mode: 'random',
    });
    setPassword(newPass);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!websiteName || !password) return;

    const parsedCategory = isAddingCustomCategory && newCustomCategory.trim()
      ? newCustomCategory.trim()
      : category;

    const parsedTags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    onSave({
      id: accountToEdit?.id,
      websiteName,
      websiteUrl,
      username,
      email,
      phoneNumber,
      password,
      category: parsedCategory,
      tags: parsedTags,
      notes,
      isFavorite,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0C10]/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg glass rounded-2xl p-6 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">
                {accountToEdit ? t(language, 'editAccount') : t(language, 'addAccount')}
              </h2>
              <p className="text-xs text-slate-400">
                {language === 'bn' ? 'অ্যাকাউন্টের এনক্রিপ্টেড তথ্য লিখুন' : 'Enter encrypted account credentials'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Website Name & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t(language, 'websiteName')} *
              </label>
              <input
                type="text"
                required
                value={websiteName}
                onChange={(e) => setWebsiteName(e.target.value)}
                placeholder="e.g. Gmail, GitHub, Bank"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t(language, 'category')}
              </label>
              {!isAddingCustomCategory ? (
                <div className="flex gap-1">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  >
                    {allCategories.map((cat) => (
                      <option key={cat} value={cat} className="bg-[#0D1117]">
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(true)}
                    title="Add Custom Category"
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newCustomCategory}
                    onChange={(e) => setNewCustomCategory(e.target.value)}
                    placeholder="New category..."
                    className="w-full bg-white/5 border border-blue-500 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => setIsAddingCustomCategory(false)}
                    className="px-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 text-xs"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Website URL */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t(language, 'websiteUrl')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pl-8 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <Globe className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Username & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t(language, 'username')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pl-8 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <User className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t(language, 'email')}
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pl-8 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          {/* Mobile Number (Optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t(language, 'mobileNumber')}
            </label>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="+8801700000000"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pl-8 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
              <Phone className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Password with Strength & Generator */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                {t(language, 'password')} *
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleGenerateInlinePassword}
                  className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium"
                >
                  <RefreshCw className="w-3 h-3" />
                  Auto-Generate
                </button>
              </div>
            </div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Strong Password"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pl-8 pr-16 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
              />
              <Lock className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter Bar */}
            {password && (
              <div className="mt-2 p-2.5 rounded-xl bg-black/20 border border-white/5 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">{t(language, 'strengthScore')}:</span>
                  <span className="font-semibold" style={{ color: strength.color }}>
                    {strength.label} ({strength.score}%)
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${strength.score}%`, backgroundColor: strength.color }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-400">
                  Estimated crack time: <span className="text-slate-200 font-mono">{strength.crackTimeText}</span>
                </p>
              </div>
            )}
          </div>

          {/* Password History (If editing) */}
          {accountToEdit && accountToEdit.passwordHistory && accountToEdit.passwordHistory.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <History className="w-3.5 h-3.5" />
                <span>Password History ({accountToEdit.passwordHistory.length})</span>
              </button>

              {showHistory && (
                <div className="mt-2 p-2 rounded-xl bg-black/40 border border-white/10 space-y-1 max-h-32 overflow-y-auto text-[11px]">
                  {accountToEdit.passwordHistory.map((h, i) => (
                    <div key={i} className="flex justify-between items-center text-slate-400 font-mono py-1 border-b border-white/5 last:border-0">
                      <span>{h.password}</span>
                      <span className="text-[9px] text-slate-500">
                        {new Date(h.changedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tags & Favorite Option */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                {t(language, 'tags')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="personal, work, social"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 pl-8 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <Tag className="w-4 h-4 text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                  className="w-4 h-4 rounded bg-white/5 border-white/10 text-blue-600 focus:ring-blue-500"
                />
                <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-400 fill-amber-400' : 'text-slate-500'}`} />
                <span>{t(language, 'favoriteOption')}</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              {t(language, 'notes')}
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Security questions, recovery codes, remarks..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 resize-none"
            ></textarea>
          </div>

          {/* Submit Button */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-300 border border-white/10 transition"
            >
              {t(language, 'cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-lg shadow-blue-900/30 transition"
            >
              {t(language, 'saveChanges')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
