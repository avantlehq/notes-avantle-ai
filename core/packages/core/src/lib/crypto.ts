export interface EncryptedData {
  data: string;
  iv: string;
}

export class CryptoService {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;
  private static readonly PBKDF2_ITERATIONS = 100000;

  static async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const importedKey = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new Uint8Array(salt),
        iterations: this.PBKDF2_ITERATIONS,
        hash: 'SHA-256'
      },
      importedKey,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      false,
      ['encrypt', 'decrypt']
    );
  }

  static async encrypt(data: string, key: CryptoKey): Promise<EncryptedData> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv: iv
      },
      key,
      dataBuffer
    );

    return {
      data: this.arrayBufferToBase64(encryptedBuffer),
      iv: this.arrayBufferToBase64(iv.buffer)
    };
  }

  static async decrypt(encryptedData: EncryptedData, key: CryptoKey): Promise<string> {
    const dataBuffer = this.base64ToArrayBuffer(encryptedData.data);
    const iv = this.base64ToArrayBuffer(encryptedData.iv);

    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: this.ALGORITHM,
        iv
      },
      key,
      dataBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  static generateSalt(): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(32));
  }

  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes.buffer;
  }
}

export class KeyManager {
  private static currentKey: CryptoKey | null = null;

  static async deriveKey(password: string): Promise<CryptoKey> {
    let salt = StoreService.getSalt();
    if (!salt) {
      salt = CryptoService.generateSalt();
      StoreService.setSalt(salt);
    }
    
    this.currentKey = await CryptoService.deriveKey(password, salt);
    return this.currentKey;
  }

  static getCurrentKey(): CryptoKey | null {
    return this.currentKey;
  }

  static clearKey(): void {
    this.currentKey = null;
  }
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

  async saveNote(id: string, encrypted: any, title?: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    const now = Date.now();
    const note = { id, encrypted, created: now, updated: now, title };
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreService.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(StoreService.STORE_NAME);
      const request = store.put(note);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  }

  async loadNote(id: string): Promise<any> {
    if (!this.db) throw new Error('Database not initialized');
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([StoreService.STORE_NAME], 'readonly');
      const store = transaction.objectStore(StoreService.STORE_NAME);
      const request = store.get(id);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async listNotes(): Promise<any[]> {
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