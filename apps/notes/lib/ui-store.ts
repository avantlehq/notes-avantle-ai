import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UIState, Note, Message } from './types';

interface UIStore extends UIState {
  // Folder & Note Selection
  setSelectedFolderId: (id?: string) => void;
  setSelectedNoteId: (id?: string) => void;
  
  // Sidebar Management
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
  setLeftSidebarOpen: (open: boolean) => void;
  setRightSidebarOpen: (open: boolean) => void;
  
  // Theme
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  
  // Search
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: Note[]) => void;
  clearSearch: () => void;
  
  // Editor Tabs
  setActiveTab: (tab: 'edit' | 'preview' | 'graph') => void;
  
  // SPARQL Modal
  setSparqlModalOpen: (open: boolean) => void;
  
  // Chat Messages (UI state only, not persisted)
  messages: Message[];
  addMessage: (message: Omit<Message, 'id' | 'ts'>) => void;
  clearMessages: () => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedFolderId: undefined,
      selectedNoteId: undefined,
      isLeftSidebarOpen: false,
      isRightSidebarOpen: false,
      theme: 'dark',
      searchQuery: '',
      searchResults: [],
      activeTab: 'edit',
      isSparqlModalOpen: false,
      messages: [],
      
      // Actions
      setSelectedFolderId: (id) => set({ selectedFolderId: id }),
      setSelectedNoteId: (id) => set({ selectedNoteId: id }),
      
      toggleLeftSidebar: () => set({ isLeftSidebarOpen: !get().isLeftSidebarOpen }),
      toggleRightSidebar: () => set({ isRightSidebarOpen: !get().isRightSidebarOpen }),
      setLeftSidebarOpen: (open) => set({ isLeftSidebarOpen: open }),
      setRightSidebarOpen: (open) => set({ isRightSidebarOpen: open }),
      
      setTheme: (theme) => set({ theme }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSearchResults: (results) => set({ searchResults: results }),
      clearSearch: () => set({ searchQuery: '', searchResults: [] }),
      
      setActiveTab: (tab) => set({ activeTab: tab }),
      
      setSparqlModalOpen: (open) => set({ isSparqlModalOpen: open }),
      
      addMessage: (message) => set({
        messages: [...get().messages, {
          ...message,
          id: crypto.randomUUID(),
          ts: Date.now()
        }]
      }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'notes-ui-store',
      partialize: (state) => ({
        theme: state.theme,
        selectedFolderId: state.selectedFolderId,
        selectedNoteId: state.selectedNoteId,
        activeTab: state.activeTab,
      }),
    }
  )
);