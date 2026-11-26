import { create } from 'zustand';
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  SyncStatus,
  loadGameFromFirestore,
  saveGameToFirestore,
  saveUserProfileToFirestore,
  subscribeSyncStatus,
} from '../lib/cloudSave';
import { useGameStore } from './useGameStore';
import { soundEngine } from '../utils/audio';

export type AuthModalMode = 'login' | 'signup';

interface AuthState {
  user: User | null;
  authReady: boolean;
  loading: boolean;
  error: string | null;
  syncStatus: SyncStatus;
  showAuthModal: boolean;
  authModalMode: AuthModalMode;

  openAuthModal: (mode?: AuthModalMode) => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: AuthModalMode) => void;
  clearError: () => void;

  initAuthListener: () => () => void;
  signUpWithEmail: (email: string, password: string, nickname: string) => Promise<boolean>;
  loginWithEmail: (email: string, password: string) => Promise<boolean>;
  loginWithGoogle: () => Promise<boolean>;
  logout: () => Promise<void>;
  syncNow: () => Promise<void>;
}

function mapFirebaseAuthError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-email':
      return '올바른 이메일 형식을 입력해 주세요.';
    case 'auth/email-already-in-use':
      return '이미 가입된 이메일입니다. 로그인을 시도해 주세요.';
    case 'auth/weak-password':
      return '비밀번호는 6자 이상으로 설정해 주세요.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return '이메일 또는 비밀번호가 올바르지 않습니다.';
    case 'auth/too-many-requests':
      return '요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.';
    case 'auth/popup-closed-by-user':
      return '로그인 창이 닫혔습니다. 다시 시도해 주세요.';
    case 'auth/operation-not-allowed':
      return 'Firebase 콘솔에서 해당 로그인 방식이 아직 활성화되지 않았습니다.';
    default:
      return '인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  authReady: false,
  loading: false,
  error: null,
  syncStatus: 'idle',
  showAuthModal: false,
  authModalMode: 'login',

  openAuthModal: (mode = 'login') => {
    soundEngine.play('click');
    set({ showAuthModal: true, authModalMode: mode, error: null });
  },
  closeAuthModal: () => {
    soundEngine.play('click');
    set({ showAuthModal: false, error: null });
  },
  setAuthModalMode: (mode) => {
    soundEngine.play('click');
    set({ authModalMode: mode, error: null });
  },
  clearError: () => set({ error: null }),

  initAuthListener: () => {
    const unsubSync = subscribeSyncStatus((status) => set({ syncStatus: status }));

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      set({ user, authReady: true });
      if (user) {
        await saveUserProfileToFirestore(user.uid, user.email, user.displayName);
        const cloudData = await loadGameFromFirestore(user.uid);
        const gameStore = useGameStore.getState();

        if (cloudData && cloudData.adopted) {
          // Prefer cloud save if local is not adopted or cloud is newer
          if (!gameStore.adopted || (cloudData.lastSavedAt ?? 0) >= (gameStore.lastSavedAt ?? 0)) {
            gameStore.hydrateFromCloud(cloudData);
            gameStore.pushToast({
              title: '클라우드 데이터 불러오기 완료',
              subtitle: `${user.displayName || user.email}님의 펫 정보를 동기화했어요.`,
              icon: '☁️',
              tone: 'mint',
            });
          } else {
            await saveGameToFirestore(user.uid, gameStore.getSaveSnapshot());
          }
        } else if (gameStore.adopted) {
          // Upload existing local progress to Firestore on first sign-in
          await saveGameToFirestore(user.uid, gameStore.getSaveSnapshot());
        }
      } else {
        set({ syncStatus: 'idle' });
      }
    });

    return () => {
      unsubSync();
      unsubAuth();
    };
  },

  signUpWithEmail: async (email, password, nickname) => {
    set({ loading: true, error: null });
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanNick = nickname.trim() || email.split('@')[0];
      await updateProfile(cred.user, { displayName: cleanNick });
      await saveUserProfileToFirestore(cred.user.uid, cred.user.email, cleanNick);

      const gameStore = useGameStore.getState();
      if (gameStore.adopted) {
        await saveGameToFirestore(cred.user.uid, gameStore.getSaveSnapshot());
      }

      soundEngine.play('levelup');
      set({ user: { ...cred.user, displayName: cleanNick } as User, loading: false, showAuthModal: false });
      gameStore.pushToast({
        title: `환영합니다, ${cleanNick}님!`,
        subtitle: '회원가입 완료 · Firestore 자동 저장이 시작됩니다.',
        icon: '🎉',
        tone: 'mint',
      });
      return true;
    } catch (err) {
      soundEngine.play('angry');
      set({ loading: false, error: mapFirebaseAuthError(err) });
      return false;
    }
  },

  loginWithEmail: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      soundEngine.play('coin');
      set({ user: cred.user, loading: false, showAuthModal: false });
      useGameStore.getState().pushToast({
        title: '로그인 성공!',
        subtitle: `${cred.user.displayName || cred.user.email}님 반가워요.`,
        icon: '🐾',
        tone: 'mint',
      });
      return true;
    } catch (err) {
      soundEngine.play('angry');
      set({ loading: false, error: mapFirebaseAuthError(err) });
      return false;
    }
  },

  loginWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      soundEngine.play('coin');
      set({ user: cred.user, loading: false, showAuthModal: false });
      useGameStore.getState().pushToast({
        title: 'Google 로그인 성공!',
        subtitle: `${cred.user.displayName || cred.user.email}님 반가워요.`,
        icon: '✨',
        tone: 'mint',
      });
      return true;
    } catch (err) {
      soundEngine.play('angry');
      set({ loading: false, error: mapFirebaseAuthError(err) });
      return false;
    }
  },

  logout: async () => {
    soundEngine.play('click');
    await signOut(auth);
    set({ user: null, syncStatus: 'idle' });
    useGameStore.getState().pushToast({
      title: '로그아웃되었습니다',
      subtitle: '로컬 모드로 계속 플레이할 수 있어요.',
      icon: '👋',
      tone: 'lavender',
    });
  },

  syncNow: async () => {
    const user = get().user;
    if (!user) return;
    soundEngine.play('click');
    const ok = await saveGameToFirestore(user.uid, useGameStore.getState().getSaveSnapshot());
    useGameStore.getState().pushToast({
      title: ok ? '클라우드 저장 완료!' : '클라우드 저장 실패',
      subtitle: ok ? 'Firestore에 현재 펫 상태가 안전하게 기록되었습니다.' : '네트워크 또는 Firestore 권한을 확인해 주세요.',
      icon: ok ? '☁️' : '⚠️',
      tone: ok ? 'mint' : 'peach',
    });
  },
}));
