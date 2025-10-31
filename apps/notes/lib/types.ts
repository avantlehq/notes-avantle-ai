export interface Folder {
  id: string;
  name: string;
  parentId?: string;
  encryptedName: string;
  created: number;
  updated: number;
}

export interface Note {
  id: string;
  folderId: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: number;
  encrypted: boolean;
}

export interface Message {
  id: string;
  noteId?: string;
  role: 'user' | 'ai';
  text: string;
  ts: number;
}

export interface UIState {
  selectedFolderId?: string;
  selectedNoteId?: string;
  isLeftSidebarOpen: boolean;
  isRightSidebarOpen: boolean;
  theme: 'light' | 'dark' | 'system';
  searchQuery: string;
  searchResults: Note[];
  activeTab: 'edit' | 'preview' | 'graph';
  isSparqlModalOpen: boolean;
}

export interface BacklinkResult {
  id: string;
  title: string;
  predicate: string;
}