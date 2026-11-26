import React, { useState, useRef, useEffect } from 'react';
import {
  Coins,
  Settings,
  User,
  Sparkles,
  LogIn,
  UserPlus,
  LogOut,
  Cloud,
  CloudOff,
  RefreshCw,
  ChevronDown,
} from 'lucide-react';
import { useGameStore, getXpForNextLevel } from '../../store/useGameStore';
import { useAuthStore } from '../../store/useAuthStore';

export const TopBar: React.FC = () => {
  const coins = useGameStore((s) => s.coins);
  const level = useGameStore((s) => s.level);
  const xp = useGameStore((s) => s.xp);
  const setActiveTab = useGameStore((s) => s.setActiveTab);
  const setShowSettingsModal = useGameStore((s) => s.setShowSettingsModal);

  const user = useAuthStore((s) => s.user);
  const syncStatus = useAuthStore((s) => s.syncStatus);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const logout = useAuthStore((s) => s.logout);
  const syncNow = useAuthStore((s) => s.syncNow);

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const nextXp = getXpForNextLevel(level);
  const xpPercent = Math.min(100, Math.round((xp / nextXp) * 100));
  const displayName = user?.displayName || user?.email?.split('@')[0] || '집사';

  return (
    <header className="z-30 flex shrink-0 items-center justify-between gap-2 px-3 py-2.5 sm:px-6 sm:py-3">
      {/* Brand Logo */}
      <button
        onClick={() => setActiveTab('home')}
        className="flex items-center gap-2 rounded-2xl bg-white/85 px-3 py-1.5 shadow-pill transition hover:bg-white"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gradient-to-br from-peach to-peach-dark text-sm text-white">
          🐾
        </span>
        <div className="text-left leading-tight">
          <div className="font-display text-sm font-bold tracking-tight text-cocoa sm:text-base">
            MY LITTLE PET
          </div>
          <div className="hidden text-[10px] font-medium text-cocoa-muted sm:block">
            귀여운 줄만 알았지?
          </div>
        </div>
      </button>

      {/* Right Status Pills & Auth Menu */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Level & XP */}
        <div className="glass-pill hidden items-center gap-2 rounded-full px-3 py-1.5 shadow-pill md:flex">
          <div className="flex items-center gap-1 text-xs font-extrabold text-cocoa">
            <Sparkles className="h-3.5 w-3.5 text-lavender-dark" />
            <span>Lv.{level}</span>
          </div>
          <div className="h-2 w-14 overflow-hidden rounded-full bg-cream-dark">
            <div
              className="h-full rounded-full bg-gradient-to-r from-lavender to-lavender-dark transition-all duration-500"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Coins */}
        <div className="glass-pill flex items-center gap-1.5 rounded-full px-2.5 py-1.5 shadow-pill sm:px-3">
          <Coins className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-extrabold text-cocoa sm:text-sm">
            {coins.toLocaleString()}
          </span>
        </div>

        {/* Auth Menu (Login / Signup OR Logged-in Account Dropdown) */}
        {!user ? (
          <div className="flex items-center gap-1">
            <button
              onClick={() => openAuthModal('login')}
              className="glass-pill flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-extrabold text-cocoa shadow-pill transition hover:bg-white active:scale-95 sm:px-3"
            >
              <LogIn className="h-3.5 w-3.5 text-peach-dark" />
              <span>로그인</span>
            </button>
            <button
              onClick={() => openAuthModal('signup')}
              className="hidden items-center gap-1 rounded-full bg-cocoa px-3 py-1.5 text-xs font-extrabold text-white shadow-pill transition hover:brightness-110 active:scale-95 sm:flex"
            >
              <UserPlus className="h-3.5 w-3.5" />
              <span>회원가입</span>
            </button>
          </div>
        ) : (
          <div ref={menuRef} className="relative">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="glass-pill flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-extrabold text-cocoa shadow-pill transition hover:bg-white active:scale-95 sm:px-3"
            >
              {syncStatus === 'error' ? (
                <CloudOff className="h-3.5 w-3.5 text-rose-500" />
              ) : (
                <Cloud
                  className={`h-3.5 w-3.5 ${
                    syncStatus === 'syncing' ? 'animate-pulse text-lavender-dark' : 'text-mint-dark'
                  }`}
                />
              )}
              <span className="max-w-[72px] truncate sm:max-w-[110px]">{displayName}</span>
              <ChevronDown className="h-3.5 w-3.5 text-cocoa-muted" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-2xl border-2 border-white bg-cream-light p-2 shadow-card">
                <div className="mb-1.5 rounded-xl bg-white/80 px-3 py-2">
                  <div className="truncate text-xs font-extrabold text-cocoa">{displayName}</div>
                  <div className="truncate text-[10px] font-medium text-cocoa-muted">
                    {user.email}
                  </div>
                </div>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void syncNow();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-cocoa transition hover:bg-mint-light/50"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-mint-dark" />
                  Firestore 지금 저장
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveTab('mypage');
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-cocoa transition hover:bg-white"
                >
                  <User className="h-3.5 w-3.5 text-lavender-dark" />
                  마이페이지
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    void logout();
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-bold text-rose-600 transition hover:bg-rose-50"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  로그아웃
                </button>
              </div>
            )}
          </div>
        )}

        {/* Settings */}
        <button
          onClick={() => setShowSettingsModal(true)}
          aria-label="설정"
          className="glass-pill flex h-9 w-9 items-center justify-center rounded-full text-cocoa shadow-pill transition hover:bg-white active:scale-95"
        >
          <Settings className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
};
