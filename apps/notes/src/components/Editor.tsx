'use client';

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
}