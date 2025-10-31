'use client';

import { useState, useEffect } from 'react';
import { Plus, FileText, Clock, Tag, MoreVertical, Trash2, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { useUIStore } from '../lib/ui-store';
import { DataService } from '../lib/data';
import type { Note } from '../lib/types';

type SortOption = 'newest' | 'oldest' | 'a-z' | 'z-a';

export function SidebarNotes() {
  const { selectedFolderId, selectedNoteId, setSelectedNoteId, notesRefreshTrigger } = useUIStore();
  const [notes, setNotes] = useState<Note[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [loading, setLoading] = useState(false);

  const dataService = DataService.getInstance();

  useEffect(() => {
    if (selectedFolderId) {
      loadNotes();
    }
  }, [selectedFolderId, notesRefreshTrigger]);

  const loadNotes = async () => {
    if (!selectedFolderId) return;
    
    setLoading(true);
    try {
      const noteList = await dataService.listNotes(selectedFolderId);
      setNotes(sortNotes(noteList, sortBy));
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortNotes = (noteList: Note[], sort: SortOption): Note[] => {
    return [...noteList].sort((a, b) => {
      switch (sort) {
        case 'newest':
          return b.updatedAt - a.updatedAt;
        case 'oldest':
          return a.updatedAt - b.updatedAt;
        case 'a-z':
          return a.title.localeCompare(b.title);
        case 'z-a':
          return b.title.localeCompare(a.title);
        default:
          return 0;
      }
    });
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    setNotes(sortNotes(notes, newSort));
  };

  const handleCreateNote = async () => {
    if (!selectedFolderId) return;

    try {
      const noteId = dataService.generateId();
      const newNote: Note = {
        id: noteId,
        folderId: selectedFolderId,
        title: 'Untitled Note',
        content: '',
        tags: [],
        updatedAt: Date.now(),
        encrypted: true
      };

      await dataService.saveNote(newNote);
      await loadNotes();
      setSelectedNoteId(noteId);
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleDeleteNote = async (noteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }

    try {
      await dataService.deleteNote(noteId);
      await loadNotes();
      if (selectedNoteId === noteId) {
        setSelectedNoteId(undefined);
      }
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (!selectedFolderId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <p>Select a folder to view notes</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-muted/10">
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Notes ({notes.length})
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleCreateNote}
            className="h-6 w-6"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="relative">
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value as SortOption)}
            className="w-full bg-background border border-border rounded-md px-3 py-1.5 text-sm appearance-none cursor-pointer"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="a-z">A → Z</option>
            <option value="z-a">Z → A</option>
          </select>
          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">
            Loading notes...
          </div>
        ) : notes.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground space-y-2">
            <FileText className="h-8 w-8 mx-auto opacity-50" />
            <p>No notes yet</p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreateNote}
            >
              Create your first note
            </Button>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {notes.map((note) => (
              <div
                key={note.id}
                className={`group relative rounded-lg p-3 cursor-pointer transition-colors ${
                  selectedNoteId === note.id
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                }`}
                onClick={() => setSelectedNoteId(note.id)}
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-sm line-clamp-2 leading-tight">
                      {note.title || 'Untitled Note'}
                    </h3>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleDeleteNote(note.id, e)}
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 flex-shrink-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  {note.content && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {note.content.substring(0, 100)}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(note.updatedAt)}</span>
                    </div>
                    
                    {note.tags.length > 0 && (
                      <div className="flex items-center gap-1">
                        {note.tags.slice(0, 2).map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-1 py-0 h-4"
                          >
                            {tag}
                          </Badge>
                        ))}
                        {note.tags.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{note.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}