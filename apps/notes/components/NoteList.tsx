'use client';

import { useState, useEffect } from 'react';
import { StoreService, type StoredNote } from '../lib/store';

interface NoteListProps {
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
}

export function NoteList({ onSelectNote, onNewNote }: NoteListProps) {
  const [notes, setNotes] = useState<StoredNote[]>([]);
  const [store, setStore] = useState<StoreService | null>(null);

  useEffect(() => {
    const storeInstance = new StoreService();
    setStore(storeInstance);
  }, []);

  useEffect(() => {
    if (!store) return;
    
    const loadNotes = async () => {
      await store.init();
      const allNotes = await store.listNotes();
      setNotes(allNotes);
    };
    loadNotes();
  }, [store]);

  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    if (!store) return;
    
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
}