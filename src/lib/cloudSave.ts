import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from './firebase';
import { SaveDataV1 } from '../types/game';

export type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error';

type SyncListener = (status: SyncStatus) => void;
const listeners = new Set<SyncListener>();

export function subscribeSyncStatus(fn: SyncListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function emitSyncStatus(status: SyncStatus) {
  listeners.forEach((fn) => fn(status));
}

export async function saveUserProfileToFirestore(uid: string, email: string | null, displayName: string | null) {
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(
      userRef,
      {
        email: email ?? '',
        displayName: displayName ?? '',
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Failed to update user profile:', err);
  }
}

export async function loadGameFromFirestore(uid: string): Promise<SaveDataV1 | null> {
  emitSyncStatus('syncing');
  try {
    const saveRef = doc(db, 'users', uid, 'gameData', 'save');
    const snap = await getDoc(saveRef);
    emitSyncStatus('synced');
    if (snap.exists()) {
      return snap.data() as SaveDataV1;
    }
    return null;
  } catch (err) {
    console.warn('[Firestore] Failed to load game save:', err);
    emitSyncStatus('error');
    return null;
  }
}

export async function saveGameToFirestore(uid: string, data: SaveDataV1): Promise<boolean> {
  emitSyncStatus('syncing');
  try {
    const saveRef = doc(db, 'users', uid, 'gameData', 'save');
    await setDoc(
      saveRef,
      {
        ...data,
        lastSavedAt: Date.now(),
        cloudUpdatedAt: serverTimestamp(),
      },
      { merge: true }
    );
    emitSyncStatus('synced');
    return true;
  } catch (err) {
    console.warn('[Firestore] Failed to save game data:', err);
    emitSyncStatus('error');
    return false;
  }
}

let debounceTimer: number | null = null;

export function scheduleCloudSave(uid: string | undefined, data: SaveDataV1) {
  if (!uid) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    void saveGameToFirestore(uid, data);
  }, 1200);
}
