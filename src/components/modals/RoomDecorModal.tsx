import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Palette, Sofa, Shirt } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { SHOP_ITEM_MAP } from '../../data/items';
import { RoomSettings } from '../../types/game';

const WALLPAPERS: { id: RoomSettings['wallpaper']; label: string; color: string }[] = [
  { id: 'cream', label: '크림 버터', color: '#F6EDE4' },
  { id: 'mint', label: '파스텔 민트', color: '#A8CBB9' },
  { id: 'lavender', label: '소프트 라벤더', color: '#A9BCE0' },
  { id: 'peach', label: '코지 피치', color: '#F4B9AE' },
];

export const RoomDecorModal: React.FC = () => {
  const showRoomModal = useGameStore((s) => s.showRoomModal);
  const setShowRoomModal = useGameStore((s) => s.setShowRoomModal);
  const room = useGameStore((s) => s.room);
  const inventory = useGameStore((s) => s.inventory);
  const toggleFurniture = useGameStore((s) => s.toggleFurniture);
  const toggleOutfit = useGameStore((s) => s.toggleOutfit);
  const setWallpaper = useGameStore((s) => s.setWallpaper);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  // Owned furniture/decor + default rug
  const ownedFurnitureIds = Array.from(
    new Set([
      'decor_rug',
      ...inventory
        .map((i) => SHOP_ITEM_MAP[i.itemId])
        .filter((it) => it && (it.category === 'furniture' || it.category === 'decor'))
        .map((it) => it.id),
    ])
  );

  const ownedOutfitIds = inventory
    .map((i) => SHOP_ITEM_MAP[i.itemId])
    .filter((it) => it && it.category === 'outfit')
    .map((it) => it.id);

  return (
    <AnimatePresence>
      {showRoomModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-cocoa/45 p-4 backdrop-blur-sm"
          onClick={() => setShowRoomModal(false)}
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-white bg-cream-light p-6 shadow-card"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl text-cocoa">3D 펫 룸 & 코디 꾸미기</h3>
              <button
                onClick={() => setShowRoomModal(false)}
                className="rounded-full p-1.5 text-cocoa-muted hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Wallpaper Selector */}
            <div className="mb-5">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-cocoa-light">
                <Palette className="h-3.5 w-3.5" /> 벽지 테마 선택
              </h4>
              <div className="grid grid-cols-4 gap-2">
                {WALLPAPERS.map((wp) => {
                  const active = room.wallpaper === wp.id;
                  return (
                    <button
                      key={wp.id}
                      onClick={() => setWallpaper(wp.id)}
                      className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 bg-white p-2.5 transition ${
                        active ? 'border-cocoa shadow-pill' : 'border-transparent'
                      }`}
                    >
                      <span
                        className="h-7 w-7 rounded-full border border-black/10"
                        style={{ backgroundColor: wp.color }}
                      />
                      <span className="text-[11px] font-bold text-cocoa">{wp.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Furniture & Decor */}
            <div className="mb-5">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-cocoa-light">
                <Sofa className="h-3.5 w-3.5" /> 보유 가구 & 장식 배치
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {ownedFurnitureIds.map((id) => {
                  const item = SHOP_ITEM_MAP[id];
                  if (!item) return null;
                  const placed = room.placedFurniture.includes(id);
                  return (
                    <button
                      key={id}
                      onClick={() => toggleFurniture(id)}
                      className={`flex items-center justify-between rounded-2xl border-2 px-3 py-2.5 text-left transition ${
                        placed
                          ? 'border-mint-dark bg-mint-light/40'
                          : 'border-transparent bg-white hover:bg-cream'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-xs font-bold text-cocoa">
                        <span className="text-lg">{item.icon}</span>
                        {item.name}
                      </span>
                      {placed && <Check className="h-4 w-4 text-mint-dark" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Outfits */}
            <div className="mb-4">
              <h4 className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-cocoa-light">
                <Shirt className="h-3.5 w-3.5" /> 3D 캐릭터 의상 장착
              </h4>
              {ownedOutfitIds.length === 0 ? (
                <div className="rounded-2xl bg-white p-4 text-center text-xs text-cocoa-muted">
                  보유한 의상이 아직 없어요. 상점에서 선글라스나 명품 목걸이를 구매해 보세요!
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {ownedOutfitIds.map((id) => {
                    const item = SHOP_ITEM_MAP[id];
                    if (!item) return null;
                    const worn = room.equippedOutfits.includes(id);
                    return (
                      <button
                        key={id}
                        onClick={() => toggleOutfit(id)}
                        className={`flex items-center justify-between rounded-2xl border-2 px-3 py-2.5 text-left transition ${
                          worn
                            ? 'border-peach-dark bg-peach-light/40'
                            : 'border-transparent bg-white hover:bg-cream'
                        }`}
                      >
                        <span className="flex items-center gap-2 text-xs font-bold text-cocoa">
                          <span className="text-lg">{item.icon}</span>
                          {item.name}
                        </span>
                        {worn && <Check className="h-4 w-4 text-peach-dark" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              onClick={() => {
                setShowRoomModal(false);
                setActiveTab('shop');
              }}
              className="w-full rounded-2xl bg-cocoa py-3 text-xs font-extrabold text-white shadow-pill transition hover:brightness-110"
            >
              상점에서 더 많은 가구·의상 구경하기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
