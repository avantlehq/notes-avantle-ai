import { runSparqlQuery } from './graph';
import { DataService } from './data';
import type { Note } from './types';

export async function simulate(query: string, notes?: Note[]): Promise<any> {
  // Try RDF store first
  try {
    const rdfResult = await runSparqlQuery(query);
    if (rdfResult.bindings.length > 0) {
      return rdfResult;
    }
  } catch (error) {
    console.warn('RDF query failed, falling back to local search:', error);
  }

  // Fallback to local note search
  const dataService = DataService.getInstance();
  const allNotes = notes || await dataService.listNotes();

  // Simple keyword-based search simulation
  const keywords = extractKeywords(query);
  const results = allNotes.filter(note => 
    keywords.some(keyword => 
      note.title.toLowerCase().includes(keyword.toLowerCase()) ||
      note.content.toLowerCase().includes(keyword.toLowerCase()) ||
      note.tags.some(tag => tag.toLowerCase().includes(keyword.toLowerCase()))
    )
  );

  return {
    bindings: results.map(note => ({
      note: { value: `note:${note.id}` },
      title: { value: note.title },
      content: { value: note.content.substring(0, 200) + '...' }
    }))
  };
}

function extractKeywords(query: string): string[] {
  // Extract keywords from SPARQL-like queries
  const keywordRegex = /["']([^"']+)["']|(\w+)/g;
  const keywords: string[] = [];
  let match;

  while ((match = keywordRegex.exec(query)) !== null) {
    const keyword = match[1] || match[2];
    if (keyword && !isStopWord(keyword)) {
      keywords.push(keyword);
    }
  }

  return keywords;
}

function isStopWord(word: string): boolean {
  const stopWords = ['SELECT', 'WHERE', 'FROM', 'AND', 'OR', 'NOT', 'IN', 'THE', 'A', 'AN'];
  return stopWords.includes(word.toUpperCase());
}

export async function searchNotesBySparql(query: string): Promise<Note[]> {
  const result = await simulate(query);
  const dataService = DataService.getInstance();
  const notes: Note[] = [];

  for (const binding of result.bindings) {
    if (binding.note?.value) {
      const noteId = binding.note.value.replace('note:', '');
      try {
        const note = await dataService.loadNote(noteId);
        if (note) notes.push(note);
      } catch (error) {
        console.error('Failed to load note from SPARQL result:', error);
      }
    }
  }

  return notes;
}

export function buildSparqlQuery(searchTerms: string[], filters?: { folder?: string; tags?: string[] }): string {
  let query = 'SELECT DISTINCT ?note ?title WHERE {\n';
  
  // Basic note pattern
  query += '  ?note rdf:type lce:Note .\n';
  query += '  ?note lce:title ?title .\n';
  
  // Folder filter
  if (filters?.folder) {
    query += `  ?note lce:inFolder folder:${filters.folder} .\n`;
  }
  
  // Tag filters
  if (filters?.tags && filters.tags.length > 0) {
    filters.tags.forEach((tag, index) => {
      query += `  ?note lce:hasTag "${tag}" .\n`;
    });
  }
  
  // Text search filter (simulated)
  if (searchTerms.length > 0) {
    query += '  # Text search would be implemented here\n';
  }
  
  query += '}';
  
  return query;
}