import type { EncryptedData } from './crypto';

export interface StoredNote {
  id: string;
  encrypted: EncryptedData;
  created: number;
  updated: number;
  title?: string;
}

export class StoreService {
  private static readonly DB_NAME = 'avantle_notes';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'notes';
  private static readonly SALT_KEY = 'avantle_salt';
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(StoreService.DB_NAME, StoreService.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => { this.db = request.result; resolve(); };
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(StoreService.STORE_NAME)) {
          const store = db.createObjectStore(StoreService.STORE_NAME, { keyPath: 'id' });
          store.createIndex('created', 'created', { unique: false });
          store.createIndex('updated', 'updated', { unique: false });
        }
      };
    });
  }

  async saveNote(id: string, encrypted: EncryptedData, title?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const now = Date.now();
    const note: StoredNote = { id, encrypted, created: now, updated: now, title };
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(StoreService.STORE_NAME);
      const request = store.put(note);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async loadNote(id: string): Promise<StoredNote | null> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreService.STORE_NAME], 'readonly');
      const store = transaction.objectStore(StoreService.STORE_NAME);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async listNotes(): Promise<StoredNote[]> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreService.STORE_NAME], 'readonly');
      const store = transaction.objectStore(StoreService.STORE_NAME);
      const index = store.index('updated');
      const request = index.getAll();
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result.sort((a, b) => b.updated - a.updated));
    });
  }

  async deleteNote(id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(StoreService.STORE_NAME);
      const request = store.delete(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  static getSalt(): Uint8Array | null {
    const saltStr = localStorage.getItem(StoreService.SALT_KEY);
    if (!saltStr) return null;
    const binary = atob(saltStr);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  static setSalt(salt: Uint8Array): void {
    let binary = '';
    for (let i = 0; i < salt.byteLength; i++) binary += String.fromCharCode(salt[i]);
    localStorage.setItem(StoreService.SALT_KEY, btoa(binary));
  }

  static generateId(): string {
    return crypto.randomUUID();
  }
}