import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Gamepad2,
  Bath,
  Moon,
  Heart,
  Zap,
  Sofa,
  BarChart3,
  Package,
  Sparkles,
  Camera,
} from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { CHARACTERS, getEvolutionStage } from '../../data/characters';
import { SHOP_ITEM_MAP } from '../../data/items';
import { PetCanvas } from '../three/PetCanvas';
import { PetRoom3D } from '../three/PetRoom3D';
import { PetCharacter3D } from '../three/PetCharacter3D';
import { uploadImageToCloudinary } from '../../lib/cloudinary';
import { soundEngine } from '../../utils/audio';

interface StatBarProps {
  label: string;
  value: number;
  colorClass: string;
  emoji: string;
}

const StatBar: React.FC<StatBarProps> = ({ label, value, colorClass, emoji }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs font-bold text-cocoa">
      <span className="flex items-center gap-1">
        <span>{emoji}</span>
        {label}
      </span>
      <span className="text-cocoa-light">{value}</span>
    </div>
    <div className="h-2 w-full overflow-hidden rounded-full bg-cream-dark/70">
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export const HomeScreen: React.FC = () => {
  const characterId = useGameStore((s) => s.characterId);
  const petName = useGameStore((s) => s.petName);
  const level = useGameStore((s) => s.level);
  const stats = useGameStore((s) => s.stats);
  const animation = useGameStore((s) => s.animation);
  const speechText = useGameStore((s) => s.speechText);
  const room = useGameStore((s) => s.room);
  const inventory = useGameStore((s) => s.inventory);
  const growthLog = useGameStore((s) => s.growthLog);
  const showAbsurdStats = useGameStore((s) => s.settings.showAbsurdStats);

  const clickPet = useGameStore((s) => s.clickPet);
  const petCharacter = useGameStore((s) => s.petCharacter);
  const feedPet = useGameStore((s) => s.feedPet);
  const playWithPet = useGameStore((s) => s.playWithPet);
  const washPet = useGameStore((s) => s.washPet);
  const sleepPet = useGameStore((s) => s.sleepPet);
  const useInventoryItem = useGameStore((s) => s.useInventoryItem);
  const triggerRandomEvent = useGameStore((s) => s.triggerRandomEvent);
  const setShowMinigameHub = useGameStore((s) => s.setShowMinigameHub);
  const setShowRoomModal = useGameStore((s) => s.setShowRoomModal);
  const addPhoto = useGameStore((s) => s.addPhoto);
  const pushToast = useGameStore((s) => s.pushToast);

  const [mobileStatsOpen, setMobileStatsOpen] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const roomStageRef = useRef<HTMLDivElement>(null);

  const handleCaptureSnapshot = async () => {
    if (capturing) return;
    const canvas = roomStageRef.current?.querySelector('canvas');
    if (!canvas) return;

    soundEngine.play('click');
    setCapturing(true);
    try {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), 'image/png')
      );
      if (!blob) throw new Error('3D 화면 캡처에 실패했습니다.');

      const result = await uploadImageToCloudinary(blob, {
        folder: 'my-little-pet/snapshots',
        filename: `${petName}-lv${level}-${Date.now()}.png`,
      });
      addPhoto({
        url: result.secureUrl,
        caption: `${petName} (Lv.${level} · ${evo.title})`,
        source: 'snapshot',
      });
      pushToast({
        title: '3D 스냅샷 저장 완료!',
        subtitle: 'Cloudinary 추억 앨범(MY PAGE)에 보관되었습니다.',
        icon: '📸',
        tone: 'mint',
      });
    } catch (err) {
      soundEngine.play('angry');
      pushToast({
        title: '스냅샷 업로드 실패',
        subtitle: err instanceof Error ? err.message : '잠시 후 다시 시도해 주세요.',
        icon: '⚠️',
        tone: 'peach',
      });
    } finally {
      setCapturing(false);
    }
  };

  const char = CHARACTERS[characterId];
  const evo = getEvolutionStage(characterId, level);

  const consumableItems = inventory
    .map((entry) => ({ entry, item: SHOP_ITEM_MAP[entry.itemId] }))
    .filter((x) => x.item && x.item.consumable && x.entry.quantity > 0);

  return (
    <div className="relative flex h-full w-full flex-col gap-3 overflow-hidden px-3 pb-1 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-4">
      {/* LEFT PANEL (Desktop): Pet Core & Absurd Stats */}
      <aside className="hidden lg:col-span-3 lg:flex lg:flex-col lg:gap-3 lg:overflow-y-auto lg:pr-1">
        <div className="glass-panel rounded-3xl p-4 shadow-soft">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-cocoa-light">
              기본 컨디션
            </h3>
            <span className="rounded-full bg-mint-light/70 px-2.5 py-0.5 text-[10px] font-bold text-cocoa">
              실시간 관리
            </span>
          </div>
          <div className="space-y-2.5">
            <StatBar label="배고픔(포만감)" value={stats.hunger} colorClass="bg-peach-dark" emoji="🍖" />
            <StatBar label="행복도" value={stats.happiness} colorClass="bg-mint-dark" emoji="😊" />
            <StatBar label="에너지" value={stats.energy} colorClass="bg-lavender-dark" emoji="⚡" />
            <StatBar label="청결도" value={stats.cleanliness} colorClass="bg-sky-400" emoji="🫧" />
          </div>
        </div>

        {showAbsurdStats && (
          <div className="glass-panel rounded-3xl p-4 shadow-soft">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-cocoa-light">
                병맛 전용 지수
              </h3>
              <span className="rounded-full bg-peach-light px-2.5 py-0.5 text-[10px] font-bold text-cocoa">
                주의 요망
              </span>
            </div>
            <div className="space-y-2.5">
              <StatBar label="자존감" value={stats.ego} colorClass="bg-amber-400" emoji="👑" />
              <StatBar label="삐짐 지수" value={stats.sulkiness} colorClass="bg-rose-400" emoji="💢" />
              <StatBar label="집사 신뢰도" value={stats.trust} colorClass="bg-emerald-400" emoji="🤝" />
              <StatBar label="게으름" value={stats.laziness} colorClass="bg-indigo-300" emoji="🦥" />
              <StatBar label="사회적 평판" value={stats.reputation} colorClass="bg-violet-400" emoji="📢" />
            </div>
          </div>
        )}
      </aside>

      {/* CENTER STAGE: 3D Pet Room + Speech Bubble + Care Actions */}
      <section className="relative flex min-h-0 flex-1 flex-col gap-2.5 lg:col-span-6">
        {/* 3D Room Card */}
        <div
          ref={roomStageRef}
          className="relative flex-1 overflow-hidden rounded-3xl border-2 border-white/80 bg-gradient-to-b from-lavender-light/30 via-cream-light to-cream-dark/30 shadow-card"
        >
          {/* Top-left Pet Badge */}
          <div className="pointer-events-none absolute left-3 top-3 z-10 flex flex-wrap items-center gap-1.5 sm:left-4 sm:top-4">
            <div className="glass-pill flex items-center gap-2 rounded-2xl px-3 py-1.5 shadow-pill">
              <span className="font-display text-sm font-bold text-cocoa sm:text-base">
                {petName}
              </span>
              <span className="rounded-full bg-peach-light px-2 py-0.5 text-[10px] font-extrabold text-cocoa">
                Lv.{level}
              </span>
            </div>
            <div className="glass-pill hidden rounded-2xl px-2.5 py-1.5 text-[11px] font-bold text-cocoa-light shadow-pill sm:block">
              {evo.title}
            </div>
          </div>

          {/* Top-right Quick Floating Buttons */}
          <div className="absolute right-3 top-3 z-10 flex items-center gap-1.5 sm:right-4 sm:top-4">
            <button
              onClick={() => setMobileStatsOpen((v) => !v)}
              className="glass-pill flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-cocoa shadow-pill lg:hidden"
            >
              <BarChart3 className="h-3.5 w-3.5 text-lavender-dark" />
              상태
            </button>
            <button
              onClick={() => void handleCaptureSnapshot()}
              disabled={capturing}
              className="glass-pill flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-cocoa shadow-pill transition hover:bg-white active:scale-95 disabled:opacity-60"
              title="3D 스냅샷 촬영 (Cloudinary 저장)"
            >
              <Camera className={`h-3.5 w-3.5 text-lavender-dark ${capturing ? 'animate-pulse' : ''}`} />
              <span className="hidden sm:inline">{capturing ? '저장 중' : '촬영'}</span>
            </button>
            <button
              onClick={() => setShowRoomModal(true)}
              className="glass-pill flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-cocoa shadow-pill transition hover:bg-white active:scale-95"
              title="펫 룸 꾸미기"
            >
              <Sofa className="h-3.5 w-3.5 text-mint-dark" />
              <span className="hidden sm:inline">방 꾸미기</span>
            </button>
            <button
              onClick={() => setShowMinigameHub(true)}
              className="glass-pill flex items-center gap-1 rounded-full px-2.5 py-1.5 text-xs font-bold text-cocoa shadow-pill transition hover:bg-white active:scale-95"
              title="코미디 미니게임"
            >
              <Gamepad2 className="h-3.5 w-3.5 text-peach-dark" />
              <span className="hidden sm:inline">미니게임</span>
            </button>
            <button
              onClick={() => triggerRandomEvent(true)}
              className="flex items-center gap-1 rounded-full bg-peach-dark px-2.5 py-1.5 text-xs font-extrabold text-white shadow-pill transition hover:brightness-105 active:scale-95"
              title="황당한 이벤트 발생"
            >
              <Zap className="h-3.5 w-3.5 fill-white" />
              <span className="hidden sm:inline">돌발 사건</span>
            </button>
          </div>

          {/* Mobile Compact Status Pills */}
          <div className="pointer-events-none absolute left-3 top-14 z-10 flex gap-1.5 lg:hidden">
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-cocoa shadow-sm">
              🍖 {stats.hunger}
            </span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-cocoa shadow-sm">
              😊 {stats.happiness}
            </span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-cocoa shadow-sm">
              ⚡ {stats.energy}
            </span>
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-cocoa shadow-sm">
              💢 {stats.sulkiness}
            </span>
          </div>

          {/* Mobile Expandable Stats Drawer */}
          <AnimatePresence>
            {mobileStatsOpen && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                className="glass-panel absolute inset-x-3 top-14 z-20 max-h-[65%] overflow-y-auto rounded-2xl p-3.5 shadow-card lg:hidden"
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-extrabold text-cocoa">
                    {evo.title} ({char.jobTitle})
                  </span>
                  <button
                    onClick={() => setMobileStatsOpen(false)}
                    className="text-xs font-bold text-cocoa-muted"
                  >
                    닫기
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  <StatBar label="배고픔" value={stats.hunger} colorClass="bg-peach-dark" emoji="🍖" />
                  <StatBar label="행복도" value={stats.happiness} colorClass="bg-mint-dark" emoji="😊" />
                  <StatBar label="에너지" value={stats.energy} colorClass="bg-lavender-dark" emoji="⚡" />
                  <StatBar label="청결도" value={stats.cleanliness} colorClass="bg-sky-400" emoji="🫧" />
                  <StatBar label="자존감" value={stats.ego} colorClass="bg-amber-400" emoji="👑" />
                  <StatBar label="삐짐" value={stats.sulkiness} colorClass="bg-rose-400" emoji="💢" />
                  <StatBar label="신뢰도" value={stats.trust} colorClass="bg-emerald-400" emoji="🤝" />
                  <StatBar label="게으름" value={stats.laziness} colorClass="bg-indigo-300" emoji="🦥" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 3D Scene */}
          <PetCanvas cameraPosition={[0, 1.85, 5.4]} fov={38} enableZoom>
            <PetRoom3D room={room}>
              <PetCharacter3D
                characterId={characterId}
                animation={animation}
                level={level}
                equippedOutfits={room.equippedOutfits}
                onClick={clickPet}
              />
            </PetRoom3D>
          </PetCanvas>

          {/* Floating Speech Bubble */}
          <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex justify-center sm:inset-x-6 sm:bottom-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={speechText}
                initial={{ opacity: 0, y: 8, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22 }}
                className="max-w-md rounded-2xl border border-white/90 bg-white/92 px-4 py-2.5 text-center text-xs font-bold leading-snug text-cocoa shadow-card sm:text-sm"
              >
                "{speechText}"
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Care Action Buttons Bar */}
        <div className="grid shrink-0 grid-cols-5 gap-2">
          <button
            onClick={() => feedPet()}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/90 py-2.5 text-cocoa shadow-pill transition hover:bg-peach-light/60 active:scale-95"
          >
            <Utensils className="h-5 w-5 text-peach-dark" />
            <span className="text-[11px] font-extrabold sm:text-xs">밥 주기</span>
          </button>
          <button
            onClick={() => playWithPet()}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/90 py-2.5 text-cocoa shadow-pill transition hover:bg-mint-light/60 active:scale-95"
          >
            <Sparkles className="h-5 w-5 text-mint-dark" />
            <span className="text-[11px] font-extrabold sm:text-xs">놀아주기</span>
          </button>
          <button
            onClick={() => washPet()}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/90 py-2.5 text-cocoa shadow-pill transition hover:bg-lavender-light/60 active:scale-95"
          >
            <Bath className="h-5 w-5 text-lavender-dark" />
            <span className="text-[11px] font-extrabold sm:text-xs">씻기기</span>
          </button>
          <button
            onClick={() => sleepPet()}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/90 py-2.5 text-cocoa shadow-pill transition hover:bg-indigo-100/70 active:scale-95"
          >
            <Moon className="h-5 w-5 text-indigo-400" />
            <span className="text-[11px] font-extrabold sm:text-xs">잠자기</span>
          </button>
          <button
            onClick={() => petCharacter()}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/90 py-2.5 text-cocoa shadow-pill transition hover:bg-rose-100/70 active:scale-95"
          >
            <Heart className="h-5 w-5 text-rose-400" />
            <span className="text-[11px] font-extrabold sm:text-xs">쓰다듬기</span>
          </button>
        </div>
      </section>

      {/* RIGHT PANEL (Desktop): Quick Inventory & Recent Log */}
      <aside className="hidden lg:col-span-3 lg:flex lg:flex-col lg:gap-3 lg:overflow-y-auto lg:pl-1">
        {/* Quick Consumable Bag */}
        <div className="glass-panel rounded-3xl p-4 shadow-soft">
          <div className="mb-2.5 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-cocoa-light">
              <Package className="h-3.5 w-3.5" />
              간식 · 장난감 가방
            </h3>
            <span className="text-[11px] font-bold text-cocoa-muted">클릭해서 바로 사용</span>
          </div>
          {consumableItems.length === 0 ? (
            <p className="rounded-2xl bg-cream-light/80 p-3 text-center text-xs text-cocoa-muted">
              보유한 간식/장난감이 없어요. 상점에서 구매해 보세요!
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {consumableItems.slice(0, 6).map(({ entry, item }) => (
                <button
                  key={item.id}
                  onClick={() => useInventoryItem(item.id)}
                  className="flex items-center gap-2 rounded-2xl bg-white/85 p-2 text-left shadow-sm transition hover:bg-peach-light/40 active:scale-95"
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[11px] font-bold text-cocoa">{item.name}</div>
                    <div className="text-[10px] font-semibold text-cocoa-muted">
                      보유 {entry.quantity}개
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Character Info & Recent Log */}
        <div className="glass-panel flex-1 rounded-3xl p-4 shadow-soft">
          <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-cocoa-light">
            오늘의 황당한 기록
          </h3>
          <div className="mb-3 rounded-2xl bg-white/75 p-3 text-xs">
            <div className="font-bold text-cocoa">{evo.title}</div>
            <div className="text-[11px] text-cocoa-light">{evo.subtitle}</div>
            <div className="mt-1.5 text-[11px] text-cocoa-muted">
              최애 간식: <span className="font-bold text-cocoa">{char.favoriteFood}</span>
            </div>
          </div>
          <div className="space-y-2">
            {growthLog.slice(0, 4).map((log) => (
              <div key={log.id} className="rounded-xl bg-cream-light/90 px-3 py-2">
                <div className="text-[11px] font-bold text-cocoa">{log.title}</div>
                <div className="truncate text-[10px] text-cocoa-light">{log.detail}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
};
