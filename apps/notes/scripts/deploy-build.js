const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Professional E2EE deployment build starting...');

// Create lib directory 
const libDir = path.join(__dirname, '../src/lib');
fs.mkdirSync(libDir, { recursive: true });

// Create components directory
const componentsDir = path.join(__dirname, '../src/components');
fs.mkdirSync(componentsDir, { recursive: true });

// Copy crypto implementation
const cryptoContent = `export interface EncryptedData {
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
        salt,
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
        iv
      },
      key,
      dataBuffer
    );

    return {
      data: this.arrayBufferToBase64(encryptedBuffer),
      iv: this.arrayBufferToBase64(iv)
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
}`;

fs.writeFileSync(path.join(libDir, 'crypto.ts'), cryptoContent);

// Copy store implementation
const storeContent = `import type { EncryptedData } from './crypto';

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
}`;

fs.writeFileSync(path.join(libDir, 'store.ts'), storeContent);

// Copy key management utilities
const keyContent = `import { CryptoService } from './crypto';
import { StoreService } from './store';

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
}`;

fs.writeFileSync(path.join(libDir, 'key.ts'), keyContent);

// Create E2EE Editor component
const editorContent = `'use client';

import { useState, useEffect } from 'react';
import { CryptoService } from '../lib/crypto';
import { StoreService } from '../lib/store';
import { KeyManager } from '../lib/key';

interface EditorProps {
  noteId?: string;
  onSave?: () => void;
  onBack?: () => void;
}

export function Editor({ noteId, onSave, onBack }: EditorProps) {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [store] = useState(() => new StoreService());

  useEffect(() => {
    const initAndLoad = async () => {
      await store.init();
      if (noteId) {
        const storedNote = await store.loadNote(noteId);
        if (storedNote) {
          const key = KeyManager.getCurrentKey();
          if (key) {
            const decrypted = await CryptoService.decrypt(storedNote.encrypted, key);
            setContent(decrypted);
            setTitle(storedNote.title || '');
          }
        }
      }
    };
    initAndLoad();
  }, [noteId, store]);

  const handleSave = async () => {
    const key = KeyManager.getCurrentKey();
    if (!key) return;

    setIsLoading(true);
    try {
      const encrypted = await CryptoService.encrypt(content, key);
      const id = noteId || StoreService.generateId();
      await store.saveNote(id, encrypted, title || undefined);
      onSave?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>

      <input
        type="text"
        placeholder="Note title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full mb-4 p-3 text-xl font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Start writing your encrypted note..."
        className="w-full h-96 p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      
      <p className="text-sm text-gray-500 mt-2">
        🔒 Your notes are encrypted locally before being stored. Your password never leaves this device.
      </p>
    </div>
  );
}`;

fs.writeFileSync(path.join(componentsDir, 'Editor.tsx'), editorContent);

// Create Note List component
const noteListContent = `'use client';

import { useState, useEffect } from 'react';
import { StoreService, type StoredNote } from '../lib/store';

interface NoteListProps {
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
}

export function NoteList({ onSelectNote, onNewNote }: NoteListProps) {
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [store] = useState(() => new StoreService());

  useEffect(() => {
    const loadNotes = async () => {
      await store.init();
      const allNotes = await store.listNotes();
      setNotes(allNotes);
    };
    loadNotes();
  }, [store]);

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this note?')) {
      await store.deleteNote(id);
      setNotes(notes.filter(note => note.id !== id));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Your Encrypted Notes</h1>
        <button
          onClick={onNewNote}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + New Note
        </button>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No notes yet</p>
          <button
            onClick={onNewNote}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create your first encrypted note
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div
              key={note.id}
              onClick={() => onSelectNote(note.id)}
              className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-800">
                    {note.title || 'Untitled Note'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    Last updated: {new Date(note.updated).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => handleDeleteNote(note.id, e)}
                  className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <p className="text-sm text-gray-500 mt-6 text-center">
        🔒 All notes are encrypted locally in your browser. No data is sent to servers.
      </p>
    </div>
  );
}`;

fs.writeFileSync(path.join(componentsDir, 'NoteList.tsx'), noteListContent);

// Update main page.tsx with complete E2EE app
const pageContent = `'use client';

import { useState } from 'react';
import { KeyManager } from '../lib/key';
import { Editor } from '../components/Editor';
import { NoteList } from '../components/NoteList';

type ViewMode = 'login' | 'list' | 'edit';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [password, setPassword] = useState('');
  const [currentNoteId, setCurrentNoteId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      await KeyManager.deriveKey(password);
      setViewMode('list');
      setPassword('');
    } catch (err) {
      setError('Failed to unlock. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    KeyManager.clearKey();
    setViewMode('login');
    setCurrentNoteId(undefined);
  };

  const handleSelectNote = (id: string) => {
    setCurrentNoteId(id);
    setViewMode('edit');
  };

  const handleNewNote = () => {
    setCurrentNoteId(undefined);
    setViewMode('edit');
  };

  const handleSaveNote = () => {
    setViewMode('list');
    setCurrentNoteId(undefined);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setCurrentNoteId(undefined);
  };

  if (viewMode === 'login') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Notes<span className="text-blue-400">.Avantle.AI</span>
            </h1>
            <p className="text-gray-300">End-to-end encrypted notes</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Master Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your master password"
                className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Unlocking...' : 'Unlock Notes'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              🔒 Your password is used to encrypt/decrypt notes locally.<br/>
              It never leaves your device.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (viewMode === 'list') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              Notes<span className="text-blue-600">.Avantle.AI</span>
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        <NoteList onSelectNote={handleSelectNote} onNewNote={handleNewNote} />
      </main>
    );
  }

  if (viewMode === 'edit') {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm">
          <div className="max-w-4xl mx-auto px-6 py-4 flex justify-between items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              Notes<span className="text-blue-600">.Avantle.AI</span>
            </h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        <Editor 
          noteId={currentNoteId} 
          onSave={handleSaveNote} 
          onBack={handleBackToList} 
        />
      </main>
    );
  }

  return null;
}`;

fs.writeFileSync(path.join(__dirname, '../src/app/page.tsx'), pageContent);

console.log('✅ Real E2EE implementations copied');
console.log('✅ Import statements updated');

// Create clean package.json
const cleanPackageJson = {
  "name": "@avantle/notes",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "15.0.3",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "15.0.3",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.0.0"
  }
};

fs.writeFileSync('package.json', JSON.stringify(cleanPackageJson, null, 2));
console.log('✅ Clean package.json created');

console.log('🚀 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });
console.log('🎉 Professional deployment ready!');
