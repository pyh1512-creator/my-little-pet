import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Coins, AlertCircle } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { CHARACTERS } from '../../data/characters';

export const AbsurdEventModal: React.FC = () => {
  const activeEvent = useGameStore((s) => s.activeEvent);
  const eventOutcome = useGameStore((s) => s.eventOutcome);
  const characterId = useGameStore((s) => s.characterId);
  const petName = useGameStore((s) => s.petName);
  const resolveEventChoice = useGameStore((s) => s.resolveEventChoice);
  const closeEventModal = useGameStore((s) => s.closeEventModal);

  const char = CHARACTERS[characterId];

  return (
    <AnimatePresence>
      {activeEvent && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-cocoa/45 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 12 }}
            className="w-full max-w-md overflow-hidden rounded-3xl border-2 border-white bg-cream-light shadow-card"
          >
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-peach-light via-cream to-lavender-light px-6 py-4">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[11px] font-extrabold text-peach-dark shadow-sm">
                  <AlertCircle className="h-3.5 w-3.5" />
                  {activeEvent.badge}
                </span>
                <span className="text-xs font-bold text-cocoa-light">
                  {petName} ({char.species})
                </span>
              </div>
              <h2 className="mt-2 font-display text-xl font-bold text-cocoa">
                {activeEvent.title}
              </h2>
            </div>

            {/* Body */}
            <div className="p-6">
              {!eventOutcome ? (
                <>
                  <p className="text-sm leading-relaxed text-cocoa-light">
                    {activeEvent.description}
                  </p>
                  <div className="my-4 rounded-2xl bg-white p-4 text-sm font-bold text-cocoa shadow-sm">
                    {activeEvent.petQuote}
                  </div>
                  <div className="space-y-2.5">
                    {activeEvent.choices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() => resolveEventChoice(choice)}
                        className="w-full rounded-2xl border-2 border-cream-dark bg-white px-4 py-3 text-left text-sm font-bold text-cocoa transition hover:border-peach-dark hover:bg-peach-light/30 active:scale-[0.98]"
                      >
                        {choice.label}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-mint-light/50 p-4 text-sm font-semibold text-cocoa">
                    {eventOutcome.resultText}
                  </div>
                  <div className="rounded-2xl bg-white p-4 text-sm font-bold text-cocoa shadow-sm">
                    {eventOutcome.petReaction}
                  </div>
                  <div className="flex items-center justify-center gap-3">
                    {eventOutcome.coinDelta !== 0 && (
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold ${
                          eventOutcome.coinDelta > 0
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <Coins className="h-3.5 w-3.5" />
                        {eventOutcome.coinDelta > 0 ? `+${eventOutcome.coinDelta}` : eventOutcome.coinDelta} 코인
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-lavender-light px-3 py-1 text-xs font-extrabold text-cocoa">
                      <Sparkles className="h-3.5 w-3.5 text-lavender-dark" />+{eventOutcome.xpDelta} XP
                    </span>
                  </div>
                  <button
                    onClick={closeEventModal}
                    className="w-full rounded-2xl bg-cocoa py-3.5 text-sm font-extrabold text-white shadow-pill transition hover:brightness-110 active:scale-95"
                  >
                    확인
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
