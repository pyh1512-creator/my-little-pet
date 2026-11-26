import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User as UserIcon, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export const AuthModal: React.FC = () => {
  const showAuthModal = useAuthStore((s) => s.showAuthModal);
  const authModalMode = useAuthStore((s) => s.authModalMode);
  const loading = useAuthStore((s) => s.loading);
  const error = useAuthStore((s) => s.error);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);
  const setAuthModalMode = useAuthStore((s) => s.setAuthModalMode);
  const loginWithEmail = useAuthStore((s) => s.loginWithEmail);
  const signUpWithEmail = useAuthStore((s) => s.signUpWithEmail);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    if (authModalMode === 'login') {
      const ok = await loginWithEmail(email, password);
      if (ok) {
        setEmail('');
        setPassword('');
      }
    } else {
      const ok = await signUpWithEmail(email, password, nickname);
      if (ok) {
        setEmail('');
        setPassword('');
        setNickname('');
      }
    }
  };

  return (
    <AnimatePresence>
      {showAuthModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuthModal}
          className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/45 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-white bg-cream-light shadow-card"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-peach-light via-cream to-lavender-light px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white text-base shadow-sm">
                    🐾
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-bold text-cocoa">
                      {authModalMode === 'login' ? '집사 로그인' : '신규 집사 회원가입'}
                    </h3>
                    <p className="text-[11px] font-medium text-cocoa-light">
                      Firestore 클라우드 저장으로 펫 정보를 안전하게 보관하세요
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeAuthModal}
                  className="rounded-full p-1.5 text-cocoa-muted transition hover:bg-white/80"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Mode Switch Tabs */}
              <div className="mt-4 grid grid-cols-2 gap-1.5 rounded-2xl bg-white/70 p-1">
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition ${
                    authModalMode === 'login'
                      ? 'bg-cocoa text-white shadow-sm'
                      : 'text-cocoa-light hover:text-cocoa'
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  로그인
                </button>
                <button
                  type="button"
                  onClick={() => setAuthModalMode('signup')}
                  className={`flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition ${
                    authModalMode === 'signup'
                      ? 'bg-cocoa text-white shadow-sm'
                      : 'text-cocoa-light hover:text-cocoa'
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  회원가입
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 p-6">
              {error && (
                <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-600">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {authModalMode === 'signup' && (
                <div>
                  <label className="mb-1 block text-xs font-bold text-cocoa">집사 닉네임</label>
                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-muted" />
                    <input
                      type="text"
                      value={nickname}
                      onChange={(e) => setNickname(e.target.value)}
                      maxLength={16}
                      placeholder="예: 김집사"
                      className="w-full rounded-2xl border-2 border-cream-dark bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-cocoa outline-none transition focus:border-peach-dark"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-xs font-bold text-cocoa">이메일</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-muted" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@email.com"
                    className="w-full rounded-2xl border-2 border-cream-dark bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-cocoa outline-none transition focus:border-peach-dark"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-cocoa">비밀번호</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cocoa-muted" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자 이상 입력"
                    className="w-full rounded-2xl border-2 border-cream-dark bg-white py-2.5 pl-10 pr-4 text-sm font-semibold text-cocoa outline-none transition focus:border-peach-dark"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-2xl bg-gradient-to-r from-peach-dark to-peach py-3 text-sm font-extrabold text-white shadow-pill transition hover:brightness-105 active:scale-[0.98] disabled:opacity-60"
              >
                {loading
                  ? '처리 중...'
                  : authModalMode === 'login'
                  ? '이메일로 로그인'
                  : '회원가입 완료하기'}
              </button>

              <div className="relative flex items-center justify-center py-1">
                <div className="h-px flex-1 bg-cream-dark" />
                <span className="px-3 text-[11px] font-bold text-cocoa-muted">또는</span>
                <div className="h-px flex-1 bg-cream-dark" />
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => void loginWithGoogle()}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-cream-dark bg-white py-2.5 text-xs font-extrabold text-cocoa shadow-sm transition hover:bg-cream active:scale-[0.98] disabled:opacity-60"
              >
                <span className="text-base font-black text-blue-500">G</span>
                Google 계정으로 계속하기
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
