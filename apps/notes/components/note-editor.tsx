'use client';

import { useState, useEffect, useCallback } from 'react';
import { Save, ArrowLeft, Tag, X, Network } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { StatusLock } from './status-lock';
import { useUIStore } from '../lib/ui-store';
import { DataService } from '../lib/data';
import { extractLinks, updateNoteLinks, parseLinksToMarkdown } from '../lib/links';
import { getBacklinks, getForwardLinks } from '../lib/graph';
import type { Note, BacklinkResult } from '../lib/types';

export function NoteEditor() {
  const { selectedNoteId, setSelectedNoteId, activeTab, setActiveTab } = useUIStore();
  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [backlinks, setBacklinks] = useState<BacklinkResult[]>([]);
  const [forwardLinks, setForwardLinks] = useState<BacklinkResult[]>([]);

  const dataService = DataService.getInstance();

  useEffect(() => {
    if (selectedNoteId) {
      loadNote();
      loadLinks();
    } else {
      resetEditor();
    }
  }, [selectedNoteId]);

  useEffect(() => {
    const hasUnsavedChanges = note && (
      note.title !== title ||
      note.content !== content ||
      JSON.stringify(note.tags) !== JSON.stringify(tags)
    );
    setHasChanges(!!hasUnsavedChanges);
  }, [title, content, tags, note]);

  const loadNote = async () => {
    if (!selectedNoteId) return;

    try {
      const loadedNote = await dataService.loadNote(selectedNoteId);
      if (loadedNote) {
        setNote(loadedNote);
        setTitle(loadedNote.title);
        setContent(loadedNote.content);
        setTags(loadedNote.tags);
      }
    } catch (error) {
      console.error('Failed to load note:', error);
    }
  };

  const loadLinks = async () => {
    if (!selectedNoteId) return;

    try {
      const [backlinksData, forwardLinksData] = await Promise.all([
        getBacklinks(selectedNoteId),
        getForwardLinks(selectedNoteId)
      ]);
      setBacklinks(backlinksData);
      setForwardLinks(forwardLinksData);
    } catch (error) {
      console.error('Failed to load links:', error);
    }
  };

  const resetEditor = () => {
    setNote(null);
    setTitle('');
    setContent('');
    setTags([]);
    setNewTag('');
    setHasChanges(false);
    setBacklinks([]);
    setForwardLinks([]);
  };

  const handleSave = async () => {
    if (!selectedNoteId || !note) return;

    setIsSaving(true);
    try {
      const updatedNote: Note = {
        ...note,
        title: title.trim() || 'Untitled Note',
        content,
        tags,
        updatedAt: Date.now()
      };

      await dataService.saveNote(updatedNote);
      await updateNoteLinks(selectedNoteId, content);
      await loadLinks();
      setNote(updatedNote);
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      handleSave();
    }
  }, [handleSave]);

  const handleWikiLinkClick = useCallback((linkText: string) => {
    // TODO: Implement navigation to linked note
    console.log('Navigate to link:', linkText);
  }, []);

  // Set up global wiki link handler
  useEffect(() => {
    window.handleWikiLinkClick = handleWikiLinkClick;
    return () => {
      delete window.handleWikiLinkClick;
    };
  }, [handleWikiLinkClick]);

  if (!selectedNoteId) {
    return (
      <div className="h-full flex items-center justify-center text-muted-foreground">
        <div className="text-center space-y-2">
          <p>Select a note to start editing</p>
          <p className="text-sm">or create a new note from the sidebar</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedNoteId(undefined)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            size="sm"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>

        <Input
          placeholder="Note title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          className="text-lg font-semibold border-none px-0 focus-visible:ring-0"
        />

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="gap-1 cursor-pointer"
              >
                <Tag className="h-3 w-3" />
                {tag}
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex gap-2">
            <Input
              placeholder="Add tag..."
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                } else if (e.key === 'Escape') {
                  setNewTag('');
                }
                handleKeyDown(e);
              }}
              className="h-8"
            />
            <Button
              onClick={handleAddTag}
              disabled={!newTag.trim()}
              size="sm"
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2 w-fit">
          <TabsTrigger value="edit">Edit</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
          <TabsTrigger value="graph">Graph</TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="flex-1 p-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start writing your encrypted note..."
            className="note-editor"
          />
        </TabsContent>

        <TabsContent value="preview" className="flex-1 p-4 overflow-auto">
          <div className="prose prose-invert max-w-none">
            <ReactMarkdown
              rehypePlugins={[rehypeHighlight]}
              components={{
                p: ({ children }) => (
                  <p dangerouslySetInnerHTML={{ 
                    __html: parseLinksToMarkdown(String(children)) 
                  }} />
                )
              }}
            >
              {content || '*No content to preview*'}
            </ReactMarkdown>
          </div>
        </TabsContent>

        <TabsContent value="graph" className="flex-1 p-4">
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Network className="h-4 w-4" />
                Backlinks ({backlinks.length})
              </h3>
              {backlinks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No backlinks found</p>
              ) : (
                <div className="space-y-2">
                  {backlinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-2 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedNoteId(link.id)}
                    >
                      <div className="font-medium text-sm">{link.title}</div>
                      <div className="text-xs text-muted-foreground">{link.predicate}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-3">Forward Links ({forwardLinks.length})</h3>
              {forwardLinks.length === 0 ? (
                <p className="text-muted-foreground text-sm">No forward links found</p>
              ) : (
                <div className="space-y-2">
                  {forwardLinks.map((link) => (
                    <div
                      key={link.id}
                      className="p-2 border rounded-lg hover:bg-accent cursor-pointer"
                      onClick={() => setSelectedNoteId(link.id)}
                    >
                      <div className="font-medium text-sm">{link.title}</div>
                      <div className="text-xs text-muted-foreground">{link.predicate}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-8 p-4 border-2 border-dashed border-muted rounded-lg text-center text-muted-foreground">
              <Network className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Interactive graph visualization coming soon</p>
              <p className="text-xs">Will show visual connections between notes</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="border-t p-4 flex items-center justify-between">
        <StatusLock />
        {hasChanges && (
          <div className="text-xs text-orange-500">
            Unsaved changes (⌘S to save)
          </div>
        )}
      </div>
    </div>
  );
}