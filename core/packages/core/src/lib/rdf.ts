export interface Triple {
  subject: string;
  predicate: string;
  object: string;
}

export interface QueryResult {
  bindings: Record<string, { value: string }>[];
}

export class RDFStore {
  private triples: Triple[] = [];
  private static readonly STORE_KEY = 'avantle_rdf_triples';

  async init(): Promise<void> {
    const stored = localStorage.getItem(RDFStore.STORE_KEY);
    if (stored) {
      this.triples = JSON.parse(stored);
    }
  }

  async addTriple(subject: string, predicate: string, object: string): Promise<void> {
    const existing = this.triples.find(
      t => t.subject === subject && t.predicate === predicate && t.object === object
    );
    if (!existing) {
      this.triples.push({ subject, predicate, object });
      await this.persist();
    }
  }

  async removeTriple(subject: string, predicate: string, object: string): Promise<void> {
    this.triples = this.triples.filter(
      t => !(t.subject === subject && t.predicate === predicate && t.object === object)
    );
    await this.persist();
  }

  async removeSubject(subject: string): Promise<void> {
    this.triples = this.triples.filter(t => t.subject !== subject);
    await this.persist();
  }

  async query(sparql: string): Promise<QueryResult> {
    // Simple SPARQL implementation for basic SELECT queries
    const selectMatch = sparql.match(/SELECT\s+(.+?)\s+WHERE\s*\{(.+?)\}/i);
    if (!selectMatch) {
      return { bindings: [] };
    }

    const variables = selectMatch[1].trim().split(/\s+/);
    const whereClause = selectMatch[2].trim();
    
    // Parse simple triple patterns like "?s lce:linksTo ?o"
    const triplePatterns = whereClause.split('.').map(p => p.trim()).filter(Boolean);
    const bindings: Record<string, { value: string }>[] = [];

    for (const triple of this.triples) {
      const binding: Record<string, { value: string }> = {};
      let matches = true;

      for (const pattern of triplePatterns) {
        const parts = pattern.split(/\s+/);
        if (parts.length === 3) {
          const [s, p, o] = parts;
          
          if (s.startsWith('?')) binding[s.slice(1)] = { value: triple.subject };
          else if (s !== triple.subject) matches = false;
          
          if (p.startsWith('?')) binding[p.slice(1)] = { value: triple.predicate };
          else if (p !== triple.predicate) matches = false;
          
          if (o.startsWith('?')) binding[o.slice(1)] = { value: triple.object };
          else if (o !== triple.object) matches = false;
        }
      }

      if (matches) {
        bindings.push(binding);
      }
    }

    return { bindings };
  }

  async getBacklinks(noteId: string): Promise<Array<{ id: string; predicate: string }>> {
    const results = this.triples
      .filter(t => t.object === `note:${noteId}`)
      .map(t => ({
        id: t.subject.replace('note:', ''),
        predicate: t.predicate
      }));
    return results;
  }

  private async persist(): Promise<void> {
    localStorage.setItem(RDFStore.STORE_KEY, JSON.stringify(this.triples));
  }
}

export const rdfStore = new RDFStore();