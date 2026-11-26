import React, { useState } from 'react';
import { Award, CheckCircle2, Lock, Sparkles } from 'lucide-react';
import { CHARACTER_LIST } from '../../data/characters';
import { ACHIEVEMENTS } from '../../data/achievements';
import { useGameStore } from '../../store/useGameStore';
import { soundEngine } from '../../utils/audio';

export const CollectionScreen: React.FC = () => {
  const [subTab, setSubTab] = useState<'pets' | 'achievements'>('pets');
  const currentCharId = useGameStore((s) => s.characterId);
  const level = useGameStore((s) => s.level);
  const unlockedCharacters = useGameStore((s) => s.unlockedCharacters);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievements);
  const switchCharacter = useGameStore((s) => s.switchCharacter);

  return (
    <div className="mx-auto flex h-full w-full max-w-5xl flex-col overflow-hidden px-3 pb-2 sm:px-6">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-xl font-bold text-cocoa sm:text-2xl">
            도감 & 업적
          </h2>
          <p className="text-xs text-cocoa-light">
            5종의 개성 넘치는 펫과 진화 단계, 집사 업적을 확인하세요.
          </p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => {
              soundEngine.play('click');
              setSubTab('pets');
            }}
            className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition ${
              subTab === 'pets' ? 'bg-cocoa text-white shadow-pill' : 'bg-white/85 text-cocoa'
            }`}
          >
            캐릭터 도감 ({unlockedCharacters.length}/5)
          </button>
          <button
            onClick={() => {
              soundEngine.play('click');
              setSubTab('achievements');
            }}
            className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition ${
              subTab === 'achievements' ? 'bg-cocoa text-white shadow-pill' : 'bg-white/85 text-cocoa'
            }`}
          >
            업적 ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1">
        {subTab === 'pets' ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {CHARACTER_LIST.map((c) => {
              const isCurrent = c.id === currentCharId;
              const isUnlocked = unlockedCharacters.includes(c.id);
              return (
                <div
                  key={c.id}
                  className={`glass-panel flex flex-col justify-between rounded-3xl p-5 shadow-soft ${
                    isCurrent ? 'ring-2 ring-peach-dark' : ''
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-2xl text-3xl shadow-inner"
                          style={{ backgroundColor: c.colors.bgTint }}
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
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-display text-lg font-bold text-cocoa">{c.name}</h3>
                            <span className="rounded-full bg-cream-dark px-2 py-0.5 text-[10px] font-bold text-cocoa">
                              {c.species}
                            </span>
                            <span className="rounded-full bg-lavender-light px-2 py-0.5 text-[10px] font-extrabold text-cocoa">
                              {c.rarity}
                            </span>
                          </div>
                          <p className="text-xs font-semibold text-cocoa-light">{c.jobTitle}</p>
                        </div>
                      </div>

                      {isCurrent ? (
                        <span className="rounded-full bg-peach-light px-3 py-1 text-[11px] font-extrabold text-cocoa">
                          함께 사는 중
                        </span>
                      ) : (
                        <button
                          onClick={() => switchCharacter(c.id)}
                          className="rounded-2xl bg-cocoa px-3.5 py-2 text-xs font-extrabold text-white shadow-pill transition hover:brightness-110 active:scale-95"
                        >
                          {isUnlocked ? '교체하기' : '초대하기'}
                        </button>
                      )}
                    </div>

                    <p className="mt-3 text-xs leading-relaxed text-cocoa">{c.personality}</p>

                    {/* Evolution Tree */}
                    <div className="mt-3.5 rounded-2xl bg-white/80 p-3">
                      <div className="mb-2 flex items-center gap-1 text-[11px] font-extrabold text-cocoa-light">
                        <Sparkles className="h-3.5 w-3.5 text-amber-500" />
                        진화 단계 로드맵
                      </div>
                      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                        {c.evolutions.map((evo) => {
                          const reached = isCurrent && level >= evo.minLevel;
                          return (
                            <div
                              key={evo.stage}
                              className={`rounded-xl px-2 py-1.5 text-center ${
                                reached ? 'bg-mint-light/70 text-cocoa' : 'bg-cream-light text-cocoa-muted'
                              }`}
                            >
                              <div className="text-[10px] font-extrabold">Lv.{evo.minLevel}+</div>
                              <div className="truncate text-[11px] font-bold">{evo.title}</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ACHIEVEMENTS.map((ach) => {
              const done = unlockedAchievements.includes(ach.id);
              return (
                <div
                  key={ach.id}
                  className={`glass-panel flex items-center justify-between gap-3 rounded-3xl p-4 shadow-soft ${
                    done ? 'bg-white/95' : 'opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${
                        done ? 'bg-amber-100' : 'bg-cream-dark'
                      }`}
                    >
                      {done ? ach.icon : <Lock className="h-5 w-5 text-cocoa-muted" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-sm font-extrabold text-cocoa">{ach.title}</h3>
                        {done && <CheckCircle2 className="h-4 w-4 text-mint-dark" />}
                      </div>
                      <p className="text-xs text-cocoa-light">{ach.description}</p>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-xs font-extrabold text-amber-700">
                    +{ach.rewardCoins}
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
