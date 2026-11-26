import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, CheckCircle2, LogIn, UserPlus, LogOut } from 'lucide-react';
import { CHARACTER_LIST, CHARACTERS } from '../../data/characters';
import { CharacterId, PetAnimationState } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';
import { useAuthStore } from '../../store/useAuthStore';
import { PetCanvas } from '../three/PetCanvas';
import { PetCharacter3D } from '../three/PetCharacter3D';
import { soundEngine } from '../../utils/audio';

export const AdoptionScreen: React.FC = () => {
  const adoptPet = useGameStore((s) => s.adoptPet);
  const user = useAuthStore((s) => s.user);
  const openAuthModal = useAuthStore((s) => s.openAuthModal);
  const logout = useAuthStore((s) => s.logout);
  const [selectedId, setSelectedId] = useState<CharacterId>('corgi');
  const [petName, setPetName] = useState<string>(CHARACTERS.corgi.name);
  const [previewAnim, setPreviewAnim] = useState<PetAnimationState>('idle');
  const [isAdopting, setIsAdopting] = useState(false);

  const selected = CHARACTERS[selectedId];

  const handleSelect = (id: CharacterId) => {
    soundEngine.play('click');
    setSelectedId(id);
    setPetName(CHARACTERS[id].name);
    setPreviewAnim('happy');
    window.setTimeout(() => setPreviewAnim('idle'), 1400);
  };

  const handleAdopt = () => {
    if (isAdopting) return;
    soundEngine.play('levelup');
    setIsAdopting(true);
    setPreviewAnim('levelup');
    window.setTimeout(() => {
      adoptPet(selectedId, petName);
    }, 1800);
  };

  return (
    <div className="relative flex h-full w-full flex-col overflow-y-auto bg-gradient-to-b from-cream-light via-cream to-peach-light/30 px-4 py-4 md:px-8 md:py-6">
      {/* Top Auth Header Bar */}
      <div className="mx-auto mb-3 flex w-full max-w-6xl items-center justify-between">
        <div className="flex items-center gap-2 rounded-2xl bg-white/80 px-3 py-1.5 shadow-pill">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-gradient-to-br from-peach to-peach-dark text-xs text-white">
            🐾
          </span>
          <span className="font-display text-sm font-bold text-cocoa">MY LITTLE PET</span>
        </div>
        <div className="flex items-center gap-1.5">
          {!user ? (
            <>
              <button
                onClick={() => openAuthModal('login')}
                className="glass-pill flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-extrabold text-cocoa shadow-pill transition hover:bg-white active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5 text-peach-dark" />
                로그인
              </button>
              <button
                onClick={() => openAuthModal('signup')}
                className="flex items-center gap-1 rounded-full bg-cocoa px-3 py-1.5 text-xs font-extrabold text-white shadow-pill transition hover:brightness-110 active:scale-95"
              >
                <UserPlus className="h-3.5 w-3.5" />
                회원가입
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className="glass-pill rounded-full px-3 py-1.5 text-xs font-bold text-cocoa">
                ☁️ {user.displayName || user.email}
              </span>
              <button
                onClick={() => void logout()}
                className="glass-pill flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold text-rose-600 transition hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5 text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-4 py-1.5 text-xs font-bold tracking-wider text-cocoa shadow-pill">
            <Sparkles className="h-3.5 w-3.5 text-peach-dark" />
            MY LITTLE PET · 귀여운 줄만 알았지?
          </span>
          <h1 className="mt-3 font-display text-2xl font-bold text-cocoa sm:text-4xl">
            축하합니다. 당신은 이제 집사가 되었습니다.
          </h1>
          <p className="mt-1.5 text-sm font-medium text-cocoa-light sm:text-base">
            다만 이 친구가 당신 말을 들을지는 모르겠습니다.
          </p>
        </motion.div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: 3D Preview Stage */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel relative flex min-h-[300px] flex-col overflow-hidden rounded-3xl p-4 shadow-card sm:min-h-[380px] lg:col-span-6 lg:min-h-[460px]"
            style={{ backgroundColor: `${selected.colors.bgTint}CC` }}
          >
            <div className="flex items-center justify-between">
              <div>
                <span className="rounded-full bg-white/85 px-3 py-1 text-xs font-bold text-cocoa">
                  {selected.species} · {selected.rarity}
                </span>
                <h2 className="mt-1.5 font-display text-2xl text-cocoa">{selected.name}</h2>
              </div>
              <span className="rounded-2xl bg-white/80 px-3 py-1.5 text-xs font-semibold text-cocoa-light">
                3D 캐릭터를 클릭해 보세요!
              </span>
            </div>

            <div className="relative flex-1">
              <PetCanvas cameraPosition={[0, 1.35, 3.6]} fov={36}>
                <group position={[0, -0.75, 0]}>
                  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
                    <circleGeometry args={[1.45, 36]} />
                    <meshStandardMaterial color="#FFFFFF" roughness={0.9} transparent opacity={0.75} />
                  </mesh>
                  <PetCharacter3D
                    characterId={selectedId}
                    animation={previewAnim}
                    onClick={() => {
                      soundEngine.play('react');
                      setPreviewAnim('happy');
                      window.setTimeout(() => setPreviewAnim('idle'), 1500);
                    }}
                  />
                </group>
              </PetCanvas>
            </div>

            <div className="mt-2 rounded-2xl bg-white/85 p-3 text-center text-sm font-medium text-cocoa shadow-sm">
              "{selected.tagline}"
            </div>
          </motion.div>

          {/* Right: Character Picker & Name Input */}
          <div className="flex flex-col justify-between gap-4 lg:col-span-6">
            {/* Character Cards */}
            <div className="glass-panel rounded-3xl p-4 shadow-soft">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-cocoa">입양할 반려동물 선택 (5종)</h3>
                <span className="text-xs text-cocoa-muted">나중에 도감에서 다른 친구도 만날 수 있어요</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {CHARACTER_LIST.map((c) => {
                  const active = c.id === selectedId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => handleSelect(c.id)}
                      className={`group flex flex-col items-center rounded-2xl border-2 p-2.5 transition-all ${
                        active
                          ? 'border-peach-dark bg-white shadow-pill scale-[1.03]'
                          : 'border-transparent bg-cream-light/80 hover:bg-white/80'
                      }`}
                    >
                      <div
                        className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full text-lg font-bold shadow-inner"
                        style={{ backgroundColor: c.colors.bgTint, border: `2px solid ${c.colors.primary}` }}
                      >
                        {c.id === 'corgi'
                          ? '🐶'
                          : c.id === 'cat'
                          ? '🐱'
                          : c.id === 'duck'
                          ? '🦆'
                          : c.id === 'rabbit'
                          ? '🐰'
                          : '🐻'}
                      </div>
                      <span className="text-xs font-bold text-cocoa">{c.name}</span>
                      <span className="text-[10px] text-cocoa-muted">{c.species}</span>
                    </button>
                  );
                })}
              </div>

              {/* Character Detail Box */}
              <div className="mt-4 space-y-2.5 rounded-2xl bg-white/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-lavender-light px-3 py-1 text-xs font-bold text-cocoa">
                    직업: {selected.jobTitle}
                  </span>
                  <span className="text-xs font-semibold text-cocoa-light">
                    기본 자존감 {selected.baseStats.ego} · 게으름 {selected.baseStats.laziness}
                  </span>
                </div>
                <p className="text-sm leading-relaxed text-cocoa">{selected.personality}</p>
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="rounded-xl bg-mint-light/50 px-3 py-2">
                    <span className="font-bold text-cocoa">좋아하는 음식:</span>{' '}
                    <span className="text-cocoa-light">{selected.favoriteFood}</span>
                  </div>
                  <div className="rounded-xl bg-peach-light/50 px-3 py-2">
                    <span className="font-bold text-cocoa">싫어하는 음식:</span>{' '}
                    <span className="text-cocoa-light">{selected.dislikedFood}</span>
                  </div>
                </div>
                <p className="text-xs text-cocoa-muted">🌱 성장 특성: {selected.growthTrait}</p>
              </div>
            </div>

            {/* Name & Adopt CTA */}
            <div className="glass-panel rounded-3xl p-4 shadow-soft">
              <label className="mb-1.5 block text-xs font-bold text-cocoa">
                반려동물 이름 짓기
              </label>
              <div className="flex flex-col gap-3 sm:flex-row">
                <input
                  type="text"
                  maxLength={12}
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  placeholder="이름을 입력하세요"
                  className="flex-1 rounded-2xl border-2 border-cream-dark bg-white px-4 py-3 text-sm font-bold text-cocoa outline-none transition focus:border-peach-dark"
                />
                <button
                  onClick={handleAdopt}
                  disabled={isAdopting}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-peach-dark to-peach px-6 py-3.5 text-sm font-extrabold text-white shadow-pill transition hover:brightness-105 active:scale-95 disabled:opacity-70"
                >
                  <Heart className="h-4 w-4 fill-white" />
                  {isAdopting ? '입양 계약 체결 중...' : '입양하기'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special Adoption Celebration Overlay */}
      <AnimatePresence>
        {isAdopting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/35 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.7, rotate: -6 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', bounce: 0.45 }}
              className="mx-4 max-w-sm rounded-3xl bg-cream-light p-7 text-center shadow-card"
            >
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-mint-light text-3xl">
                <CheckCircle2 className="h-9 w-9 text-mint-dark" />
              </div>
              <div className="inline-block rounded-full bg-peach-light px-3 py-1 text-xs font-extrabold text-cocoa">
                집사 취직 확정 도장 쾅!
              </div>
              <h3 className="mt-3 font-display text-2xl text-cocoa">
                {petName || selected.name} 입양 완료!
              </h3>
              <p className="mt-2 text-sm text-cocoa-light">
                "{selected.evolutions[0].unlockDialogue}"
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
