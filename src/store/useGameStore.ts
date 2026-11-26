import { create } from 'zustand';
import {
  AbsurdEvent,
  ActiveTab,
  CharacterId,
  EventChoice,
  GameSettings,
  GrowthLogEntry,
  InventoryEntry,
  MinigameId,
  PetAnimationState,
  PetPhoto,
  PetStats,
  RoomSettings,
  SaveDataV1,
  StatDelta,
} from '../types/game';
import { CHARACTERS, getEvolutionStage } from '../data/characters';
import { SHOP_ITEM_MAP } from '../data/items';
import { ABSURD_EVENTS } from '../data/events';
import { ACHIEVEMENTS } from '../data/achievements';
import { soundEngine } from '../utils/audio';
import { auth } from '../lib/firebase';
import { scheduleCloudSave } from '../lib/cloudSave';

const STORAGE_KEY = 'my_little_pet_save_v1';

const clampStat = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

export function getXpForNextLevel(level: number): number {
  return 80 + (level - 1) * 45;
}

function applyStatDelta(stats: PetStats, delta: StatDelta): PetStats {
  const next = { ...stats };
  (Object.keys(delta) as (keyof PetStats)[]).forEach((key) => {
    const change = delta[key];
    if (typeof change === 'number') {
      next[key] = clampStat(next[key] + change);
    }
  });
  return next;
}

function createInitialSaveData(): SaveDataV1 {
  const now = Date.now();
  return {
    version: 1,
    adopted: false,
    characterId: 'corgi',
    petName: '김코기',
    level: 1,
    xp: 0,
    coins: 150,
    stats: { ...CHARACTERS.corgi.baseStats },
    inventory: [
      { itemId: 'food_basic_kibble', quantity: 3 },
      { itemId: 'toy_squeaky_ball', quantity: 1 },
    ],
    room: {
      placedFurniture: ['decor_rug'],
      equippedOutfits: [],
      wallpaper: 'cream',
    },
    unlockedCharacters: ['corgi'],
    seenEvents: [],
    unlockedAchievements: [],
    growthLog: [],
    tutorialCompleted: false,
    totalClicks: 0,
    totalFeeds: 0,
    totalPlays: 0,
    totalWashes: 0,
    totalSleeps: 0,
    totalEventsResolved: 0,
    totalMinigamesPlayed: 0,
    adoptedAt: now,
    lastSavedAt: now,
    settings: {
      sfxEnabled: true,
      bgmEnabled: false,
      showAbsurdStats: true,
    },
    profileImageUrl: '',
    photos: [],
  };
}

function loadSaveData(): { data: SaveDataV1; offlineMinutes: number } {
  if (typeof window === 'undefined') {
    return { data: createInitialSaveData(), offlineMinutes: 0 };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { data: createInitialSaveData(), offlineMinutes: 0 };
    }
    const parsed = JSON.parse(raw) as Partial<SaveDataV1>;
    const base = createInitialSaveData();
    const merged: SaveDataV1 = {
      ...base,
      ...parsed,
      stats: { ...base.stats, ...(parsed.stats ?? {}) },
      room: { ...base.room, ...(parsed.room ?? {}) },
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    };

    // Apply elapsed offline time if already adopted
    let offlineMinutes = 0;
    if (merged.adopted && merged.lastSavedAt) {
      const elapsedMs = Math.max(0, Date.now() - merged.lastSavedAt);
      offlineMinutes = Math.floor(elapsedMs / 60000);
      if (offlineMinutes >= 2) {
        const decaySteps = Math.min(25, Math.floor(offlineMinutes / 5));
        if (decaySteps > 0) {
          merged.stats = applyStatDelta(merged.stats, {
            hunger: -decaySteps * 2,
            energy: -decaySteps,
            cleanliness: -decaySteps,
            happiness: -decaySteps,
            sulkiness: Math.min(25, decaySteps),
            laziness: Math.min(15, Math.floor(decaySteps / 2)),
          });
        }
      }
      merged.lastSavedAt = Date.now();
    }

    return { data: merged, offlineMinutes };
  } catch {
    return { data: createInitialSaveData(), offlineMinutes: 0 };
  }
}

function persistSaveData(data: SaveDataV1) {
  const stamped: SaveDataV1 = { ...data, lastSavedAt: Date.now() };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stamped));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }
  scheduleCloudSave(auth.currentUser?.uid, stamped);
}

export interface ToastNotice {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  tone?: 'mint' | 'peach' | 'lavender' | 'gold';
}

interface GameStoreState extends SaveDataV1 {
  // Transient UI state (not persisted)
  activeTab: ActiveTab;
  animation: PetAnimationState;
  speechText: string;
  lastSpeechLines: string[];
  activeEvent: AbsurdEvent | null;
  eventOutcome: {
    choiceLabel: string;
    resultText: string;
    petReaction: string;
    coinDelta: number;
    xpDelta: number;
  } | null;
  activeMinigame: MinigameId | null;
  showSettingsModal: boolean;
  showMinigameHub: boolean;
  showRoomModal: boolean;
  offlineSummaryMinutes: number;
  evolutionNotice: { title: string; subtitle: string; dialogue: string } | null;
  toasts: ToastNotice[];
  actionCooldownUntil: number;

