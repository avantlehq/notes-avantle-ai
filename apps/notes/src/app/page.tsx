'use client';

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
                placeholder="Create or enter your master password"
                className="w-full p-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-400 mt-1">
                First time? Create any password. Returning? Enter your existing password.
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Unlocking...' : 'Access My Notes'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              🔒 Your password creates a unique encryption key for your notes.<br/>
              No account needed - your password never leaves this device.
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
}