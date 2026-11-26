import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trophy, Coins, Sparkles } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';
import { MinigameId } from '../../types/game';
import { soundEngine } from '../../utils/audio';

const GAMES: { id: MinigameId; title: string; emoji: string; desc: string; badge: string }[] = [
  {
    id: 'steal-snack',
    title: '간식 훔쳐 먹기',
    emoji: '🍖',
    desc: '15초 안에 간식만 쏙쏙 터치! 브로콜리와 목욕물은 피하세요.',
    badge: '스피드 액션',
  },
  {
    id: 'secret-nap',
    title: '주인 몰래 낮잠 자기',
    emoji: '😴',
    desc: '집사가 한눈팔 때만 버튼을 꾹 눌러 꿀잠 게이지를 채우세요!',
    badge: '눈치 게임',
  },
  {
    id: 'soothe-pet',
    title: '화난 펫 달래기',
    emoji: '💢',
    desc: '황당한 이유로 화난 펫에게 최고의 대처법을 골라 달래주세요.',
    badge: '코미디 퀴즈',
  },
  {
    id: 'do-nothing',
    title: '아무것도 하지 않기',
    emoji: '🦥',
    desc: '유혹하는 버튼들을 무시하고 10초간 아무것도 누르지 마세요!',
    badge: '인내심 테스트',
  },
];

// ================= 1. STEAL SNACK =================
const StealSnackGame: React.FC<{ onFinish: (score: number, coins: number, xp: number) => void }> = ({
  onFinish,
}) => {
  const [timeLeft, setTimeLeft] = useState(15);
  const [score, setScore] = useState(0);
  const [cells, setCells] = useState<(null | { icon: string; good: boolean; id: number })[]>(
    Array(9).fill(null)
  );
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft === 0 && !finishedRef.current) {
      finishedRef.current = true;
      const coins = Math.max(20, Math.round(score * 0.9) + 20);
      const xp = Math.max(20, Math.round(score * 0.6) + 15);
      onFinish(score, coins, xp);
    }
  }, [timeLeft, score, onFinish]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const goodIcons = ['🍖', '🦴', '🍣', '🍰', '🥞'];
    const badIcons = ['🥦', '🛁', '💉'];
    const spawner = window.setInterval(() => {
      const next = Array(9).fill(null) as (null | { icon: string; good: boolean; id: number })[];
      const count = 2 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(Math.random() * 9);
        const good = Math.random() < 0.72;
        next[idx] = {
          icon: good
            ? goodIcons[Math.floor(Math.random() * goodIcons.length)]
            : badIcons[Math.floor(Math.random() * badIcons.length)],
          good,
          id: Math.random(),
        };
      }
      setCells(next);
    }, 780);
    return () => clearInterval(spawner);
  }, [timeLeft]);

  const handleTap = (idx: number) => {
    const cell = cells[idx];
    if (!cell || timeLeft <= 0) return;
    if (cell.good) {
      soundEngine.play('coin');
      setScore((s) => s + 10);
    } else {
      soundEngine.play('angry');
      setScore((s) => Math.max(0, s - 15));
    }
    setCells((prev) => prev.map((c, i) => (i === idx ? null : c)));
  };

  return (
    <div className="space-y-4 text-center">
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-sm font-extrabold text-cocoa">
        <span>남은 시간: {timeLeft}초</span>
        <span className="text-peach-dark">점수: {score}</span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {cells.map((cell, idx) => (
          <button
            key={idx}
            onClick={() => handleTap(idx)}
            className="flex h-20 items-center justify-center rounded-2xl border-2 border-white bg-cream text-3xl shadow-sm transition active:scale-90"
          >
            {cell ? cell.icon : ''}
          </button>
        ))}
      </div>
      <p className="text-xs text-cocoa-light">간식(+10점)만 누르고 브로콜리/목욕물/주사(-15점)는 피하세요!</p>
    </div>
  );
};

