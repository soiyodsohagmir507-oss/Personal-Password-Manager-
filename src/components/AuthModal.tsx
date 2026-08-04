import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, KeyRound, User, Lock, UserPlus, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { signUpUser, loginUser, usernameToEmail } from '../lib/firebase';

interface AuthModalProps {
  language: 'bn' | 'en';
  onAuthSuccess: (masterPassword: string) => void;
}

export function AuthModal({ language, onAuthSuccess }: AuthModalProps) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUserId = (id: string): boolean => {
    const trimmed = id.trim();
    if (trimmed.length < 3) return false;
    // Allow alphanumeric, underscores, hyphens
    return /^[a-zA-Z0-9_-]+$/.test(trimmed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanUserId = userId.trim();

    if (!cleanUserId || !password) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে User ID এবং Master Password প্রদান করুন।'
          : 'Please enter both User ID and Master Password.'
      );
      return;
    }

    if (!validateUserId(cleanUserId)) {
      setErrorMsg(
        language === 'bn'
          ? 'User ID অবশ্যই কমপক্ষে ৩ অক্ষরের হতে হবে এবং এতে শুধুমাত্র বর্ণ, সংখ্যা, ( _ ) ও ( - ) ব্যবহার করা যাবে।'
          : 'User ID must be at least 3 characters and contain only letters, numbers, underscores, and hyphens.'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMsg(
        language === 'bn'
          ? 'Master Password অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : 'Master Password must be at least 6 characters long.'
      );
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg(
        language === 'bn'
          ? 'মাস্টার পাসওয়ার্ড দুটি মিলছে না।'
          : 'Master passwords do not match.'
      );
      return;
    }

    setLoading(true);
    const syntheticEmail = usernameToEmail(cleanUserId);

    try {
      if (isSignUp) {
        await signUpUser(syntheticEmail, password);
      } else {
        await loginUser(syntheticEmail, password);
      }
      onAuthSuccess(password);
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = language === 'bn' ? 'User ID অথবা Master Password সঠিক নয়।' : 'Invalid User ID or Master Password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = language === 'bn' ? 'এই User ID টি ইতিমধ্যেই নিবন্ধিত। অন্য আইডি বেছে নিন।' : 'This User ID is already registered. Please choose another.';
      } else if (err.code === 'auth/weak-password') {
        msg = language === 'bn' ? 'মাস্টার পাসওয়ার্ডটি অত্যন্ত দুর্বল।' : 'Master password is too weak.';
      }
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
      >
        {/* Subtle accent glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
            <Shield className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            {isSignUp
              ? language === 'bn'
                ? 'নতুন একাউন্ট তৈরি করুন'
                : 'Create Vault Account'
              : language === 'bn'
                ? 'ভল্ট একাউন্টে লগইন করুন'
                : 'Login to Your Vault'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            {isSignUp
              ? language === 'bn'
                ? 'একটি User ID এবং মাস্টার পাসওয়ার্ড তৈরি করে আপনার ব্যক্তিগত এনক্রিপ্টেড ভল্ট খুলুন।'
                : 'Create a User ID and Master Password to establish your private encrypted vault.'
              : language === 'bn'
                ? 'আপনার সংরক্ষিত তথ্য অ্যাক্সেস করতে User ID ও মাস্টার পাসওয়ার্ড ব্যবহার করুন।'
                : 'Enter your User ID and Master Password to unlock your saved data.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USER ID INPUT */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {language === 'bn' ? 'User ID (ইউজার আইডি)' : 'User ID'}
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="username"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={language === 'bn' ? 'উদাহরণ: sohag_123' : 'e.g. user_123'}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {language === 'bn' ? 'কেবলমাত্র ইংরেজি অক্ষর, সংখ্যা, _ অথবা -' : 'Letters, numbers, _ or - only'}
            </p>
          </div>

          {/* MASTER PASSWORD INPUT */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {language === 'bn' ? 'Master Password (মাস্টার পাসওয়ার্ড)' : 'Master Password'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* CONFIRM MASTER PASSWORD INPUT (For Sign Up) */}
          {isSignUp && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'bn' ? 'Master Password পুনরায় লিখুন (নিশ্চিত করুন)' : 'Confirm Master Password'}
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-10 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium text-sm rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isSignUp ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{language === 'bn' ? 'একাউন্ট নিশ্চিত ও সাইন আপ করুন' : 'Create Account & Vault'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{language === 'bn' ? 'লগইন করুন' : 'Login to Vault'}</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
        </div>

        <div className="text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setErrorMsg('');
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            {isSignUp
              ? language === 'bn'
                ? 'ইতিমধ্যেই একাউন্ট আছে? সাইন ইন / লগইন করুন'
                : 'Already have an account? Sign in'
              : language === 'bn'
                ? 'নতুন একাউন্ট খুলতে চান? রেজিস্টার / সাইন আপ করুন'
                : "Don't have an account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
