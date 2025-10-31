'use client';

import { useState, useEffect } from 'react';
import { Plus, Folder, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { useUIStore } from '../lib/ui-store';
import { DataService } from '../lib/data';
import type { Folder as FolderType } from '../lib/types';

export function SidebarFolders() {
  const { selectedFolderId, setSelectedFolderId } = useUIStore();
  const [folders, setFolders] = useState<FolderType[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [noteCounts, setNoteCounts] = useState<Record<string, number>>({});

  const dataService = DataService.getInstance();

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    loadNoteCounts();
  }, [folders]);

  const loadFolders = async () => {
    try {
      const folderList = await dataService.listFolders();
      setFolders(folderList);
      if (!selectedFolderId && folderList.length > 0) {
        setSelectedFolderId(folderList[0].id);
      }
    } catch (error) {
      console.error('Failed to load folders:', error);
    }
  };

  const loadNoteCounts = async () => {
    const counts: Record<string, number> = {};
    for (const folder of folders) {
      try {
        counts[folder.id] = await dataService.getNoteCount(folder.id);
      } catch (error) {
        console.error('Failed to load note count for folder:', folder.id, error);
        counts[folder.id] = 0;
      }
    }
    setNoteCounts(counts);
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      const folder: FolderType = {
        id: dataService.generateId(),
        name: newFolderName.trim(),
        encryptedName: '',
        created: Date.now(),
        updated: Date.now()
      };

      await dataService.saveFolder(folder);
      await loadFolders();
      setIsCreating(false);
      setNewFolderName('');
    } catch (error) {
      console.error('Failed to create folder:', error);
    }
  };

  const handleEditFolder = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      const folder = folders.find(f => f.id === id);
      if (folder) {
        const updated = {
          ...folder,
          name: editingName.trim(),
          updated: Date.now()
        };
        await dataService.saveFolder(updated);
        await loadFolders();
        setEditingId(null);
        setEditingName('');
      }
    } catch (error) {
      console.error('Failed to update folder:', error);
    }
  };

  const handleDeleteFolder = async (id: string) => {
    if (!confirm('Are you sure you want to delete this folder? This will not delete the notes inside.')) {
      return;
    }

    try {
      await dataService.deleteFolder(id);
      await loadFolders();
      if (selectedFolderId === id) {
        setSelectedFolderId(folders[0]?.id);
      }
    } catch (error) {
      console.error('Failed to delete folder:', error);
    }
  };

  const startEditing = (folder: FolderType) => {
    setEditingId(folder.id);
    setEditingName(folder.name);
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
            Folders
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCreating(true)}
            className="h-6 w-6"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {isCreating && (
          <div className="mb-3">
            <Input
              placeholder="Folder name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                if (e.key === 'Escape') {
                  setIsCreating(false);
                  setNewFolderName('');
                }
              }}
              autoFocus
              className="h-8"
            />
          </div>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {folders.map((folder) => (
            <div
              key={folder.id}
              className={`group relative rounded-lg p-2 cursor-pointer transition-colors ${
                selectedFolderId === folder.id
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              }`}
              onClick={() => setSelectedFolderId(folder.id)}
            >
              <div className="flex items-center gap-2">
                <Folder className="h-4 w-4 flex-shrink-0" />
                
                {editingId === folder.id ? (
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleEditFolder(folder.id);
                      if (e.key === 'Escape') {
                        setEditingId(null);
                        setEditingName('');
                      }
                    }}
                    onBlur={() => handleEditFolder(folder.id)}
                    autoFocus
                    className="h-6 text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex-1 flex items-center justify-between min-w-0">
                    <span className="text-sm font-medium truncate">
                      {folder.name}
                    </span>
                    <span className="text-xs opacity-60 ml-2">
                      {noteCounts[folder.id] || 0}
                    </span>
                  </div>
                )}

                {editingId !== folder.id && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(folder);
                      }}
                      className="h-6 w-6"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFolder(folder.id);
                      }}
                      className="h-6 w-6"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}