// ================= 2. SECRET NAP =================
const SecretNapGame: React.FC<{ onFinish: (score: number, coins: number, xp: number) => void }> = ({
  onFinish,
}) => {
  const [ownerLooking, setOwnerLooking] = useState(false);
  const [napping, setNapping] = useState(false);
  const [progress, setProgress] = useState(0);
  const [caughtCount, setCaughtCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(14);
  const finishedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (timeLeft <= 0) return;
    let timeout: number;
    const toggle = () => {
      setOwnerLooking((prev) => {
        const next = !prev;
        timeout = window.setTimeout(toggle, next ? 1100 + Math.random() * 900 : 1400 + Math.random() * 1200);
        return next;
      });
    };
    timeout = window.setTimeout(toggle, 1600);
    return () => clearTimeout(timeout);
  }, [timeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const loop = window.setInterval(() => {
      if (napping) {
        if (ownerLooking) {
          soundEngine.play('angry');
          setCaughtCount((c) => c + 1);
          setProgress((p) => Math.max(0, p - 14));
          setNapping(false);
        } else {
          setProgress((p) => Math.min(100, p + 4.5));
        }
      }
    }, 160);
    return () => clearInterval(loop);
  }, [napping, ownerLooking, timeLeft]);

  useEffect(() => {
    if ((progress >= 100 || timeLeft === 0) && !finishedRef.current) {
      finishedRef.current = true;
      const score = Math.round(progress);
      const coins = Math.max(25, Math.round(score * 0.85) + 15);
      const xp = Math.max(20, Math.round(score * 0.5) + 15);
      onFinish(score, coins, xp);
    }
  }, [progress, timeLeft, onFinish]);

  return (
    <div className="space-y-4 text-center">
      <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-2.5 text-xs font-extrabold text-cocoa">
        <span>남은 시간: {timeLeft}초</span>
        <span>들킨 횟수: {caughtCount}회</span>
      </div>

      <div
        className={`rounded-3xl p-6 transition-colors ${
          ownerLooking ? 'bg-rose-100 text-rose-700' : 'bg-mint-light/60 text-cocoa'
        }`}
      >
        <div className="text-4xl">{ownerLooking ? '👀🚨' : napping ? '😴💤' : '😎'}</div>
        <div className="mt-2 font-display text-lg font-bold">
          {ownerLooking
            ? '집사가 쳐다보고 있어요! 손 떼세요!'
            : napping
            ? '꿀잠 자는 중... Zzz'
            : '지금이에요! 집사가 한눈파는 중!'}
        </div>
      </div>

      <div>
        <div className="mb-1 flex justify-between text-xs font-bold text-cocoa">
          <span>꿀잠 달성도</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-cream-dark">
          <div
            className="h-full rounded-full bg-lavender-dark transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <button
        onMouseDown={() => setNapping(true)}
        onMouseUp={() => setNapping(false)}
        onMouseLeave={() => setNapping(false)}
        onTouchStart={() => setNapping(true)}
        onTouchEnd={() => setNapping(false)}
        className={`w-full select-none rounded-2xl py-4 text-sm font-extrabold text-white shadow-pill transition active:scale-95 ${
          napping ? 'bg-lavender-dark' : 'bg-cocoa'
        }`}
      >
        {napping ? '😴 몰래 자는 중... (떼면 일어남)' : '꾹 눌러서 몰래 낮잠 자기'}
      </button>
    </div>
  );
};

// ================= 3. SOOTHE ANGRY PET =================
const SOOTHE_ROUNDS = [
  {
    complaint: '"간식 봉지가 어제보다 1g 가벼워졌어요!! 이건 사기입니다!!"',
    options: [
      { label: '정밀 저울로 재서 1g만큼 간식을 추가 지급한다', score: 30 },
      { label: '"네가 살쪄서 그래"라고 말한다', score: 5 },
      { label: '"이건 프리미엄 에어(공기)가 추가된 고급 간식이야"', score: 20 },
    ],
  },
  {
    complaint: '"집사님, 방금 다른 강아지 영상에 좋아요 눌렀죠?! 다 봤어요!!"',
    options: [
      { label: '"너보다 귀여운지 감시하려고 본 거야, 넌 우주 원탑이야!"', score: 30 },
      { label: '"손가락이 미끄러졌어..."', score: 15 },
      { label: '"귀엽던데 왜?"', score: 0 },
    ],
  },
  {
    complaint: '"오늘 구름 모양이 마음에 안 들어서 기분이 나빠요! 흥!"',
    options: [
      { label: '"당장 하늘 고객센터에 클레임 걸어둘게, 넌 간식 먹자"', score: 30 },
      { label: '"창문 커튼을 닫아줄게"', score: 20 },
      { label: '"그걸 나한테 왜 화내..."', score: 5 },
    ],
  },
  {
    complaint: '"아무 이유 없는데 그냥 지금 당장 대우받고 싶어요!!"',
    options: [
      { label: '레드카펫 대신 수건을 깔아주고 박수 쳐준다', score: 30 },
      { label: '진지하게 절을 올린다', score: 25 },
      { label: '무시하고 스마트폰을 본다', score: 0 },
    ],
  },
];