  // Actions
  setActiveTab: (tab: ActiveTab) => void;
  setShowSettingsModal: (open: boolean) => void;
  setShowMinigameHub: (open: boolean) => void;
  setShowRoomModal: (open: boolean) => void;
  setActiveMinigame: (id: MinigameId | null) => void;
  dismissOfflineSummary: () => void;
  dismissEvolutionNotice: () => void;
  completeTutorial: () => void;
  dismissToast: (id: string) => void;
  pushToast: (toast: Omit<ToastNotice, 'id'>) => void;

  adoptPet: (characterId: CharacterId, petName: string) => void;
  switchCharacter: (characterId: CharacterId) => void;
  renamePet: (name: string) => void;

  // Interactions
  clickPet: () => void;
  petCharacter: () => void;
  feedPet: (itemId?: string) => void;
  playWithPet: (itemId?: string) => void;
  washPet: () => void;
  sleepPet: () => void;
  triggerIdleChatter: () => void;
  tickTime: () => void;

  // Events
  triggerRandomEvent: (force?: boolean) => void;
  resolveEventChoice: (choice: EventChoice) => void;
  closeEventModal: () => void;

  // Shop & Room
  buyItem: (itemId: string) => boolean;
  useInventoryItem: (itemId: string) => void;
  toggleFurniture: (itemId: string) => void;
  toggleOutfit: (itemId: string) => void;
  setWallpaper: (wallpaper: RoomSettings['wallpaper']) => void;

  // Minigame reward
  completeMinigame: (gameId: MinigameId, score: number, coinsEarned: number, xpEarned: number) => void;

  // Settings & Reset & Cloud Sync & Media
  updateSettings: (partial: Partial<GameSettings>) => void;
  resetGame: () => void;
  hydrateFromCloud: (cloudData: SaveDataV1) => void;
  getSaveSnapshot: () => SaveDataV1;
  setProfileImage: (url: string) => void;
  addPhoto: (photo: Omit<PetPhoto, 'id' | 'createdAt'>) => void;
  removePhoto: (id: string) => void;
}

let animResetTimer: number | null = null;

const { data: initialData, offlineMinutes: initialOfflineMinutes } = loadSaveData();
soundEngine.setSfxEnabled(initialData.settings.sfxEnabled);
soundEngine.setBgmEnabled(initialData.settings.bgmEnabled);

function pickNonRepeating(pool: string[], recent: string[]): { line: string; nextRecent: string[] } {
  if (pool.length === 0) return { line: '...', nextRecent: recent };
  const candidates = pool.filter((l) => !recent.includes(l));
  const list = candidates.length > 0 ? candidates : pool;
  const line = list[Math.floor(Math.random() * list.length)];
  const nextRecent = [line, ...recent].slice(0, 6);
  return { line, nextRecent };
}

function extractSave(s: GameStoreState): SaveDataV1 {
  return {
    version: 1,
    adopted: s.adopted,
    characterId: s.characterId,
    petName: s.petName,
    level: s.level,
    xp: s.xp,
    coins: s.coins,
    stats: s.stats,
    inventory: s.inventory,
    room: s.room,
    unlockedCharacters: s.unlockedCharacters,
    seenEvents: s.seenEvents,
    unlockedAchievements: s.unlockedAchievements,
    growthLog: s.growthLog,
    tutorialCompleted: s.tutorialCompleted,
    totalClicks: s.totalClicks,
    totalFeeds: s.totalFeeds,
    totalPlays: s.totalPlays,
    totalWashes: s.totalWashes,
    totalSleeps: s.totalSleeps,
    totalEventsResolved: s.totalEventsResolved,
    totalMinigamesPlayed: s.totalMinigamesPlayed,
    adoptedAt: s.adoptedAt,
    lastSavedAt: Date.now(),
    settings: s.settings,
    profileImageUrl: s.profileImageUrl ?? '',
    photos: s.photos ?? [],
  };
}

