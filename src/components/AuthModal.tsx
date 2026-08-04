import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Shield, KeyRound, User, Lock, UserPlus, LogIn, AlertCircle, Eye, EyeOff, RotateCcw, CheckCircle2 } from 'lucide-react';
import { signUpUser, loginUser, resetAccountPassword, usernameToEmail } from '../lib/firebase';

interface AuthModalProps {
  language: 'bn' | 'en';
  onAuthSuccess: (masterPassword: string) => void;
}

type AuthMode = 'login' | 'signup' | 'recover';

export function AuthModal({ language, onAuthSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const validateUserId = (id: string): boolean => {
    const trimmed = id.trim();
    if (trimmed.length < 3) return false;
    return /^[a-zA-Z0-9_-]+$/.test(trimmed);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUserId = userId.trim();

    if (!cleanUserId || !password) {
      setErrorMsg(
        language === 'bn'
          ? 'অনুগ্রহ করে User ID এবং পাসওয়ার্ড প্রদান করুন।'
          : 'Please enter both User ID and Password.'
      );
      return;
    }

    if (!validateUserId(cleanUserId)) {
      setErrorMsg(
        language === 'bn'
          ? 'User ID অবশ্যই কমপক্ষে ৩ অক্ষরের হতে হবে এবং এতে শুধুমাত্র বর্ণ, সংখ্যা, ( _ ) ও ( - ) ব্যবহার করা যাবে।'
          : 'User ID must be at least 3 characters long (letters, numbers, _ and -).'
      );
      return;
    }

    if (password.length < 6) {
      setErrorMsg(
        language === 'bn'
          ? 'পাসওয়ার্ড অবশ্যই কমপক্ষে ৬ অক্ষরের হতে হবে।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }

    if ((mode === 'signup' || mode === 'recover') && password !== confirmPassword) {
      setErrorMsg(
        language === 'bn'
          ? 'পাসওয়ার্ড দুটি মিলছে না।'
          : 'Passwords do not match.'
      );
      return;
    }

    setLoading(true);
    const syntheticEmail = usernameToEmail(cleanUserId);

    try {
      if (mode === 'signup') {
        await signUpUser(syntheticEmail, password, cleanUserId);
        onAuthSuccess(password);
      } else if (mode === 'login') {
        await loginUser(syntheticEmail, password, cleanUserId);
        onAuthSuccess(password);
      } else if (mode === 'recover') {
        await resetAccountPassword(cleanUserId, password);
        setSuccessMsg(
          language === 'bn'
            ? 'অ্যাকাউন্ট পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে! নতুন পাসওয়ার্ড দিয়ে অ্যাকাউন্ট লগইন করুন।'
            : 'Account password reset successfully! Please login with your new password.'
        );
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        msg = language === 'bn' ? 'User ID অথবা পাসওয়ার্ড সঠিক নয়।' : 'Invalid User ID or Password.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = language === 'bn' ? 'এই User ID টি ইতিমধ্যেই নিবন্ধিত। অন্য আইডি বেছে নিন।' : 'This User ID is already registered. Please choose another.';
      } else if (err.code === 'auth/weak-password') {
        msg = language === 'bn' ? 'পাসওয়ার্ডটি অত্যন্ত দুর্বল (কমপক্ষে ৬ অক্ষর প্রয়োজন)।' : 'Password is too weak (at least 6 chars needed).';
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
            {mode === 'signup'
              ? language === 'bn'
                ? 'নতুন অ্যাকাউন্ট তৈরি করুন'
                : 'Create Account'
              : mode === 'recover'
              ? language === 'bn'
                ? 'অ্যাকাউন্ট পাসওয়ার্ড রিকভারি'
                : 'Recover Account Password'
              : language === 'bn'
                ? 'অ্যাকাউন্টে লগইন করুন'
                : 'Login to Account'}
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
            {mode === 'signup'
              ? language === 'bn'
                ? 'Username ও পাসওয়ার্ড দিয়ে একটি অ্যাকাউন্ট তৈরি করুন।'
                : 'Register with a Username and Password.'
              : mode === 'recover'
              ? language === 'bn'
                ? 'Username দিয়ে পাসওয়ার্ড দুটি লিখুন এবং রিকভার করুন।'
                : 'Enter your Username and set a new Password.'
              : language === 'bn'
                ? 'আপনার Username ও পাসওয়ার্ড দিয়ে লগইন করুন।'
                : 'Enter your Username and Password to log in.'}
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-tight">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* USER ID INPUT */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {language === 'bn' ? 'Username (ইউজারনেম)' : 'Username'}
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
              {language === 'bn' ? 'ইংরেজি অক্ষর, সংখ্যা, _ অথবা -' : 'Letters, numbers, _ or - only'}
            </p>
          </div>

          {/* PASSWORD INPUT */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              {mode === 'recover'
                ? language === 'bn'
                  ? 'নতুন পাসওয়ার্ড (New Password)'
                  : 'New Password'
                : language === 'bn'
                ? 'পাসওয়ার্ড (Password)'
                : 'Password'}
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
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

          {/* CONFIRM PASSWORD INPUT (For Sign Up & Password Recover) */}
          {(mode === 'signup' || mode === 'recover') && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {language === 'bn' ? 'পাসওয়ার্ড পুনরায় লিখুন (Confirm Password)' : 'Confirm Password'}
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
            ) : mode === 'signup' ? (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{language === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}</span>
              </>
            ) : mode === 'recover' ? (
              <>
                <RotateCcw className="w-4 h-4" />
                <span>{language === 'bn' ? 'পাসওয়ার্ড রিকভার ও রিসেট করুন' : 'Reset Password'}</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>{language === 'bn' ? 'লগইন করুন' : 'Login'}</span>
              </>
            )}
          </button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800" />
          </div>
        </div>

        {/* NAVIGATION / MODE SELECTOR LINKS */}
        <div className="flex flex-col gap-2 text-center text-xs">
          {mode === 'login' && (
            <>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
              >
                {language === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করতে চান? এখানে ক্লিক করুন' : "Don't have an account? Sign up"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('recover');
                  setErrorMsg('');
                  setSuccessMsg('');
                  setPassword('');
                  setConfirmPassword('');
                }}
                className="text-amber-400/80 hover:text-amber-300 transition-colors"
              >
                {language === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন? Password Recover করুন' : 'Forgot password? Recover Password'}
              </button>
            </>
          )}

          {(mode === 'signup' || mode === 'recover') && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg('');
                setSuccessMsg('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              {language === 'bn' ? 'ইতিমধ্যেই অ্যাকাউন্ট আছে? লগইন করুন' : 'Already have an account? Login'}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