const SoothePetGame: React.FC<{ onFinish: (score: number, coins: number, xp: number) => void }> = ({
  onFinish,
}) => {
  const [roundIdx, setRoundIdx] = useState(0);
  const [score, setScore] = useState(0);

  const current = SOOTHE_ROUNDS[roundIdx];

  const handlePick = (pts: number) => {
    soundEngine.play(pts >= 25 ? 'coin' : pts > 0 ? 'click' : 'angry');
    const nextScore = score + pts;
    if (roundIdx + 1 >= SOOTHE_ROUNDS.length) {
      onFinish(nextScore, Math.max(25, nextScore), Math.max(20, Math.round(nextScore * 0.7)));
    } else {
      setScore(nextScore);
      setRoundIdx((i) => i + 1);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs font-extrabold text-cocoa-light">
        <span>라운드 {roundIdx + 1} / {SOOTHE_ROUNDS.length}</span>
        <span>달래기 점수: {score}</span>
      </div>
      <div className="rounded-3xl bg-peach-light/45 p-5 text-center">
        <div className="text-3xl">💢😤</div>
        <p className="mt-2 text-sm font-extrabold text-cocoa">{current.complaint}</p>
      </div>
      <div className="space-y-2">
        {current.options.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => handlePick(opt.score)}
            className="w-full rounded-2xl border-2 border-cream-dark bg-white px-4 py-3 text-left text-xs font-bold text-cocoa transition hover:border-peach-dark hover:bg-peach-light/25 active:scale-[0.98]"
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

// ================= 4. DO NOTHING =================
const BAITS = [
  '🎁 무료 9999코인 받기 (절대 누르지 마세요)',
  '🚨 긴급! 간식이 타고 있어요! 클릭!',
  '👑 지금 누르면 전설의 펫 진화!',
  '👆 심심하죠? 딱 한 번만 눌러보세요',
];

const DoNothingGame: React.FC<{ onFinish: (score: number, coins: number, xp: number) => void }> = ({
  onFinish,
}) => {
  const [timeLeft, setTimeLeft] = useState(10);
  const [failed, setFailed] = useState(false);
  const [baitIdx, setBaitIdx] = useState(0);
  const finishedRef = useRef(false);

  useEffect(() => {
    if (failed) return;
    const timer = window.setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);
    const baitTimer = window.setInterval(() => {
      setBaitIdx((i) => (i + 1) % BAITS.length);
    }, 2200);
    return () => {
      clearInterval(timer);
      clearInterval(baitTimer);
    };
  }, [failed]);

  useEffect(() => {
    if (timeLeft === 0 && !failed && !finishedRef.current) {
      finishedRef.current = true;
      onFinish(100, 90, 45);
    }
  }, [timeLeft, failed, onFinish]);

  const handleBaitClick = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    soundEngine.play('angry');
    setFailed(true);
    window.setTimeout(() => {
      onFinish(10, 15, 10);
    }, 1000);
  };

  return (
    <div className="space-y-4 text-center">
      <div className="rounded-3xl bg-mint-light/50 p-6">
        <div className="text-4xl">{failed ? '😱' : '🦥✨'}</div>
        <div className="mt-2 font-display text-3xl text-cocoa">
          {failed ? '참지 못하고 눌렀습니다!' : `${timeLeft}초`}
        </div>
        <p className="mt-1 text-xs font-semibold text-cocoa-light">
          {failed
            ? '아무것도 하지 않는 게 제일 어렵죠...'
            : '손을 가만히 두세요! 아래 버튼을 누르면 실패합니다.'}
        </p>
      </div>

      {!failed && (
        <button
          onClick={handleBaitClick}
          className="w-full animate-pulse rounded-2xl bg-gradient-to-r from-amber-400 to-peach-dark py-3.5 text-xs font-extrabold text-white shadow-pill"
        >
          {BAITS[baitIdx]}
        </button>
      )}
    </div>
  );
};

// ================= MAIN MINIGAME MODAL =================
export const MinigameModal: React.FC = () => {
  const showMinigameHub = useGameStore((s) => s.showMinigameHub);
  const setShowMinigameHub = useGameStore((s) => s.setShowMinigameHub);
  const activeMinigame = useGameStore((s) => s.activeMinigame);
  const setActiveMinigame = useGameStore((s) => s.setActiveMinigame);
  const completeMinigame = useGameStore((s) => s.completeMinigame);

  const [result, setResult] = useState<{
    gameId: MinigameId;
    score: number;
    coins: number;
    xp: number;
  } | null>(null);

  const isOpen = showMinigameHub || activeMinigame !== null;

  const handleClose = () => {
    setResult(null);
    setShowMinigameHub(false);
    setActiveMinigame(null);
  };

  const handleGameFinish = (gameId: MinigameId) => (score: number, coins: number, xp: number) => {
    soundEngine.play('levelup');
    setResult({ gameId, score, coins, xp });
  };

  const handleClaim = () => {
    if (!result) return;
    completeMinigame(result.gameId, result.score, result.coins, result.xp);
    setResult(null);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-40 flex items-center justify-center bg-cocoa/45 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.92, y: 16 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92 }}
            className="w-full max-w-md rounded-3xl border-2 border-white bg-cream-light p-6 shadow-card"
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-display text-xl text-cocoa">
                {activeMinigame
                  ? GAMES.find((g) => g.id === activeMinigame)?.title
                  : '코미디 미니게임 센터'}
              </h3>
              <button
                onClick={handleClose}
                className="rounded-full p-1.5 text-cocoa-muted hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {result ? (
              <div className="space-y-4 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-amber-500">
                  <Trophy className="h-9 w-9" />
                </div>
                <h4 className="font-display text-2xl text-cocoa">게임 완료!</h4>
                <p className="text-sm font-bold text-cocoa-light">최종 점수: {result.score}점</p>
                <div className="flex justify-center gap-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3.5 py-1.5 text-xs font-extrabold text-amber-800">
                    <Coins className="h-4 w-4" /> +{result.coins} 코인
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-lavender-light px-3.5 py-1.5 text-xs font-extrabold text-cocoa">
                    <Sparkles className="h-4 w-4 text-lavender-dark" /> +{result.xp} XP
                  </span>
                </div>
                <button
                  onClick={handleClaim}
                  className="w-full rounded-2xl bg-cocoa py-3.5 text-sm font-extrabold text-white shadow-pill"
                >
                  보상 받고 돌아가기
                </button>
              </div>
            ) : activeMinigame ? (
              <div>
                {activeMinigame === 'steal-snack' && (
                  <StealSnackGame onFinish={handleGameFinish('steal-snack')} />
                )}
                {activeMinigame === 'secret-nap' && (
                  <SecretNapGame onFinish={handleGameFinish('secret-nap')} />
                )}
                {activeMinigame === 'soothe-pet' && (
                  <SoothePetGame onFinish={handleGameFinish('soothe-pet')} />
                )}
                {activeMinigame === 'do-nothing' && (
                  <DoNothingGame onFinish={handleGameFinish('do-nothing')} />
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-2.5">
                {GAMES.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveMinigame(g.id)}
                    className="flex items-center gap-3.5 rounded-2xl border-2 border-white bg-white/90 p-3.5 text-left shadow-sm transition hover:border-peach-dark hover:bg-peach-light/20 active:scale-[0.98]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-cream text-2xl">
                      {g.emoji}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-cocoa">{g.title}</span>
                        <span className="rounded-full bg-mint-light px-2 py-0.5 text-[10px] font-bold text-cocoa">
                          {g.badge}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-cocoa-light">{g.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
