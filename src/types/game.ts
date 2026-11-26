export type CharacterId = 'corgi' | 'cat' | 'duck' | 'rabbit' | 'bear';

export type PetAnimationState =
  | 'idle'
  | 'happy'
  | 'sad'
  | 'eat'
  | 'play'
  | 'sleep'
  | 'angry'
  | 'surprise'
  | 'levelup';

export type ActiveTab = 'home' | 'shop' | 'collection' | 'mypage';

export type ShopCategory = 'food' | 'toy' | 'furniture' | 'outfit' | 'decor';

export type MinigameId = 'steal-snack' | 'secret-nap' | 'soothe-pet' | 'do-nothing';

export interface PetStats {
  // Core stats (0 - 100)
  hunger: number;      // 100 = full, 0 = starving
  happiness: number;   // 100 = super happy
  energy: number;      // 100 = energetic
  cleanliness: number; // 100 = sparkling clean

  // Absurd comedy stats (0 - 100)
  ego: number;         // 자존감
  sulkiness: number;   // 삐짐 지수
  trust: number;       // 주인에 대한 신뢰도
  laziness: number;    // 게으름
  reputation: number;  // 사회적 평판
}

export type StatDelta = Partial<PetStats>;

export interface EvolutionStage {
  stage: number; // 0, 1, 2, 3
  minLevel: number;
  title: string;
  subtitle: string;
  description: string;
  unlockDialogue: string;
  scaleBonus: number;
  accessoryProp: 'none' | 'tie' | 'suit_glasses' | 'crown_cape';
}

export interface CharacterDialogues {
  idle: string[];
  click: string[];
  feed: string[];
  feedFavorite: string[];
  feedDislike: string[];
  play: string[];
  wash: string[];
  washRefuse: string[];
  sleep: string[];
  sleepDream: string[];
  pet: string[];
  petAnnoyed: string[];
  hungry: string[];
  sad: string[];
  sulky: string[];
  egoHigh: string[];
  lowTrust: string[];
  levelUp: string[];
}

export interface CharacterDefinition {
  id: CharacterId;
  name: string;
  species: string;
  jobTitle: string;
  tagline: string;
  personality: string;
  favoriteFood: string;
  dislikedFood: string;
  growthTrait: string;
  rarity: 'COMMON' | 'RARE' | 'EPIC';
  glbUrl?: string; // Optional external GLB/GLTF path for future 3D model drop-in
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    cheek: string;
    bgTint: string;
  };
  baseStats: PetStats;
  evolutions: EvolutionStage[];
  dialogues: CharacterDialogues;
}

export interface ShopItem {
  id: string;
  name: string;
  category: ShopCategory;
  price: number;
  icon: string;
  description: string;
  flavorText: string;
  isSpecial?: boolean;
  consumable: boolean;
  effects?: StatDelta;
  xpBonus?: number;
  furnitureSlot?: 'bed' | 'sofa' | 'desk' | 'table' | 'lamp' | 'toy' | 'decor' | 'backdrop';
  outfitSlot?: 'glasses' | 'neck' | 'hat';
  specialBehavior?: {
    preferredCharacter?: CharacterId;
    dialogue: string;
    animation: PetAnimationState;
  };
}

export interface InventoryEntry {
  itemId: string;
  quantity: number;
}

export interface EventChoice {
  id: string;
  label: string;
  resultText: string;
  petReaction: string;
  animation: PetAnimationState;
  statDelta: StatDelta;
  coinDelta?: number;
  xpDelta?: number;
}

export interface AbsurdEvent {
  id: string;
  title: string;
  badge: string;
  description: string;
  petQuote: string;
  triggerAnimation: PetAnimationState;
  preferredCharacters?: CharacterId[];
  choices: EventChoice[];
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  rewardCoins: number;
  secret?: boolean;
}

export interface GrowthLogEntry {
  id: string;
  timestamp: number;
  title: string;
  detail: string;
  type: 'adopt' | 'levelup' | 'evolution' | 'event' | 'minigame' | 'shop' | 'achievement';
}

export interface PetPhoto {
  id: string;
  url: string;
  caption: string;
  createdAt: number;
  source: 'snapshot' | 'upload';
}

export interface RoomSettings {
  placedFurniture: string[]; // itemIds of furniture/decor placed in the 3D room
  equippedOutfits: string[]; // itemIds of outfits worn by pet
  wallpaper: 'cream' | 'mint' | 'lavender' | 'peach';
}

export interface GameSettings {
  sfxEnabled: boolean;
  bgmEnabled: boolean;
  showAbsurdStats: boolean;
}

export interface SaveDataV1 {
  version: 1;
  adopted: boolean;
  characterId: CharacterId;
  petName: string;
  level: number;
  xp: number;
  coins: number;
  stats: PetStats;
  inventory: InventoryEntry[];
  room: RoomSettings;
  unlockedCharacters: CharacterId[];
  seenEvents: string[];
  unlockedAchievements: string[];
  growthLog: GrowthLogEntry[];
  tutorialCompleted: boolean;
  totalClicks: number;
  totalFeeds: number;
  totalPlays: number;
  totalWashes: number;
  totalSleeps: number;
  totalEventsResolved: number;
  totalMinigamesPlayed: number;
  adoptedAt: number;
  lastSavedAt: number;
  settings: GameSettings;
  profileImageUrl?: string;
  photos: PetPhoto[];
}
