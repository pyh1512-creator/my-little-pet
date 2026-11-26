import React from 'react';
import { Home, ShoppingBag, BookOpen, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { ActiveTab } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';

const NAV_ITEMS: { id: ActiveTab; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'home', label: 'HOME', icon: Home },
  { id: 'shop', label: 'SHOP', icon: ShoppingBag },
  { id: 'collection', label: 'COLLECTION', icon: BookOpen },
  { id: 'mypage', label: 'MY PAGE', icon: UserCircle },
];

export const BottomNav: React.FC = () => {
  const activeTab = useGameStore((s) => s.activeTab);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  return (
    <nav className="z-20 shrink-0 px-3 pb-3 pt-1.5 sm:px-6 sm:pb-4">
      <div className="glass-panel mx-auto flex max-w-md items-center justify-around rounded-3xl p-1.5 shadow-card">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`relative flex flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl py-2 text-[11px] font-extrabold transition ${
                isActive ? 'text-cocoa' : 'text-cocoa-muted hover:text-cocoa'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 30 }}
                  className="absolute inset-0 rounded-2xl bg-peach-light/85 shadow-sm"
                />
              )}
              <Icon className={`relative z-10 h-4 w-4 sm:h-5 sm:w-5 ${isActive ? 'text-cocoa' : ''}`} />
              <span className="relative z-10 tracking-wide">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
