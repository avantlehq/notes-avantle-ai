'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Search, Tag as TagIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { useUIStore } from '../lib/ui-store';
import { DataService } from '../lib/data';
import { simulate } from '../lib/sparql';
import type { Message, Note } from '../lib/types';

export function ChatPanel() {
  const { selectedNoteId, messages, addMessage, clearMessages } = useUIStore();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const dataService = DataService.getInstance();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const handleSend = async () => {
    const message = input.trim();
    if (!message || isLoading) return;

    setInput('');
    setIsLoading(true);

    // Add user message
    addMessage({
      role: 'user',
      text: message,
      noteId: selectedNoteId
    });

    try {
      const response = await processMessage(message);
      addMessage({
        role: 'ai',
        text: response,
        noteId: selectedNoteId
      });
    } catch (error) {
      addMessage({
        role: 'ai',
        text: 'Sorry, I encountered an error processing your request.',
        noteId: selectedNoteId
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processMessage = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();

    // Summarize current note
    if (lowerMessage.includes('summarize') && selectedNoteId) {
      const note = await dataService.loadNote(selectedNoteId);
      if (note) {
        return `**Summary of "${note.title}":**\n\n` +
               `This note contains ${note.content.length} characters and is tagged with: ${note.tags.join(', ') || 'no tags'}.\n\n` +
               `Key content: ${note.content.substring(0, 200)}${note.content.length > 200 ? '...' : ''}`;
      }
    }

    // Find related notes
    if (lowerMessage.includes('related') || lowerMessage.includes('similar')) {
      if (selectedNoteId) {
        const note = await dataService.loadNote(selectedNoteId);
        if (note) {
          const searchResults = await dataService.searchNotes(note.title.split(' ')[0]);
          const related = searchResults.filter(n => n.id !== selectedNoteId).slice(0, 3);
          
          if (related.length > 0) {
            return `**Related notes:**\n\n` +
                   related.map(n => `• **${n.title}** - ${n.content.substring(0, 100)}...`).join('\n\n');
          } else {
            return 'No related notes found based on the current note\'s content.';
          }
        }
      }
      return 'Please select a note to find related content.';
    }

    // Generate tags
    if (lowerMessage.includes('tag') || lowerMessage.includes('suggest')) {
      if (selectedNoteId) {
        const note = await dataService.loadNote(selectedNoteId);
        if (note) {
          const words = note.content.toLowerCase().split(/\s+/);
          const commonWords = words
            .filter(word => word.length > 4 && !/^(the|and|that|with|for|are|but|not|you|all|can|had|her|was|one|our|out|day|get|has|him|his|how|its|new|now|old|see|two|way|who|boy|did|may|oil|sit|try|use)$/.test(word))
            .reduce((acc: Record<string, number>, word) => {
              acc[word] = (acc[word] || 0) + 1;
              return acc;
            }, {});
          
          const suggestedTags = Object.entries(commonWords)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5)
            .map(([word]) => word);

          return `**Suggested tags for "${note.title}":**\n\n` +
                 suggestedTags.map(tag => `• ${tag}`).join('\n') +
                 '\n\nThese suggestions are based on frequently used words in your note.';
        }
      }
      return 'Please select a note to generate tag suggestions.';
    }

    // Search functionality
    if (lowerMessage.startsWith('search ') || lowerMessage.startsWith('find ')) {
      const query = message.substring(message.indexOf(' ') + 1);
      try {
        const results = await simulate(`SELECT ?note ?title WHERE { ?note lce:title ?title . FILTER(contains(?title, "${query}")) }`);
        
        if (results.bindings.length > 0) {
          return `**Search results for "${query}":**\n\n` +
                 results.bindings.slice(0, 5).map((binding: any) => 
                   `• **${binding.title?.value || 'Untitled'}**`
                 ).join('\n');
        } else {
          const textResults = await dataService.searchNotes(query);
          if (textResults.length > 0) {
            return `**Search results for "${query}":**\n\n` +
                   textResults.slice(0, 5).map(note => 
                     `• **${note.title}** - ${note.content.substring(0, 100)}...`
                   ).join('\n\n');
          }
        }
        
        return `No results found for "${query}". Try different keywords or check your spelling.`;
      } catch (error) {
        return `Search error: ${error}`;
      }
    }

    // General AI response
    return `I'm @notes, your AI assistant for encrypted note management. I can help you:

• **Summarize** your current note
• **Find related** notes based on content
• **Suggest tags** for better organization  
• **Search** through your notes

Try asking: "summarize this note", "find related notes", or "search for [keyword]"`;
  };

  const handleQuickAction = async (action: string) => {
    setInput(`${action} `);
    inputRef.current?.focus();
  };

  const formatTimestamp = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-full flex flex-col bg-muted/10">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
              <Bot className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-sm">@notes</h2>
              <p className="text-xs text-muted-foreground">AI Assistant</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            disabled={messages.length === 0}
          >
            Clear
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('summarize')}
            disabled={!selectedNoteId}
          >
            <Sparkles className="h-3 w-3 mr-1" />
            Summarize
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('find related')}
            disabled={!selectedNoteId}
          >
            <Search className="h-3 w-3 mr-1" />
            Related
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleQuickAction('suggest tags')}
            disabled={!selectedNoteId}
          >
            <TagIcon className="h-3 w-3 mr-1" />
            Tags
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Bot className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Start a conversation with @notes</p>
            <p className="text-xs mt-1">Ask me to summarize, find related notes, or suggest tags</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'ai' && (
                  <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-white" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 ${
                    message.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.text}
                  </div>
                  <div className="text-xs opacity-70 mt-1">
                    {formatTimestamp(message.ts)}
                  </div>
                </div>

                {message.role === 'user' && (
                  <div className="h-6 w-6 rounded-full bg-accent flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3 w-3" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3 w-3 text-white" />
                </div>
                <div className="bg-muted rounded-lg px-3 py-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask @notes anything..."
            disabled={isLoading}
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">
          {selectedNoteId ? 'Context: Current note' : 'Select a note for better context'}
        </p>
      </div>
    </div>
  );
}