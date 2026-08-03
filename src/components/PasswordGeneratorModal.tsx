import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X,
  Copy,
  Check,
  RefreshCw,
  KeyRound,
  Sliders,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { generatePassword, evaluatePasswordStrength } from '../lib/crypto';
import { PasswordGeneratorOptions } from '../types';
import { t } from '../lib/i18n';

interface PasswordGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: 'bn' | 'en';
  onCopyToast: (msg: string) => void;
}

export const PasswordGeneratorModal: React.FC<PasswordGeneratorModalProps> = ({
  isOpen,
  onClose,
  language,
  onCopyToast,
}) => {
  const [options, setOptions] = useState<PasswordGeneratorOptions>({
    length: 16,
    useUppercase: true,
    useLowercase: true,
    useNumbers: true,
    useSymbols: true,
    excludeAmbiguous: false,
    mode: 'random',
    wordCount: 4,
    wordSeparator: '-',
  });

  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const handleRegenerate = () => {
    const newPass = generatePassword(options);
    setGeneratedPassword(newPass);
    setCopied(false);
  };

  useEffect(() => {
    if (isOpen) {
      handleRegenerate();
    }
  }, [isOpen, options]);

  if (!isOpen) return null;

  const strength = evaluatePasswordStrength(generatedPassword);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPassword);
    setCopied(true);
    onCopyToast(t(language, 'passwordCopied'));
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A0C10]/80 backdrop-blur-md p-4 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-md glass rounded-2xl p-6 shadow-2xl text-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base text-white">{t(language, 'passwordGenerator')}</h2>
              <p className="text-xs text-slate-400">Create unbreakable cryptographically secure passwords</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Display Password Box */}
        <div className="bg-black/40 border border-white/10 rounded-xl p-4 mb-4 text-center">
          <div className="font-mono text-lg font-bold tracking-wider text-blue-400 break-all select-all min-h-[2.5rem] flex items-center justify-center">
            {generatedPassword}
          </div>

          <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/5">
            <button
              onClick={handleCopy}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-blue-900/30 transition"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Copied!' : 'Copy Password'}
            </button>
            <button
              onClick={handleRegenerate}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 transition"
              title="Regenerate"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Strength Rating */}
        <div className="p-3 rounded-xl bg-black/20 border border-white/5 mb-4 text-xs space-y-1.5">
          <div className="flex justify-between font-medium">
            <span className="text-slate-400">Strength:</span>
            <span style={{ color: strength.color }}>{strength.label} ({strength.score}%)</span>
          </div>
          <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full transition-all" style={{ width: `${strength.score}%`, backgroundColor: strength.color }}></div>
          </div>
          <p className="text-[10px] text-slate-400">
            Estimated crack time: <span className="text-slate-200 font-mono">{strength.crackTimeText}</span>
          </p>
        </div>

        {/* Options Controls */}
        <div className="space-y-4 text-xs">
          {/* Mode Switch */}
          <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setOptions({ ...options, mode: 'random' })}
              className={`py-1.5 rounded-lg font-medium transition ${
                options.mode === 'random' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Random String
            </button>
            <button
              onClick={() => setOptions({ ...options, mode: 'passphrase' })}
              className={`py-1.5 rounded-lg font-medium transition ${
                options.mode === 'passphrase' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Memorable Passphrase
            </button>
          </div>

          {options.mode === 'random' ? (
            <>
              {/* Length Slider */}
              <div>
                <div className="flex justify-between font-medium mb-1">
                  <span className="text-slate-300">Password Length:</span>
                  <span className="font-mono text-indigo-400 font-bold">{options.length} characters</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="48"
                  value={options.length}
                  onChange={(e) => setOptions({ ...options, length: Number(e.target.value) })}
                  className="w-full accent-indigo-500 cursor-pointer"
                />
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                  <input
                    type="checkbox"
                    checked={options.useUppercase}
                    onChange={(e) => setOptions({ ...options, useUppercase: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Uppercase (A-Z)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                  <input
                    type="checkbox"
                    checked={options.useLowercase}
                    onChange={(e) => setOptions({ ...options, useLowercase: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Lowercase (a-z)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                  <input
                    type="checkbox"
                    checked={options.useNumbers}
                    onChange={(e) => setOptions({ ...options, useNumbers: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Numbers (0-9)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                  <input
                    type="checkbox"
                    checked={options.useSymbols}
                    onChange={(e) => setOptions({ ...options, useSymbols: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Symbols (!@#$)</span>
                </label>
              </div>
            </>
          ) : (
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-slate-300">Word Count:</span>
                <span className="font-mono text-indigo-400 font-bold">{options.wordCount} words</span>
              </div>
              <input
                type="range"
                min="3"
                max="8"
                value={options.wordCount}
                onChange={(e) => setOptions({ ...options, wordCount: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
