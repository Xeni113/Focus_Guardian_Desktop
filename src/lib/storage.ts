import type { PersistedState } from './types';

/**
 * IndexedDB-backed persistence with localStorage fallback.
 *
 * The store writes to IndexedDB (store name "state", key "focusguardian")
 * for capacity and durability. If IndexedDB is unavailable or still
 * initializing, it transparently falls back to localStorage so the app
 * never loses data.
 */

const DB_NAME = 'focusguardian-db';
const DB_VERSION = 1;
const STORE_NAME = 'state';
const STATE_KEY = 'focusguardian.state.v2';
const LS_FALLBACK_KEY = 'focusguardian.fallback.v2';

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase | null> | null = null;
let useFallback = false;

function openDB(): Promise<IDBDatabase | null> {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (dbInitPromise) return dbInitPromise;

  dbInitPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      useFallback = true;
      resolve(null);
      return;
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => {
        dbInstance = req.result;
        useFallback = false;
        resolve(dbInstance);
      };
      req.onerror = () => {
        useFallback = true;
        resolve(null);
      };
    } catch {
      useFallback = true;
      resolve(null);
    }
  });
  return dbInitPromise;
}

export async function loadState(): Promise<PersistedState | null> {
  // Try localStorage first for instant load, then upgrade from IndexedDB
  try {
    const lsRaw = localStorage.getItem(LS_FALLBACK_KEY);
    if (lsRaw) {
      const parsed = JSON.parse(lsRaw) as PersistedState;
      // Kick off IndexedDB migration in background but return LS data immediately
      openDB().then((db) => {
        if (db) loadFromIDB(db).then((idbState) => {
          if (idbState) {
            // IDB has newer data — trigger a save to sync
            saveState(idbState);
          }
        });
      });
      return parsed;
    }
  } catch {
    /* ignore */
  }

  const db = await openDB();
  if (!db) return null;
  return loadFromIDB(db);
}

function loadFromIDB(db: IDBDatabase): Promise<PersistedState | null> {
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(STATE_KEY);
      req.onsuccess = () => resolve((req.result as PersistedState) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: PersistedState | null = null;

/**
 * Debounced save — coalesces rapid state changes into a single IndexedDB write.
 * Also writes to localStorage as a synchronous fallback/mirror.
 */
export function saveState(state: PersistedState): void {
  // Always mirror to localStorage for instant hydration on next load
  try {
    localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(state));
  } catch {
    /* storage full — IDB will still hold the data */
  }

  pendingState = state;
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (pendingState) void saveToIDB(pendingState);
    saveTimer = null;
  }, 500);
}

async function saveToIDB(state: PersistedState): Promise<void> {
  if (useFallback) return;
  const db = await openDB();
  if (!db) return;
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(state, STATE_KEY);
  } catch {
    /* ignore — localStorage fallback already has the data */
  }
}

export async function clearState(): Promise<void> {
  try {
    localStorage.removeItem(LS_FALLBACK_KEY);
  } catch {
    /* ignore */
  }
  const db = await openDB();
  if (db) {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).delete(STATE_KEY);
    } catch {
      /* ignore */
    }
  }
}

export function exportData(state: PersistedState): void {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `focusguardian-export-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importData(file: File): Promise<PersistedState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as PersistedState;
        if (!parsed.apps || !parsed.settings) {
          reject(new Error('Invalid FocusGuardian backup file'));
          return;
        }
        resolve(parsed);
      } catch {
        reject(new Error('Could not parse file as JSON'));
      }
    };
    reader.onerror = () => reject(new Error('File read error'));
    reader.readAsText(file);
  });
}
