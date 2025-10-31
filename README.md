# Notes.Avantle.AI

A Private Agent for encrypted knowledge management - part of the Avantle.AI platform for data-sovereign AI.

## 🔒 Private Agent Features

- **End-to-End Encryption**: All notes encrypted locally with AES-GCM
- **Data Sovereignty**: Your data never leaves your device
- **Offline-First**: Full functionality without internet connectivity
- **[[Wiki Links]]**: Connect notes with automatic backlink detection
- **RDF Knowledge Graph**: Semantic relationships between notes
- **AI Chat Assistant**: @notes helps summarize, find related content, and suggest tags
- **4-Column UI**: Optimized for knowledge management workflows

## 🏗️ Architecture

Built as a **Private Agent** with:
- **Local Encryption**: PBKDF2 key derivation + AES-GCM encryption
- **RDF Triple Store**: Local knowledge graph for semantic relationships
- **Responsive Layout**: Adaptive 4-column interface that works on all screen sizes
- **Zero Network Dependency**: Everything runs locally in your browser

## 🚀 How to Run

### Prerequisites
- Node.js 18+
- pnpm

### Installation

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Start development server**:
   ```bash
   pnpm dev
   ```

3. **Open browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

4. **Create master password**:
   - First time: Create any password (becomes your encryption key)
   - Returning: Enter your existing password to unlock notes

### Building for Production

```bash
# Build all packages
pnpm build

# Start production server
pnpm start
```

## 🗂️ Project Structure

```
notes-avantle-ai/
├── apps/notes/               # Main Next.js application
│   ├── app/                  # App Router pages
│   ├── components/           # UI components
│   │   ├── sidebar-folders.tsx
│   │   ├── sidebar-notes.tsx
│   │   ├── note-editor.tsx
│   │   ├── chat-panel.tsx
│   │   └── ui/              # shadcn/ui components
│   └── lib/                 # Core logic
│       ├── data.ts          # Encrypted data service
│       ├── links.ts         # [[Wiki Links]] parsing
│       ├── graph.ts         # RDF graph operations
│       └── sparql.ts        # Local SPARQL queries
├── core/packages/
│   ├── core/                # @avantle/core - Encryption & RDF
│   └── ui/                  # @avantle/ui - Shared components
└── turbo.json               # Turborepo configuration
```

## 🔐 Security & Privacy

- **Password-based encryption**: Your master password derives a unique encryption key
- **No account required**: Everything is local to your device
- **No telemetry**: Zero data collection or external network calls
- **GDPR compliant**: Built with European privacy standards
- **Audit-ready**: All crypto operations use standard Web Crypto APIs

## 🎯 Usage

### Creating Notes
1. Select a folder from the left sidebar
2. Click "+" to create a new note
3. Notes are automatically encrypted when saved (Ctrl/Cmd+S)

### Organizing with Folders
- Create custom folders for different projects
- Notes are organized by folder with encrypted names
- Folder structure is preserved locally

### Linking Notes with [[Wiki Links]]
- Use `[[Note Title]]` to link between notes
- Links automatically create new notes if they don't exist
- View backlinks in the Graph tab of any note

### AI Assistant (@notes)
- Summarize current note content
- Find related notes based on similarity
- Generate tag suggestions
- Search across all encrypted content

### Graph View
- See connections between notes
- Explore backlinks and forward links
- Visual knowledge graph (coming soon)

---

**Built with Privacy by Design** • Part of the [Avantle.AI](https://avantle.ai) Private Agent Platform