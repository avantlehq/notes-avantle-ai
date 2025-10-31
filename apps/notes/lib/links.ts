import { DataService } from './data';
import { rdfStore } from '@avantle/core/rdf';

export function extractLinks(markdown: string): string[] {
  const linkRegex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;

  while ((match = linkRegex.exec(markdown)) !== null) {
    const linkText = match[1].trim();
    if (linkText && !links.includes(linkText)) {
      links.push(linkText);
    }
  }

  return links;
}

export function parseLinksToMarkdown(content: string): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    return `<span class="wiki-link" data-link="${linkText}">${linkText}</span>`;
  });
}

export async function resolveLink(linkText: string): Promise<string> {
  const dataService = DataService.getInstance();
  const normalizedTitle = linkText.trim();
  
  // Search for existing note with this title
  const allNotes = await dataService.listNotes();
  const existingNote = allNotes.find(note => 
    note.title.toLowerCase() === normalizedTitle.toLowerCase()
  );

  if (existingNote) {
    return existingNote.id;
  }

  // Create new note
  const noteId = dataService.generateId();
  const newNote = {
    id: noteId,
    folderId: 'inbox', // Default to inbox
    title: normalizedTitle,
    content: '',
    tags: [],
    updatedAt: Date.now(),
    encrypted: true
  };

  await dataService.saveNote(newNote);
  return noteId;
}

export async function updateNoteLinks(noteId: string, content: string): Promise<void> {
  const links = extractLinks(content);
  
  // Remove existing link triples for this note
  const existingTriples = await rdfStore.query(`
    SELECT ?o WHERE {
      note:${noteId} lce:linksTo ?o
    }
  `);

  for (const result of existingTriples.bindings) {
    await rdfStore.removeTriple(`note:${noteId}`, 'lce:linksTo', result.o.value);
  }

  // Add new link triples
  for (const linkText of links) {
    try {
      const linkedNoteId = await resolveLink(linkText);
      await rdfStore.addTriple(`note:${noteId}`, 'lce:linksTo', `note:${linkedNoteId}`);
    } catch (error) {
      console.error('Failed to resolve link:', linkText, error);
    }
  }
}

export function renderLinksInMarkdown(content: string, onLinkClick: (linkText: string) => void): string {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    return `<a href="#" class="wiki-link" onclick="handleWikiLinkClick('${linkText}')">${linkText}</a>`;
  });
}

// Global function for handling wiki link clicks
declare global {
  interface Window {
    handleWikiLinkClick: (linkText: string) => void;
  }
}