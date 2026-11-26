import React, { useEffect } from 'react';
import { useGameStore } from './store/useGameStore';
import { useAuthStore } from './store/useAuthStore';
import { AdoptionScreen } from './components/adoption/AdoptionScreen';
import { TopBar } from './components/layout/TopBar';
import { BottomNav } from './components/layout/BottomNav';
import { HomeScreen } from './components/home/HomeScreen';
import { ShopScreen } from './components/shop/ShopScreen';
import { CollectionScreen } from './components/collection/CollectionScreen';
import { MyPageScreen } from './components/mypage/MyPageScreen';
import { AbsurdEventModal } from './components/modals/AbsurdEventModal';
import { OverlayModals } from './components/modals/OverlayModals';
import { RoomDecorModal } from './components/modals/RoomDecorModal';
import { MinigameModal } from './components/minigames/MinigameModal';
import { AuthModal } from './components/modals/AuthModal';
import { soundEngine } from './utils/audio';

export const App: React.FC = () => {
  const adopted = useGameStore((s) => s.adopted);
  const activeTab = useGameStore((s) => s.activeTab);
  const tickTime = useGameStore((s) => s.tickTime);
  const triggerIdleChatter = useGameStore((s) => s.triggerIdleChatter);
  const initAuthListener = useAuthStore((s) => s.initAuthListener);

  // Initialize Firebase Auth & Firestore sync listener
  useEffect(() => {
    return initAuthListener();
  }, [initAuthListener]);

  // Unlock Web Audio on first user gesture
  useEffect(() => {
    const unlock = () => soundEngine.unlock();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
  }, []);

  // Real-time stat progression & spontaneous idle chatter
  useEffect(() => {
    if (!adopted) return;
    const statTimer = window.setInterval(() => {
      tickTime();
    }, 25000);

    const chatterTimer = window.setInterval(() => {
      triggerIdleChatter();
    }, 14000);

    return () => {
      clearInterval(statTimer);
      clearInterval(chatterTimer);
    };
  }, [adopted, tickTime, triggerIdleChatter]);

  if (!adopted) {
    return (
      <>
        <AdoptionScreen />
        <AuthModal />
        <OverlayModals />
      </>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-gradient-to-b from-cream-light via-cream to-peach-light/25">
      <TopBar />

      <main className="min-h-0 flex-1 overflow-hidden">
        {activeTab === 'home' && <HomeScreen />}
        {activeTab === 'shop' && <ShopScreen />}
        {activeTab === 'collection' && <CollectionScreen />}
        {activeTab === 'mypage' && <MyPageScreen />}
      </main>

      <BottomNav />

      {/* Modals & Overlays */}
      <AbsurdEventModal />
      <RoomDecorModal />
      <MinigameModal />
      <AuthModal />
      <OverlayModals />
    </div>
  );
};

export default App;
