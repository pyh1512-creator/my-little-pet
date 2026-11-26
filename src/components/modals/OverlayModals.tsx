import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Music, RotateCcw, X, Sparkles, Clock } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

export const OverlayModals: React.FC = () => {
  const adopted = useGameStore((s) => s.adopted);
  const tutorialCompleted = useGameStore((s) => s.tutorialCompleted);
  const completeTutorial = useGameStore((s) => s.completeTutorial);

  const showSettingsModal = useGameStore((s) => s.showSettingsModal);
  const setShowSettingsModal = useGameStore((s) => s.setShowSettingsModal);
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetGame = useGameStore((s) => s.resetGame);

  const offlineSummaryMinutes = useGameStore((s) => s.offlineSummaryMinutes);
  const dismissOfflineSummary = useGameStore((s) => s.dismissOfflineSummary);

  const evolutionNotice = useGameStore((s) => s.evolutionNotice);
  const dismissEvolutionNotice = useGameStore((s) => s.dismissEvolutionNotice);

  const toasts = useGameStore((s) => s.toasts);
  const petName = useGameStore((s) => s.petName);

  const [tutStep, setTutStep] = useState(0);
  const [confirmReset, setConfirmReset] = useState(false);

  const tutorialSteps = [
    {
      emoji: '🐾',
      title: '3D 펫과 직접 놀아보세요!',
      desc: '중앙의 3D 캐릭터를 클릭하거나 드래그해서 돌려볼 수 있어요. 클릭할 때마다 황당한 대사와 애니메이션으로 반응합니다.',
    },
    {
      emoji: '🍖',
      title: '기본 상태 & 병맛 지수 관리',
      desc: '밥 주기, 놀아주기, 씻기기, 잠자기, 쓰다듬기로 돌봐주세요. 자존감·삐짐 지수·신뢰도에 따라 펫의 태도가 완전히 달라집니다!',
    },
    {
      emoji: '⚡',
      title: '돌발 사건 · 미니게임 · 방 꾸미기',
      desc: '퇴사 선언, 월급 요구 등 황당한 이벤트에 대처하고, 코미디 미니게임으로 코인을 벌어 3D 가구와 명품 선글라스를 장만해 보세요!',
    },
  ];

  return (
    <>
      {/* TOAST NOTIFICATIONS */}
      <div className="pointer-events-none fixed right-3 top-16 z-50 flex flex-col gap-2 sm:right-6">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40, scale: 0.94 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 30, scale: 0.94 }}
              className="pointer-events-auto flex items-center gap-2.5 rounded-2xl border border-white bg-white/95 px-4 py-2.5 shadow-card"
            >
              <span className="text-xl">{t.icon || '✨'}</span>
              <div>
                <div className="text-xs font-extrabold text-cocoa">{t.title}</div>
                {t.subtitle && <div className="text-[11px] text-cocoa-light">{t.subtitle}</div>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* TUTORIAL MODAL (Right after adoption) */}
      <AnimatePresence>
        {adopted && !tutorialCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-cocoa/45 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.92, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-sm rounded-3xl border-2 border-white bg-cream-light p-6 text-center shadow-card"
            >
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-peach-light/70 text-3xl">
                {tutorialSteps[tutStep].emoji}
              </div>
              <div className="text-[11px] font-extrabold text-peach-dark">
                신입 집사 가이드 {tutStep + 1} / {tutorialSteps.length}
              </div>
              <h3 className="mt-1 font-display text-xl text-cocoa">
                {tutorialSteps[tutStep].title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-cocoa-light">
                {tutorialSteps[tutStep].desc}
              </p>
              <div className="mt-5 flex gap-2">
                {tutStep < tutorialSteps.length - 1 ? (
                  <button
                    onClick={() => setTutStep((s) => s + 1)}
                    className="w-full rounded-2xl bg-cocoa py-3 text-sm font-extrabold text-white shadow-pill transition hover:brightness-110"
                  >
                    다음으로
                  </button>
                ) : (
                  <button
                    onClick={completeTutorial}
                    className="w-full rounded-2xl bg-gradient-to-r from-peach-dark to-peach py-3 text-sm font-extrabold text-white shadow-pill transition hover:brightness-105"
                  >
                    집사 생활 시작하기!
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OFFLINE WELCOME BACK MODAL */}
      <AnimatePresence>
        {adopted && tutorialCompleted && offlineSummaryMinutes > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-cocoa/40 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="w-full max-w-sm rounded-3xl border-2 border-white bg-cream-light p-6 text-center shadow-card"
            >
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-lavender-light text-lavender-dark">
                <Clock className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl text-cocoa">
                {offlineSummaryMinutes}분 만에 돌아오셨군요!
              </h3>
              <p className="mt-2 text-sm text-cocoa-light">
                집사님이 자리를 비운 동안 {petName}의 배고픔과 에너지가 조금 변했고, 삐짐 지수가 슬쩍 올라갔습니다. 얼른 달래주세요!
              </p>
              <button
                onClick={dismissOfflineSummary}
                className="mt-5 w-full rounded-2xl bg-cocoa py-3 text-sm font-extrabold text-white shadow-pill"
              >
                알겠어, 바로 챙겨줄게!
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EVOLUTION CELEBRATION MODAL */}
      <AnimatePresence>
        {evolutionNotice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-cocoa/50 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -3 }}
              animate={{ scale: 1, rotate: 0 }}
              className="w-full max-w-sm rounded-3xl border-2 border-amber-200 bg-gradient-to-b from-amber-50 to-cream-light p-6 text-center shadow-card"
            >
              <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-amber-200/70 text-amber-600">
                <Sparkles className="h-8 w-8" />
              </div>
              <span className="rounded-full bg-amber-200/80 px-3 py-1 text-xs font-extrabold text-amber-900">
                EVOLUTION UNLOCKED!
              </span>
              <h3 className="mt-2 font-display text-2xl text-cocoa">{evolutionNotice.title}</h3>
              <p className="text-xs font-bold text-cocoa-muted">{evolutionNotice.subtitle}</p>
              <div className="my-4 rounded-2xl bg-white p-4 text-sm font-bold text-cocoa shadow-sm">
                "{evolutionNotice.dialogue}"
              </div>
              <button
                onClick={dismissEvolutionNotice}
                className="w-full rounded-2xl bg-amber-500 py-3 text-sm font-extrabold text-white shadow-pill transition hover:brightness-105"
              >
                새로운 모습 확인하기
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettingsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex items-center justify-center bg-cocoa/45 p-4 backdrop-blur-sm"
            onClick={() => {
              setShowSettingsModal(false);
              setConfirmReset(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl border-2 border-white bg-cream-light p-6 shadow-card"
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-display text-xl text-cocoa">게임 설정</h3>
                <button
                  onClick={() => {
                    setShowSettingsModal(false);
                    setConfirmReset(false);
                  }}
                  className="rounded-full p-1.5 text-cocoa-muted hover:bg-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => updateSettings({ sfxEnabled: !settings.sfxEnabled })}
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm"
                >
                  <span className="flex items-center gap-2.5 text-sm font-bold text-cocoa">
                    {settings.sfxEnabled ? (
                      <Volume2 className="h-4 w-4 text-mint-dark" />
                    ) : (
                      <VolumeX className="h-4 w-4 text-cocoa-muted" />
                    )}
                    효과음 (SFX)
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      settings.sfxEnabled ? 'bg-mint-light text-cocoa' : 'bg-cream-dark text-cocoa-muted'
                    }`}
                  >
                    {settings.sfxEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => updateSettings({ bgmEnabled: !settings.bgmEnabled })}
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm"
                >
                  <span className="flex items-center gap-2.5 text-sm font-bold text-cocoa">
                    <Music className="h-4 w-4 text-lavender-dark" />
                    배경음악 (BGM)
                  </span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      settings.bgmEnabled ? 'bg-lavender-light text-cocoa' : 'bg-cream-dark text-cocoa-muted'
                    }`}
                  >
                    {settings.bgmEnabled ? 'ON' : 'OFF'}
                  </span>
                </button>

                <button
                  onClick={() => updateSettings({ showAbsurdStats: !settings.showAbsurdStats })}
                  className="flex w-full items-center justify-between rounded-2xl bg-white px-4 py-3.5 shadow-sm"
                >
                  <span className="text-sm font-bold text-cocoa">병맛 전용 상태 표시</span>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                      settings.showAbsurdStats ? 'bg-peach-light text-cocoa' : 'bg-cream-dark text-cocoa-muted'
                    }`}
                  >
                    {settings.showAbsurdStats ? 'ON' : 'OFF'}
                  </span>
                </button>

                <div className="pt-2">
                  {!confirmReset ? (
                    <button
                      onClick={() => setConfirmReset(true)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-rose-200 bg-rose-50 py-3 text-xs font-extrabold text-rose-600 transition hover:bg-rose-100"
                    >
                      <RotateCcw className="h-4 w-4" />
                      게임 데이터 초기화
                    </button>
                  ) : (
                    <div className="rounded-2xl bg-rose-50 p-3 text-center">
                      <p className="text-xs font-bold text-rose-700">
                        정말 모든 저장 데이터를 삭제하고 처음부터 시작할까요?
                      </p>
                      <div className="mt-2.5 flex gap-2">
                        <button
                          onClick={() => setConfirmReset(false)}
                          className="flex-1 rounded-xl bg-white py-2 text-xs font-bold text-cocoa"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => {
                            resetGame();
                            setConfirmReset(false);
                          }}
                          className="flex-1 rounded-xl bg-rose-500 py-2 text-xs font-extrabold text-white"
                        >
                          초기화 확정
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
