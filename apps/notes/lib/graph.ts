import { rdfStore } from '@avantle/core';
import { DataService } from './data';
import type { BacklinkResult } from './types';

export async function addFolderTriple(noteId: string, folderId: string): Promise<void> {
  await rdfStore.addTriple(`note:${noteId}`, 'lce:inFolder', `folder:${folderId}`);
}

export async function addLinksTriples(noteId: string, linkNoteIds: string[]): Promise<void> {
  // Remove existing links
  const existingLinks = await rdfStore.query(`
    SELECT ?o WHERE {
      note:${noteId} lce:linksTo ?o
    }
  `);

  for (const result of existingLinks.bindings) {
    await rdfStore.removeTriple(`note:${noteId}`, 'lce:linksTo', result.o.value);
  }

  // Add new links
  for (const linkedNoteId of linkNoteIds) {
    await rdfStore.addTriple(`note:${noteId}`, 'lce:linksTo', `note:${linkedNoteId}`);
  }
}

export async function getBacklinks(noteId: string): Promise<BacklinkResult[]> {
  const results = await rdfStore.getBacklinks(noteId);
  const dataService = DataService.getInstance();
  const backlinks: BacklinkResult[] = [];

  for (const result of results) {
    try {
      const note = await dataService.loadNote(result.id);
      if (note) {
        backlinks.push({
          id: result.id,
          title: note.title,
          predicate: result.predicate
        });
      }
    } catch (error) {
      console.error('Failed to load backlink note:', error);
    }
  }

  return backlinks;
}

export async function getForwardLinks(noteId: string): Promise<BacklinkResult[]> {
  const results = await rdfStore.query(`
    SELECT ?o WHERE {
      note:${noteId} lce:linksTo ?o
    }
  `);

  const dataService = DataService.getInstance();
  const links: BacklinkResult[] = [];

  for (const result of results.bindings) {
    const linkedNoteId = result.o.value.replace('note:', '');
    try {
      const note = await dataService.loadNote(linkedNoteId);
      if (note) {
        links.push({
          id: linkedNoteId,
          title: note.title,
          predicate: 'lce:linksTo'
        });
      }
    } catch (error) {
      console.error('Failed to load linked note:', error);
    }
  }

  return links;
}

export async function findRelatedNotes(noteId: string): Promise<BacklinkResult[]> {
  const [backlinks, forwardLinks] = await Promise.all([
    getBacklinks(noteId),
    getForwardLinks(noteId)
  ]);

  // Combine and deduplicate
  const allLinks = [...backlinks, ...forwardLinks];
  const uniqueLinks = allLinks.filter((link, index, array) => 
    array.findIndex(l => l.id === link.id) === index
  );

  return uniqueLinks;
}

export async function getGraphData(noteId: string) {
  const [backlinks, forwardLinks] = await Promise.all([
    getBacklinks(noteId),
    getForwardLinks(noteId)
  ]);

  const nodes = [
    { id: noteId, type: 'current' },
    ...backlinks.map(link => ({ id: link.id, type: 'backlink', title: link.title })),
    ...forwardLinks.map(link => ({ id: link.id, type: 'forwardlink', title: link.title }))
  ];

  const edges = [
    ...backlinks.map(link => ({ from: link.id, to: noteId, type: 'backlink' })),
    ...forwardLinks.map(link => ({ from: noteId, to: link.id, type: 'forwardlink' }))
  ];

  return { nodes, edges };
}

export async function runSparqlQuery(query: string): Promise<any> {
  try {
    return await rdfStore.query(query);
  } catch (error) {
    console.error('SPARQL query error:', error);
    return { bindings: [] };
  }
}