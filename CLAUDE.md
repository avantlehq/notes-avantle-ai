# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Platform Context: Avantle.ai Private Agents

This repository contains **notes.avantle.ai** - a Private Agent for encrypted knowledge management that's part of the broader Avantle.ai platform. Avantle.ai is building the new standard for data-sovereign AI through Private Agents that run locally with end-to-end encryption.

## 🎨 **Avantle.ai Unified Styling System**

**⚠️ MANDATORY: Používaj jednotný Avantle.ai styling guide implementovaný v `apps/notes/app/globals.css`**

Projekt využíva unifikovaný styling system adaptovaný pre Notes/Knowledge domain:

### **Notes Color System**
```css
/* Notes-specific category colors */
--color-blue: #4A90E2;    /* Main/Dashboard */
--color-green: #7ED321;   /* Knowledge/Notes */
--color-orange: #F5A623;  /* Editing/Creation */
--color-red: #FF6B6B;     /* Delete/Archive */
--color-purple: #9B59B6;  /* Settings/Export */
--color-gray: #A9A9A9;    /* Search/Neutral */

/* Standardized opacity variables */
--border-opacity: 0.3;     /* 30% for border accents */
--icon-opacity: 0.15;      /* 15% for icon backgrounds */
--hover-opacity: 0.25;     /* 25% for hover states */
--underline-opacity: 0.4;  /* 40% for underline accents */
```

### **Ultra-soft Dark Theme (RGB 25,39,52)**
- **Background**: `#192734` - professional knowledge management theme
- **Cards**: `#1F2D3A` - subtle elevation for note components
- **Borders**: `#2F404E` - refined contrast for clear UI separation
- **Inter font family** - modern, professional typography

### **Component Styling Rules**
```tsx
// ✅ CORRECT - Clean Tailwind utilities
<div className="avantle-border bg-card backdrop-blur-sm border-l-4 border-l-notes-green shadow-sm hover:shadow-md transition-shadow">

// ✅ CORRECT - Category color integration
<div className="p-2 rounded-lg bg-icon-green hover:bg-icon-green-hover transition-colors">
  <Icon style={{ color: 'var(--color-green)' }} />
</div>

// ❌ WRONG - Inline calculations
<div style={{ borderColor: `rgb(126 211 33 / var(--border-opacity))` }}>
```

### **Page Color Mapping (Notes Domain)**
- **Dashboard**: Blue theme (`var(--color-blue)`)
- **Notes/Knowledge**: Green theme (`var(--color-green)`)  
- **Editor/Creation**: Orange theme (`var(--color-orange)`)
- **Delete/Archive**: Red theme (`var(--color-red)`)
- **Settings**: Purple theme (`var(--color-purple)`)
- **Search**: Gray theme (`var(--color-gray)`)

**🎯 Result**: Professional, consistent knowledge management UI s enterprise-grade polish pre Private Agent scaling.

### The Private Agent Mission
- **Data Sovereignty**: AI runs where your data resides (device/on-premise), never in external clouds
- **End-to-End Encryption**: Only you control access to your data
- **Offline-First**: Intelligence remains operational without internet connectivity
- **GDPR/Compliance Ready**: Built for European privacy standards

### Platform Applications
- **notes.avantle.ai** (this repo): Encrypted knowledge base with AI summarization
- **dpo.avantle.ai**: GDPR & compliance management agent
- **risk.avantle.ai**: Corporate risk management and ISO process support

## Development Commands

### Primary Commands
- `pnpm install` - Install dependencies  
- `pnpm dev` - Start development server (runs on http://localhost:3000)
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint

### Project Structure
The repository contains both a notes application and a DPO (Direct Preference Optimization) platform:

- `notes-avantle-ai/` - Main notes application (active development)
- `dpo-avantle-ai/` - DPO platform (placeholder, not yet implemented)

Working directory for notes app: `apps/notes/`

## Architecture Overview

### Core Application Structure
The notes application is built as a **Private Agent for encrypted knowledge management** using:

- **Framework**: Next.js 15 with TypeScript, App Router
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB for local encrypted storage
- **Security**: AES-GCM encryption with PBKDF2 key derivation

### Key Components & Flow

1. **Authentication Flow** (`src/app/page.tsx`):
   - Password-based key derivation (no accounts)
   - Three view modes: `login` → `list` → `edit`
   - Master password creates encryption key locally

2. **Encryption Layer** (`src/lib/`):
   - `crypto.ts`: AES-GCM encryption/decryption with secure key derivation
   - `key.ts`: Key management and password-based key derivation
   - `store.ts`: IndexedDB interface for encrypted note storage

3. **UI Components** (`src/components/`):
   - `Editor.tsx`: Note editing interface with auto-save
   - `NoteList.tsx`: Encrypted note listing and management

### Private Agent Security Architecture
This application embodies core Private Agent principles:

- **Local-First**: All data stays in browser (IndexedDB + localStorage) - no external servers
- **End-to-End Encryption**: Notes encrypted with AES-GCM before storage using user's password
- **Data Sovereignty**: User controls 100% of their data through password-based key derivation
- **Offline Capable**: Functions completely without internet connectivity
- **Zero Knowledge**: Password never transmitted; keys derived locally with PBKDF2 (100k iterations)

### Private Agent Data Flow
1. **Key Derivation**: User password → PBKDF2 + random salt → AES-GCM key
2. **Encryption**: Notes encrypted client-side before IndexedDB storage
3. **Access Control**: Notes decrypted only when user provides correct password
4. **Security**: Key exists only in memory (cleared on logout)

## Development Notes

### Private Agent Development Principles
- **Privacy by Design**: All note content encrypted using `CryptoService.encrypt()` before storage
- **Local Intelligence**: Decryption happens in `Editor` component - no server calls
- **Data Residency**: Salt generated once per browser, stored in localStorage
- **Zero Server Dependency**: Never store plaintext content anywhere except memory

### Future AI Integration
This foundation supports planned AI features while maintaining privacy:
- Local AI summarization of encrypted notes
- SPARQL-based knowledge graph queries
- Semantic search across encrypted content
- All AI processing happens client-side with encrypted data

### State Management
- No external state management library (maintains local-first principle)
- Key management handled by `KeyManager` singleton
- Note state managed locally in components
- Store initialization required before any database operations