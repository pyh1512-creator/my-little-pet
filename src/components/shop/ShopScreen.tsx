import React, { useState } from 'react';
import { Coins, Sparkles, Check, Package } from 'lucide-react';
import { SHOP_ITEMS, SHOP_ITEM_MAP } from '../../data/items';
import { ShopCategory } from '../../types/game';
import { useGameStore } from '../../store/useGameStore';
import { soundEngine } from '../../utils/audio';

const CATEGORIES: { id: ShopCategory | 'inventory'; label: string; emoji: string }[] = [
  { id: 'food', label: '음식', emoji: '🍖' },
  { id: 'toy', label: '장난감', emoji: '🎾' },
  { id: 'furniture', label: '가구', emoji: '🛋️' },
  { id: 'outfit', label: '의상', emoji: '🕶️' },
  { id: 'decor', label: '장식', emoji: '🪴' },
  { id: 'inventory', label: '인벤토리', emoji: '🎒' },
];

export const ShopScreen: React.FC = () => {
  const [tab, setTab] = useState<ShopCategory | 'inventory'>('food');
  const coins = useGameStore((s) => s.coins);
  const inventory = useGameStore((s) => s.inventory);
  const room = useGameStore((s) => s.room);
  const buyItem = useGameStore((s) => s.buyItem);
  const useInventoryItem = useGameStore((s) => s.useInventoryItem);
  const setActiveTab = useGameStore((s) => s.setActiveTab);

  const getOwnedQty = (itemId: string) =>
    inventory.find((i) => i.itemId === itemId)?.quantity ?? 0;

  const filteredItems = SHOP_ITEMS.filter((i) => i.category === tab);

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden px-3 pb-2 sm:px-6">
      {/* Header & Category Tabs */}
      <div className="mb-3 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-cocoa sm:text-2xl">
            프리미엄 펫 상점
          </h2>
          <p className="text-xs text-cocoa-light">
            황당하지만 퀄리티는 확실한 간식, 3D 가구, 명품 의상을 만나보세요.
          </p>
        </div>
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((c) => {
            const active = tab === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  soundEngine.play('click');
                  setTab(c.id);
                }}
                className={`flex shrink-0 items-center gap-1 rounded-2xl px-3.5 py-2 text-xs font-extrabold transition ${
                  active
                    ? 'bg-cocoa text-white shadow-pill'
                    : 'bg-white/85 text-cocoa hover:bg-white'
                }`}
              >
                <span>{c.emoji}</span>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto pr-1">
        {tab === 'inventory' ? (
          inventory.length === 0 ? (
            <div className="glass-panel flex h-60 flex-col items-center justify-center rounded-3xl text-center">
              <Package className="mb-2 h-10 w-10 text-cocoa-muted" />
              <p className="font-bold text-cocoa">인벤토리가 비어 있습니다.</p>
              <p className="mt-1 text-xs text-cocoa-light">상점에서 간식이나 3D 가구를 구매해 보세요!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {inventory.map((entry) => {
                const item = SHOP_ITEM_MAP[entry.itemId];
                if (!item) return null;
                const isEquipped =
                  room.placedFurniture.includes(item.id) || room.equippedOutfits.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="glass-panel flex flex-col justify-between rounded-3xl p-4 shadow-soft"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-2xl shadow-inner">
                          {item.icon}
                        </span>
                        <span className="rounded-full bg-mint-light px-2.5 py-1 text-[11px] font-extrabold text-cocoa">
                          {item.consumable ? `보유 ${entry.quantity}개` : isEquipped ? '적용 중' : '보관 중'}
                        </span>
                      </div>
                      <h3 className="mt-3 font-bold text-cocoa">{item.name}</h3>
                      <p className="mt-1 text-xs leading-relaxed text-cocoa-light">{item.description}</p>
                    </div>
                    <button
                      onClick={() => {
                        useInventoryItem(item.id);
                        if (item.consumable) setActiveTab('home');
                      }}
                      className={`mt-4 w-full rounded-2xl py-2.5 text-xs font-extrabold transition active:scale-95 ${
                        isEquipped
                          ? 'bg-cream-dark text-cocoa hover:bg-cream'
                          : 'bg-peach-dark text-white shadow-pill hover:brightness-105'
                      }`}
                    >
                      {item.consumable
                        ? '사용하기 (홈으로 이동)'
                        : isEquipped
                        ? '해제하기'
                        : '3D 룸/캐릭터에 적용하기'}
                    </button>
                  </div>
                );
              })}
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filteredItems.map((item) => {
              const owned = getOwnedQty(item.id);
              const permanentOwned = !item.consumable && owned > 0;
              const canAfford = coins >= item.price;

              return (
                <div
                  key={item.id}
                  className={`glass-panel flex flex-col justify-between rounded-3xl p-4 shadow-soft transition hover:shadow-card ${
                    item.isSpecial ? 'ring-2 ring-amber-300/70' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream text-2xl shadow-inner">
                        {item.icon}
                      </span>
                      <div className="flex flex-col items-end gap-1">
                        {item.isSpecial && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-extrabold text-amber-800">
                            <Sparkles className="h-3 w-3" />
                            SPECIAL
                          </span>
                        )}
                        {owned > 0 && (
                          <span className="rounded-full bg-mint-light/80 px-2 py-0.5 text-[10px] font-bold text-cocoa">
                            {item.consumable ? `보유 ${owned}` : '보유 중'}
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="mt-3 text-sm font-extrabold text-cocoa">{item.name}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-cocoa-light">
                      {item.description}
                    </p>
                    <p className="mt-1.5 rounded-xl bg-white/75 px-2.5 py-1.5 text-[11px] font-medium italic text-cocoa-muted">
                      {item.flavorText}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 text-sm font-extrabold text-cocoa">
                      <Coins className="h-4 w-4 text-amber-500" />
                      {item.price}
                    </div>
                    <button
                      onClick={() => buyItem(item.id)}
                      disabled={permanentOwned || !canAfford}
                      className={`flex items-center gap-1 rounded-2xl px-4 py-2 text-xs font-extrabold transition active:scale-95 ${
                        permanentOwned
                          ? 'bg-mint-light text-cocoa cursor-default'
                          : canAfford
                          ? 'bg-cocoa text-white shadow-pill hover:brightness-110'
                          : 'bg-cream-dark text-cocoa-muted cursor-not-allowed'
                      }`}
                    >
                      {permanentOwned ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> 구매 완료
                        </>
                      ) : canAfford ? (
                        '구매하기'
                      ) : (
                        '코인 부족'
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
