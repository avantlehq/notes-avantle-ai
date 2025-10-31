import { CryptoService, StoreService, KeyManager, rdfStore } from '@avantle/core';
import type { Folder, Note } from './types';

export class DataService {
  private store = new StoreService();
  private static instance: DataService;

  static getInstance(): DataService {
    if (!DataService.instance) {
      DataService.instance = new DataService();
    }
    return DataService.instance;
  }

  async init(): Promise<void> {
    await this.store.init();
    await rdfStore.init();
    await this.seedDefaultFolders();
  }

  private async seedDefaultFolders(): Promise<void> {
    const folders = await this.listFolders();
    if (folders.length === 0) {
      const defaultFolders = [
        { name: 'Inbox', id: 'inbox' },
        { name: 'Projects', id: 'projects' },
        { name: 'TODO', id: 'todo' },
        { name: 'Private', id: 'private' }
      ];

      for (const folder of defaultFolders) {
        await this.saveFolder({
          id: folder.id,
          name: folder.name,
          encryptedName: '',
          created: Date.now(),
          updated: Date.now()
        });
      }
    }
  }

  // Folders
  async saveFolder(folder: Folder): Promise<void> {
    const key = KeyManager.getCurrentKey();
    if (!key) throw new Error('No encryption key available');

    const encryptedName = await CryptoService.encrypt(folder.name, key);
    const encryptedFolder = {
      ...folder,
      encryptedName: JSON.stringify(encryptedName)
    };

    localStorage.setItem(`folder:${folder.id}`, JSON.stringify(encryptedFolder));
  }

  async loadFolder(id: string): Promise<Folder | null> {
    const key = KeyManager.getCurrentKey();
    if (!key) throw new Error('No encryption key available');

    const stored = localStorage.getItem(`folder:${id}`);
    if (!stored) return null;

    const folder = JSON.parse(stored);
    const decryptedName = await CryptoService.decrypt(
      JSON.parse(folder.encryptedName),
      key
    );

    return {
      ...folder,
      name: decryptedName
    };
  }

  async listFolders(): Promise<Folder[]> {
    const key = KeyManager.getCurrentKey();
    if (!key) return [];

    const folders: Folder[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (storageKey?.startsWith('folder:')) {
        const id = storageKey.replace('folder:', '');
        const folder = await this.loadFolder(id);
        if (folder) folders.push(folder);
      }
    }

    return folders.sort((a, b) => a.created - b.created);
  }

  async deleteFolder(id: string): Promise<void> {
    localStorage.removeItem(`folder:${id}`);
    await rdfStore.removeSubject(`folder:${id}`);
  }

  // Notes
  async saveNote(note: Note): Promise<void> {
    const key = KeyManager.getCurrentKey();
    if (!key) throw new Error('No encryption key available');

    const encryptedContent = await CryptoService.encrypt(note.content, key);
    const encryptedTitle = await CryptoService.encrypt(note.title, key);
    
    const encryptedNote = {
      id: note.id,
      folderId: note.folderId,
      encrypted: {
        title: encryptedTitle,
        content: encryptedContent,
        tags: await Promise.all(
          note.tags.map(tag => CryptoService.encrypt(tag, key))
        )
      },
      updatedAt: note.updatedAt
    };

    await this.store.saveNote(note.id, encryptedNote, note.title);
    
    // Update RDF triples
    await rdfStore.addTriple(`note:${note.id}`, 'lce:inFolder', `folder:${note.folderId}`);
  }

  async loadNote(id: string): Promise<Note | null> {
    const key = KeyManager.getCurrentKey();
    if (!key) throw new Error('No encryption key available');

    const stored = await this.store.loadNote(id);
    if (!stored?.encrypted) return null;

    const title = await CryptoService.decrypt(stored.encrypted.title, key);
    const content = await CryptoService.decrypt(stored.encrypted.content, key);
    const tags = await Promise.all(
      stored.encrypted.tags.map((tag: any) => CryptoService.decrypt(tag, key))
    );

    return {
      id: stored.id,
      folderId: stored.folderId,
      title,
      content,
      tags,
      updatedAt: stored.updatedAt,
      encrypted: true
    };
  }

  async listNotes(folderId?: string): Promise<Note[]> {
    const key = KeyManager.getCurrentKey();
    if (!key) return [];

    const storedNotes = await this.store.listNotes();
    const notes: Note[] = [];

    for (const stored of storedNotes) {
      if (folderId && stored.folderId !== folderId) continue;
      
      try {
        const note = await this.loadNote(stored.id);
        if (note) notes.push(note);
      } catch (error) {
        console.error('Failed to decrypt note:', error);
      }
    }

    return notes.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  async deleteNote(id: string): Promise<void> {
    await this.store.deleteNote(id);
    await rdfStore.removeSubject(`note:${id}`);
  }

  async searchNotes(query: string): Promise<Note[]> {
    const allNotes = await this.listNotes();
    const lowerQuery = query.toLowerCase();
    
    return allNotes.filter(note => 
      note.title.toLowerCase().includes(lowerQuery) ||
      note.content.toLowerCase().includes(lowerQuery) ||
      note.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  async getNoteCount(folderId: string): Promise<number> {
    const notes = await this.listNotes(folderId);
    return notes.length;
  }

  generateId(): string {
    return crypto.randomUUID();
  }
}