export const useGameStore = create<GameStoreState>((set, get) => {
  const scheduleAnimReset = (ms = 2600) => {
    if (animResetTimer) clearTimeout(animResetTimer);
    animResetTimer = window.setTimeout(() => {
      const state = get();
      // Pick mood-appropriate idle if stats are extreme
      if (state.stats.sulkiness >= 80) {
        set({ animation: 'angry' });
      } else if (state.stats.happiness <= 20) {
        set({ animation: 'sad' });
      } else {
        set({ animation: 'idle' });
      }
    }, ms);
  };

  const addLog = (logs: GrowthLogEntry[], entry: Omit<GrowthLogEntry, 'id' | 'timestamp'>): GrowthLogEntry[] => {
    return [
      {
        ...entry,
        id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        timestamp: Date.now(),
      },
      ...logs,
    ].slice(0, 40);
  };

  const checkAchievements = (state: GameStoreState) => {
    const unlocked = new Set(state.unlockedAchievements);
    const newlyUnlocked: typeof ACHIEVEMENTS = [];

    const check = (id: string, condition: boolean) => {
      if (condition && !unlocked.has(id)) {
        const def = ACHIEVEMENTS.find((a) => a.id === id);
        if (def) {
          unlocked.add(id);
          newlyUnlocked.push(def);
        }
      }
    };

    check('ach_first_adopt', state.adopted);
    check('ach_first_feed', state.totalFeeds >= 1);
    check('ach_click_10', state.totalClicks >= 10);
    check('ach_level_4', state.level >= 4);
    check('ach_level_8', state.level >= 8);
    check('ach_event_3', state.totalEventsResolved >= 3);
    check('ach_minigame_2', state.totalMinigamesPlayed >= 2);
    check('ach_interior', state.room.placedFurniture.length >= 2);
    check('ach_rich_500', state.coins >= 500);
    check('ach_ego_95', state.stats.ego >= 95);

    if (newlyUnlocked.length > 0) {
      let bonusCoins = 0;
      let logs = state.growthLog;
      newlyUnlocked.forEach((a) => {
        bonusCoins += a.rewardCoins;
        logs = addLog(logs, {
          title: `업적 달성: ${a.title}`,
          detail: `+${a.rewardCoins} 코인 획득`,
          type: 'achievement',
        });
        get().pushToast({
          title: `업적 달성! ${a.title}`,
          subtitle: `+${a.rewardCoins} 코인 보상 지급`,
          icon: a.icon,
          tone: 'gold',
        });
      });
      soundEngine.play('coin');
      set((s) => {
        const next = {
          ...s,
          coins: s.coins + bonusCoins,
          unlockedAchievements: Array.from(unlocked),
          growthLog: logs,
        };
        persistSaveData(extractSave(next));
        return next;
      });
    }
  };

  const grantXpAndCoins = (xpGain: number, coinGain: number, sourceTitle?: string) => {
    const state = get();
    const prevEvo = getEvolutionStage(state.characterId, state.level);
    let level = state.level;
    let xp = state.xp + xpGain;
    let coins = Math.max(0, state.coins + coinGain);
    let leveledUp = false;
    let logs = state.growthLog;

    while (xp >= getXpForNextLevel(level)) {
      xp -= getXpForNextLevel(level);
      level += 1;
      coins += 40;
      leveledUp = true;
      logs = addLog(logs, {
        title: `레벨 ${level} 달성!`,
        detail: `${state.petName}의 존재감이 더욱 커졌습니다 (+40 코인)`,
        type: 'levelup',
      });
    }

    const nextEvo = getEvolutionStage(state.characterId, level);
    let evolutionNotice = state.evolutionNotice;
    if (nextEvo.stage > prevEvo.stage) {
      evolutionNotice = {
        title: nextEvo.title,
        subtitle: nextEvo.subtitle,
        dialogue: nextEvo.unlockDialogue,
      };
      logs = addLog(logs, {
        title: `진화 완료: ${nextEvo.title}`,
        detail: nextEvo.subtitle,
        type: 'evolution',
      });
    }

    if (leveledUp) {
      soundEngine.play('levelup');
      const char = CHARACTERS[state.characterId];
      const { line, nextRecent } = pickNonRepeating(char.dialogues.levelUp, state.lastSpeechLines);
      set((s) => {
        const next = {
          ...s,
          level,
          xp,
          coins,
          animation: 'levelup' as PetAnimationState,
          speechText: line,
          lastSpeechLines: nextRecent,
          growthLog: logs,
          evolutionNotice,
        };
        persistSaveData(extractSave(next));
        return next;
      });
      scheduleAnimReset(3200);
      get().pushToast({
        title: `LEVEL UP! Lv.${level}`,
        subtitle: sourceTitle ? `${sourceTitle} · 보너스 +40 코인` : '레벨업 보너스 +40 코인!',
        icon: '🎉',
        tone: 'gold',
      });
    } else {
      set((s) => {
        const next = { ...s, level, xp, coins, growthLog: logs, evolutionNotice };
        persistSaveData(extractSave(next));
        return next;
      });
    }

    checkAchievements(get());
  };

  return {
    ...initialData,
    activeTab: 'home',
    animation: 'idle',
    speechText: initialData.adopted
      ? CHARACTERS[initialData.characterId].dialogues.idle[0]
      : '집사님, 저를 입양해 주실 건가요?',
    lastSpeechLines: [],
    activeEvent: null,
    eventOutcome: null,
    activeMinigame: null,
    showSettingsModal: false,
    showMinigameHub: false,
    showRoomModal: false,
    offlineSummaryMinutes: initialOfflineMinutes >= 2 ? initialOfflineMinutes : 0,
    evolutionNotice: null,
    toasts: [],
    actionCooldownUntil: 0,

    setActiveTab: (tab) => {
      soundEngine.play('click');
      set({ activeTab: tab });
    },
    setShowSettingsModal: (open) => {
      soundEngine.play('click');
      set({ showSettingsModal: open });
    },
    setShowMinigameHub: (open) => {
      soundEngine.play('click');
      set({ showMinigameHub: open });
    },
    setShowRoomModal: (open) => {
      soundEngine.play('click');
      set({ showRoomModal: open });
    },
    setActiveMinigame: (id) => {
      soundEngine.play('click');
      set({ activeMinigame: id, showMinigameHub: false });
    },
    dismissOfflineSummary: () => set({ offlineSummaryMinutes: 0 }),
    dismissEvolutionNotice: () => set({ evolutionNotice: null }),
    completeTutorial: () => {
      soundEngine.play('click');
      set((s) => {
        const next = { ...s, tutorialCompleted: true };
        persistSaveData(extractSave(next));
        return next;
      });
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    pushToast: (toast) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      set((s) => ({ toasts: [...s.toasts, { ...toast, id }].slice(-3) }));
      window.setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
      }, 3600);
    },

    adoptPet: (characterId, petName) => {
      const char = CHARACTERS[characterId];
      const cleanName = petName.trim() || char.name;
      soundEngine.play('levelup');
      const now = Date.now();
      set((s) => {
        const unlocked = Array.from(new Set([...s.unlockedCharacters, characterId]));
        const next: GameStoreState = {
          ...s,
          adopted: true,
          characterId,
          petName: cleanName,
          stats: { ...char.baseStats },
          unlockedCharacters: unlocked,
          adoptedAt: now,
          lastSavedAt: now,
          animation: 'happy',
          speechText: char.evolutions[0].unlockDialogue,
          growthLog: addLog(s.growthLog, {
            title: `${cleanName} (${char.species}) 입양!`,
            detail: '축하합니다. 당신은 이제 정식 집사가 되었습니다.',
            type: 'adopt',
          }),
        };
        persistSaveData(extractSave(next));
        return next;
      });
      scheduleAnimReset(3000);
      checkAchievements(get());
    },

    switchCharacter: (characterId) => {
      const char = CHARACTERS[characterId];
      soundEngine.play('react');
      set((s) => {
        const unlocked = Array.from(new Set([...s.unlockedCharacters, characterId]));
        const next: GameStoreState = {
          ...s,
          characterId,
          petName: char.name,
          unlockedCharacters: unlocked,
          animation: 'happy',
          speechText: char.evolutions[0].unlockDialogue,
          activeTab: 'home',
        };
        persistSaveData(extractSave(next));
        return next;
      });
      scheduleAnimReset(2400);
      get().pushToast({
        title: `${char.name}와 함께하기`,
        subtitle: `${char.jobTitle} 출근 완료!`,
        icon: '🐾',
        tone: 'mint',
      });
    },

    renamePet: (name) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      soundEngine.play('click');
      set((s) => {
        const next = { ...s, petName: trimmed };
        persistSaveData(extractSave(next));
        return next;
      });
    },

    clickPet: () => {
      const state = get();
      const char = CHARACTERS[state.characterId];
      soundEngine.play('react');

      // 18% chance of special furniture reaction if placed
      const placedSpecial = state.room.placedFurniture
        .map((id) => SHOP_ITEM_MAP[id])
        .filter((it) => it?.specialBehavior);

      if (placedSpecial.length > 0 && Math.random() < 0.2) {
        const picked =
          placedSpecial.find((it) => it.specialBehavior?.preferredCharacter === state.characterId) ||
          placedSpecial[Math.floor(Math.random() * placedSpecial.length)];
        if (picked?.specialBehavior) {
          set((s) => {
            const next = {
              ...s,
              animation: picked.specialBehavior!.animation,
              speechText: picked.specialBehavior!.dialogue,
              totalClicks: s.totalClicks + 1,
            };
            persistSaveData(extractSave(next));
            return next;
          });
          scheduleAnimReset(2800);
          checkAchievements(get());
          return;
        }
      }

      const anims: PetAnimationState[] = ['happy', 'surprise', 'play', 'angry'];
      const chosenAnim =
        state.stats.sulkiness > 70
          ? 'angry'
          : anims[Math.floor(Math.random() * (anims.length - 1))];

      const { line, nextRecent } = pickNonRepeating(char.dialogues.click, state.lastSpeechLines);
      set((s) => {
        const next = {
          ...s,
          animation: chosenAnim,
          speechText: line,
          lastSpeechLines: nextRecent,
          totalClicks: s.totalClicks + 1,
          stats: applyStatDelta(s.stats, { happiness: 2, trust: 1 }),
        };
        persistSaveData(extractSave(next));
        return next;
      });
      scheduleAnimReset(2200);
      if (Math.random() < 0.35) {
        grantXpAndCoins(4, 3);
      } else {
        checkAchievements(get());
      }
    },

    petCharacter: () => {
      const state = get();
      const char = CHARACTERS[state.characterId];
      const annoyed = state.stats.sulkiness > 65 || Math.random() < 0.22;

      if (annoyed) {
        soundEngine.play('angry');
        const { line, nextRecent } = pickNonRepeating(char.dialogues.petAnnoyed, state.lastSpeechLines);
        set((s) => {
          const next = {
            ...s,
            animation: 'angry' as PetAnimationState,
            speechText: line,
            lastSpeechLines: nextRecent,
            stats: applyStatDelta(s.stats, { sulkiness: 4, ego: 3, happiness: 3 }),
          };
          persistSaveData(extractSave(next));
          return next;
        });
      } else {
        soundEngine.play('react');
        const { line, nextRecent } = pickNonRepeating(char.dialogues.pet, state.lastSpeechLines);
        set((s) => {
          const next = {
            ...s,
            animation: 'happy' as PetAnimationState,
            speechText: line,
            lastSpeechLines: nextRecent,
            stats: applyStatDelta(s.stats, { happiness: 12, trust: 7, sulkiness: -10 }),
          };
          persistSaveData(extractSave(next));
          return next;
        });
        grantXpAndCoins(10, 8);
      }
      scheduleAnimReset(2400);
    },

    feedPet: (itemId) => {
      const state = get();
      const char = CHARACTERS[state.characterId];
      const item = itemId ? SHOP_ITEM_MAP[itemId] : undefined;

      let delta: StatDelta = item?.effects ?? { hunger: 22, happiness: 8, trust: 4, sulkiness: -6 };
      let xpGain = item?.xpBonus ?? 14;
      let pool = char.dialogues.feed;
      let anim: PetAnimationState = 'eat';

      if (item) {
        if (item.name === char.favoriteFood) {
          pool = char.dialogues.feedFavorite;
          delta = { ...delta, happiness: (delta.happiness ?? 0) + 15, trust: (delta.trust ?? 0) + 10 };
          xpGain += 15;
          anim = 'happy';
        } else if (item.name === char.dislikedFood) {
          pool = char.dialogues.feedDislike;
          delta = { hunger: 8, happiness: -12, sulkiness: 18, trust: -5 };
          anim = 'angry';
        }
      }

      soundEngine.play(anim === 'angry' ? 'angry' : 'eat');
      const { line, nextRecent } = pickNonRepeating(pool, state.lastSpeechLines);

      set((s) => {
        const next = {
          ...s,
          animation: anim,
          speechText: line,
          lastSpeechLines: nextRecent,
          totalFeeds: s.totalFeeds + 1,
          stats: applyStatDelta(s.stats, delta),
        };
        persistSaveData(extractSave(next));
        return next;
      });
      scheduleAnimReset(2600);
      grantXpAndCoins(xpGain, 10);

      if (Math.random() < 0.22) {
        window.setTimeout(() => get().triggerRandomEvent(), 1400);
      }
    },

    playWithPet: (itemId) => {
      const state = get();
      const char = CHARACTERS[state.characterId];
      if (state.stats.energy < 12) {
        soundEngine.play('angry');
        set({
          animation: 'sad',
          speechText: '에너지가 바닥이에요... 지금은 1mm도 못 움직입니다. 재워주세요!',
        });
        scheduleAnimReset(2400);
        return;
      }

      const item = itemId ? SHOP_ITEM_MAP[itemId] : undefined;
      const delta: StatDelta = item?.effects ?? {
        happiness: 20,
        energy: -14,
        hunger: -8,
        laziness: -8,
        trust: 6,
        sulkiness: -10,
      };

      soundEngine.play('jump');
      const { line, nextRecent } = pickNonRepeating(char.dialogues.play, state.lastSpeechLines);

      set((s) => {
        const next = {
          ...s,
          animation: 'play' as PetAnimationState,
          speechText: line,
          lastSpeechLines: nextRecent,
          totalPlays: s.totalPlays + 1,
          stats: applyStatDelta(s.stats, delta),
        };
        persistSaveData(extractSave(next));
        return next;
      });
      scheduleAnimReset(2800);
      grantXpAndCoins(item?.xpBonus ?? 22, 18);

      if (Math.random() < 0.28) {
        window.setTimeout(() => get().triggerRandomEvent(), 1600);
      }
    },

    washPet: () => {
      const state = get();
      const char = CHARACTERS[state.characterId];
      // Refuse chance (higher for cat or sulky pet)
      const refuseChance = state.characterId === 'cat' ? 0.35 : state.stats.sulkiness > 60 ? 0.4 : 0.18;

      if (Math.random() < refuseChance) {
        soundEngine.play('angry');
        const { line, nextRecent } = pickNonRepeating(char.dialogues.washRefuse, state.lastSpeechLines);
        set((s) => {
          const next = {
            ...s,
            animation: 'angry' as PetAnimationState,
            speechText: line,
            lastSpeechLines: nextRecent,
            stats: applyStatDelta(s.stats, { sulkiness: 10, ego: 5 }),
          };
          persistSaveData(extractSave(next));
          return next;
        });
        scheduleAnimReset(2500);
        return;
      }

      soundEngine.play('wash');
      const { line, nextRecent } = pickNonRepeating(char.dialogues.wash, state.lastSpeechLines);
      set((s) => {
        const next = {
          ...s,
          animation: 'surprise' as PetAnimationState,
          speechText: line,
          lastSpeechLines: nextRecent,
          totalWashes: s.totalWashes + 1,
          stats: applyStatDelta(s.stats, { cleanliness: 34, happiness: 6, reputation: 6, energy: -5 }),
        };
        persistSaveData(extractSave(next));
        return next;
      });
      scheduleAnimReset(2600);
      grantXpAndCoins(16, 12);
    },

    sleepPet: () => {
      const state = get();
      const char = CHARACTERS[state.characterId];
      soundEngine.play('sleep');
      const hasCloudBed = state.room.placedFurniture.includes('furn_cloud_bed');
      const isDream = Math.random() < 0.48;
      const pool = isDream ? char.dialogues.sleepDream : char.dialogues.sleep;
      const { line, nextRecent } = pickNonRepeating(pool, state.lastSpeechLines);

      set((s) => {
        const next = {
          ...s,
          animation: 'sleep' as PetAnimationState,
          speechText: isDream ? `💤 [꿈꾸는 중] ${line}` : line,
          lastSpeechLines: nextRecent,
          totalSleeps: s.totalSleeps + 1,
          stats: applyStatDelta(s.stats, {
            energy: hasCloudBed ? 42 : 30,
            happiness: isDream ? 12 : 6,
            sulkiness: -12,
            laziness: 6,
            hunger: -6,
          }),
        };
        persistSaveData(extractSave(next));
        return next;
      });
      scheduleAnimReset(3400);
      grantXpAndCoins(14, isDream ? 15 : 8);
    },

    triggerIdleChatter: () => {
      const state = get();
      if (!state.adopted || state.activeEvent || state.activeMinigame) return;
      const char = CHARACTERS[state.characterId];
      let pool = char.dialogues.idle;

      if (state.stats.hunger <= 28) pool = char.dialogues.hungry;
      else if (state.stats.sulkiness >= 72) pool = char.dialogues.sulky;
      else if (state.stats.happiness <= 28) pool = char.dialogues.sad;
      else if (state.stats.trust <= 28) pool = char.dialogues.lowTrust;
      else if (state.stats.ego >= 85 && Math.random() < 0.45) pool = char.dialogues.egoHigh;

      const { line, nextRecent } = pickNonRepeating(pool, state.lastSpeechLines);
      set({ speechText: line, lastSpeechLines: nextRecent });
    },

    tickTime: () => {
      const state = get();
      if (!state.adopted) return;
      set((s) => {
        const next = {
          ...s,
          stats: applyStatDelta(s.stats, {
            hunger: -2,
            energy: -1,
            cleanliness: -1,
            happiness: s.stats.hunger < 25 ? -3 : -1,
            sulkiness: s.stats.hunger < 25 ? 2 : 0,
          }),
        };
        persistSaveData(extractSave(next));
        return next;
      });
    },

    triggerRandomEvent: (force = false) => {
      const state = get();
      if (!state.adopted || state.activeEvent || state.activeMinigame) return;
      if (!force && state.activeTab !== 'home') return;

      const unseen = ABSURD_EVENTS.filter((e) => !state.seenEvents.includes(e.id));
      const pool = unseen.length > 0 ? unseen : ABSURD_EVENTS;

      // Prefer character-matched events slightly
      const preferred = pool.filter(
        (e) => e.preferredCharacters && e.preferredCharacters.includes(state.characterId)
      );
      const chosen =
        preferred.length > 0 && Math.random() < 0.45
          ? preferred[Math.floor(Math.random() * preferred.length)]
          : pool[Math.floor(Math.random() * pool.length)];

      soundEngine.play('event');
      set({
        activeEvent: chosen,
        eventOutcome: null,
        animation: chosen.triggerAnimation,
        speechText: chosen.petQuote,
      });
    },

    resolveEventChoice: (choice) => {
      const state = get();
      const evt = state.activeEvent;
      if (!evt) return;

      soundEngine.play(choice.animation === 'angry' ? 'angry' : 'coin');
      const nextSeen = state.seenEvents.includes(evt.id)
        ? state.seenEvents
        : [...state.seenEvents, evt.id];
      const resetSeen = nextSeen.length >= ABSURD_EVENTS.length ? [evt.id] : nextSeen;

      set((s) => {
        const next = {
          ...s,
          stats: applyStatDelta(s.stats, choice.statDelta),
          animation: choice.animation,
          speechText: choice.petReaction,
          seenEvents: resetSeen,
          totalEventsResolved: s.totalEventsResolved + 1,
          eventOutcome: {
            choiceLabel: choice.label,
            resultText: choice.resultText,
            petReaction: choice.petReaction,
            coinDelta: choice.coinDelta ?? 0,
            xpDelta: choice.xpDelta ?? 20,
          },
          growthLog: addLog(s.growthLog, {
            title: `이벤트: ${evt.title}`,
            detail: choice.resultText,
            type: 'event',
          }),
        };
        persistSaveData(extractSave(next));
        return next;
      });
      grantXpAndCoins(choice.xpDelta ?? 20, choice.coinDelta ?? 0, evt.title);
      scheduleAnimReset(3000);
    },

    closeEventModal: () => {
      soundEngine.play('click');
      set({ activeEvent: null, eventOutcome: null });
    },

    buyItem: (itemId) => {
      const state = get();
      const item = SHOP_ITEM_MAP[itemId];
      if (!item) return false;
      if (state.coins < item.price) {
        soundEngine.play('angry');
        get().pushToast({
          title: '코인이 부족합니다!',
          subtitle: '돌봄 활동이나 미니게임으로 코인을 모아보세요.',
          icon: '💸',
          tone: 'peach',
        });
        return false;
      }

      const existing = state.inventory.find((i) => i.itemId === itemId);
      if (!item.consumable && existing && existing.quantity > 0) {
        get().pushToast({
          title: '이미 보유 중인 아이템입니다',
          subtitle: '인벤토리나 펫 룸에서 바로 장착해 보세요!',
          icon: '✨',
          tone: 'lavender',
        });
        return false;
      }

      soundEngine.play('coin');
      const nextInventory: InventoryEntry[] = existing
        ? state.inventory.map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity + 1 } : i))
        : [...state.inventory, { itemId, quantity: 1 }];

      // Auto-place furniture or equip outfit on first purchase for instant gratification!
      const nextRoom = { ...state.room };
      if ((item.category === 'furniture' || item.category === 'decor') && !nextRoom.placedFurniture.includes(itemId)) {
        nextRoom.placedFurniture = [...nextRoom.placedFurniture, itemId];
      }
      if (item.category === 'outfit' && !nextRoom.equippedOutfits.includes(itemId)) {
        nextRoom.equippedOutfits = [...nextRoom.equippedOutfits, itemId];
      }

      set((s) => {
        const next = {
          ...s,
          coins: s.coins - item.price,
          inventory: nextInventory,
          room: nextRoom,
          stats: item.effects && !item.consumable ? applyStatDelta(s.stats, item.effects) : s.stats,
          growthLog: addLog(s.growthLog, {
            title: `상점 구매: ${item.name}`,
            detail: `${item.price} 코인 사용`,
            type: 'shop',
          }),
        };
        persistSaveData(extractSave(next));
        return next;
      });

      get().pushToast({
        title: `${item.name} 구매 완료!`,
        subtitle: item.consumable ? '인벤토리에서 사용할 수 있어요.' : '3D 펫 룸/캐릭터에 자동 적용되었습니다!',
        icon: item.icon,
        tone: 'mint',
      });
      checkAchievements(get());
      return true;
    },

    useInventoryItem: (itemId) => {
      const state = get();
      const item = SHOP_ITEM_MAP[itemId];
      const entry = state.inventory.find((i) => i.itemId === itemId);
      if (!item || !entry || entry.quantity <= 0) return;

      if (!item.consumable) {
        if (item.category === 'outfit') {
          get().toggleOutfit(itemId);
        } else {
          get().toggleFurniture(itemId);
        }
        return;
      }

      // Consume 1
      const nextInventory = state.inventory
        .map((i) => (i.itemId === itemId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);

      set((s) => {
        const next = { ...s, inventory: nextInventory };
        persistSaveData(extractSave(next));
        return next;
      });

      if (item.category === 'food') {
        get().feedPet(itemId);
      } else if (item.category === 'toy') {
        get().playWithPet(itemId);
      }
    },

    toggleFurniture: (itemId) => {
      const item = SHOP_ITEM_MAP[itemId];
      soundEngine.play('click');
      set((s) => {
        const exists = s.room.placedFurniture.includes(itemId);
        const placedFurniture = exists
          ? s.room.placedFurniture.filter((id) => id !== itemId)
          : [...s.room.placedFurniture, itemId];
        const next = {
          ...s,
          room: { ...s.room, placedFurniture },
          speechText:
            !exists && item?.specialBehavior ? item.specialBehavior.dialogue : s.speechText,
          animation:
            !exists && item?.specialBehavior ? item.specialBehavior.animation : s.animation,
        };
        persistSaveData(extractSave(next));
        return next;
      });
      if (item?.specialBehavior) scheduleAnimReset(2800);
      checkAchievements(get());
    },

    toggleOutfit: (itemId) => {
      soundEngine.play('react');
      set((s) => {
        const exists = s.room.equippedOutfits.includes(itemId);
        const equippedOutfits = exists
          ? s.room.equippedOutfits.filter((id) => id !== itemId)
          : [...s.room.equippedOutfits, itemId];
        const next = {
          ...s,
          room: { ...s.room, equippedOutfits },
          animation: 'happy' as PetAnimationState,
          speechText: exists
            ? '편안한 원래 모습으로 돌아왔습니다.'
            : '어때요? 이 패션 소화할 수 있는 펫은 저뿐입니다.',
        };
        persistSaveData(extractSave(next));
        return next;
      });
      scheduleAnimReset(2400);
    },

    setWallpaper: (wallpaper) => {
      soundEngine.play('click');
      set((s) => {
        const next = { ...s, room: { ...s.room, wallpaper } };
        persistSaveData(extractSave(next));
        return next;
      });
    },

    completeMinigame: (gameId, score, coinsEarned, xpEarned) => {
      const titles: Record<MinigameId, string> = {
        'steal-snack': '간식 훔쳐 먹기',
        'secret-nap': '주인 몰래 낮잠 자기',
        'soothe-pet': '화난 펫 달래기',
        'do-nothing': '아무것도 하지 않기',
      };
      soundEngine.play('coin');
      set((s) => {
        const next = {
          ...s,
          activeMinigame: null,
          totalMinigamesPlayed: s.totalMinigamesPlayed + 1,
          animation: 'happy' as PetAnimationState,
          speechText: `${titles[gameId]} 클리어! ${coinsEarned}코인이나 벌었어요! 이제 간식 사주세요!`,
          stats: applyStatDelta(s.stats, { happiness: 14, trust: 8, energy: -8 }),
          growthLog: addLog(s.growthLog, {
            title: `미니게임: ${titles[gameId]}`,
            detail: `점수 ${score}점 · +${coinsEarned} 코인, +${xpEarned} XP`,
            type: 'minigame',
          }),
        };
        persistSaveData(extractSave(next));
        return next;
      });
      grantXpAndCoins(xpEarned, coinsEarned, titles[gameId]);
      scheduleAnimReset(2800);
    },

    updateSettings: (partial) => {
      set((s) => {
        const settings = { ...s.settings, ...partial };
        soundEngine.setSfxEnabled(settings.sfxEnabled);
        soundEngine.setBgmEnabled(settings.bgmEnabled);
        const next = { ...s, settings };
        persistSaveData(extractSave(next));
        return next;
      });
    },

    resetGame: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY);
      }
      const fresh = createInitialSaveData();
      set({
        ...fresh,
        activeTab: 'home',
        animation: 'idle',
        speechText: '집사님, 저를 입양해 주실 건가요?',
        lastSpeechLines: [],
        activeEvent: null,
        eventOutcome: null,
        activeMinigame: null,
        showSettingsModal: false,
        showMinigameHub: false,
        showRoomModal: false,
        offlineSummaryMinutes: 0,
        evolutionNotice: null,
        toasts: [],
      });
    },

    hydrateFromCloud: (cloudData) => {
      const base = createInitialSaveData();
      const merged: SaveDataV1 = {
        ...base,
        ...cloudData,
        stats: { ...base.stats, ...(cloudData.stats ?? {}) },
        room: { ...base.room, ...(cloudData.room ?? {}) },
        settings: { ...base.settings, ...(cloudData.settings ?? {}) },
      };
      soundEngine.setSfxEnabled(merged.settings.sfxEnabled);
      soundEngine.setBgmEnabled(merged.settings.bgmEnabled);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // Ignore storage error
        }
      }
      set({
        ...merged,
        animation: 'idle',
        speechText: CHARACTERS[merged.characterId].dialogues.idle[0],
      });
    },

    getSaveSnapshot: () => extractSave(get()),

    setProfileImage: (url) => {
      soundEngine.play('coin');
      set((s) => {
        const next = { ...s, profileImageUrl: url };
        persistSaveData(extractSave(next));
        return next;
      });
    },

    addPhoto: (photo) => {
      soundEngine.play('coin');
      const entry: PetPhoto = {
        ...photo,
        id: `photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        createdAt: Date.now(),
      };
      set((s) => {
        const next = { ...s, photos: [entry, ...(s.photos ?? [])].slice(0, 30) };
        persistSaveData(extractSave(next));
        return next;
      });
    },

    removePhoto: (id) => {
      soundEngine.play('click');
      set((s) => {
        const next = { ...s, photos: (s.photos ?? []).filter((p) => p.id !== id) };
        persistSaveData(extractSave(next));
        return next;
      });
    },
  };
});
