'use client';

import { useState } from 'react';
import { Search, Menu, Moon, Sun, Lock, User, Settings, LogOut } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { useUIStore } from '../lib/ui-store';
import { KeyManager } from '@avantle/core';

export function Topbar() {
  const {
    searchQuery,
    setSearchQuery,
    setSparqlModalOpen,
    toggleLeftSidebar,
    toggleRightSidebar,
    theme,
    setTheme
  } = useUIStore();

  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey && e.metaKey) {
      setSparqlModalOpen(true);
    }
  };

  const handleLogout = () => {
    KeyManager.clearKey();
    window.location.reload();
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleLeftSidebar}
            className="xl:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-semibold text-lg">
                Notes<span className="text-blue-600">.Avantle.AI</span>
              </h1>
              <div className="text-xs text-muted-foreground">v1.1.3</div>
            </div>
          </div>
        </div>

        {/* Center - Search */}
        <div className="flex-1 max-w-xl mx-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search notes... (⌘⇧K for SPARQL)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="relative"
          >
            <Lock className="h-5 w-5 text-green-500" />
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-green-500 rounded-full animate-pulse" />
          </Button>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
            >
              <User className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleRightSidebar}
            className="2xl:hidden"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}