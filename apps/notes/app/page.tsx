'use client';

import { useState, useEffect } from 'react';
import { KeyManager } from '@avantle/core';
import { Topbar } from '../components/topbar';
import { SidebarFolders } from '../components/sidebar-folders';
import { SidebarNotes } from '../components/sidebar-notes';
import { NoteEditor } from '../components/note-editor';
import { ChatPanel } from '../components/chat-panel';
import { Sheet, SheetContent, SheetTrigger } from '../components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useUIStore } from '../lib/ui-store';
import { DataService } from '../lib/data';

type ViewMode = 'login' | 'app';

export default function Home() {
  const [viewMode, setViewMode] = useState<ViewMode>('login');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { isLeftSidebarOpen, isRightSidebarOpen, setLeftSidebarOpen, setRightSidebarOpen } = useUIStore();

  useEffect(() => {
    // Check if user already has a key (e.g., from previous session)
    if (KeyManager.getCurrentKey()) {
      initializeApp();
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setIsLoading(true);
    setError('');
    
    try {
      await KeyManager.deriveKey(password);
      await initializeApp();
      setViewMode('app');
      setPassword('');
    } catch (err) {
      setError('Failed to unlock. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initializeApp = async () => {
    try {
      const dataService = DataService.getInstance();
      await dataService.init();
    } catch (error) {
      console.error('Failed to initialize app:', error);
    }
  };

  if (viewMode === 'login') {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">A</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Notes<span className="text-blue-400">.Avantle.AI</span>
            </h1>
            <p className="text-gray-300">Private Agent for encrypted knowledge management</p>
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
              {isLoading ? 'Unlocking...' : 'Access Private Notes'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              🔒 Your password creates a unique encryption key for your notes.<br/>
              Data sovereignty: Everything stays on your device.
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      <Topbar />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Layout: 4 columns */}
        <div className="hidden 2xl:flex w-full">
          {/* C1: Folders */}
          <div className="w-60 border-r">
            <SidebarFolders />
          </div>
          
          {/* C2: Notes */}
          <div className="w-80 border-r">
            <SidebarNotes />
          </div>
          
          {/* C3: Editor */}
          <div className="flex-1">
            <NoteEditor />
          </div>
          
          {/* C4: Chat */}
          <div className="w-96 border-l">
            <ChatPanel />
          </div>
        </div>

        {/* Large screens: Hide chat in sheet */}
        <div className="hidden xl:flex 2xl:hidden w-full">
          {/* C1: Folders */}
          <div className="w-60 border-r">
            <SidebarFolders />
          </div>
          
          {/* C2: Notes */}
          <div className="w-80 border-r">
            <SidebarNotes />
          </div>
          
          {/* C3: Editor */}
          <div className="flex-1">
            <NoteEditor />
          </div>
          
          {/* C4: Chat Sheet */}
          <Sheet open={isRightSidebarOpen} onOpenChange={setRightSidebarOpen}>
            <SheetContent side="right" className="w-96 p-0">
              <ChatPanel />
            </SheetContent>
          </Sheet>
        </div>

        {/* Medium screens: Hide folders+notes in sheet */}
        <div className="flex xl:hidden w-full">
          {/* Main content: Editor */}
          <div className="flex-1">
            <NoteEditor />
          </div>
          
          {/* Left Sheet: Folders + Notes */}
          <Sheet open={isLeftSidebarOpen} onOpenChange={setLeftSidebarOpen}>
            <SheetContent side="left" className="w-80 p-0">
              <Tabs defaultValue="folders" className="h-full flex flex-col">
                <TabsList className="m-4 grid w-auto grid-cols-2">
                  <TabsTrigger value="folders">Folders</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="folders" className="flex-1 mt-0">
                  <SidebarFolders />
                </TabsContent>
                <TabsContent value="notes" className="flex-1 mt-0">
                  <SidebarNotes />
                </TabsContent>
              </Tabs>
            </SheetContent>
          </Sheet>
          
          {/* Right Sheet: Chat */}
          <Sheet open={isRightSidebarOpen} onOpenChange={setRightSidebarOpen}>
            <SheetContent side="right" className="w-96 p-0">
              <ChatPanel />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </div>
  );
}