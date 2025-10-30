const fs = require('fs');
const path = require('path');

console.log('🔧 Preparing build environment...');

// Create core package
const coreDir = path.join(__dirname, '../../../core/packages/core');
const coreDistDir = path.join(coreDir, 'dist');

fs.mkdirSync(coreDir, { recursive: true });
fs.mkdirSync(coreDistDir, { recursive: true });

fs.writeFileSync(path.join(coreDir, 'package.json'), JSON.stringify({
  "name": "@avantle/core",
  "version": "0.1.0",
  "main": "dist/index.js"
}, null, 2));

const coreJs = `export class CryptoService {
  static async deriveKey() { return {}; }
  static async encrypt() { return { data: '', iv: '' }; }
  static async decrypt() { return ''; }
  static generateSalt() { return new Uint8Array(32); }
}
export class StoreService {
  async init() {}
  async saveNote() {}
  async loadNote() { return null; }
  async listNotes() { return []; }
  async deleteNote() {}
  static getSalt() { return null; }
  static setSalt() {}
  static generateId() { return 'test-id'; }
}
export class RDFStore {
  addTriple() {}
  removeTriple() {}
  querySelect() { return []; }
  getNotesInFolder() { return []; }
  setNoteFolder() {}
  clear() {}
  getAllTriples() { return []; }
}`;

fs.writeFileSync(path.join(coreDistDir, 'index.js'), coreJs);

// Create UI package
const uiDir = path.join(__dirname, '../../../core/packages/ui');
const uiDistDir = path.join(uiDir, 'dist');

fs.mkdirSync(uiDir, { recursive: true });
fs.mkdirSync(uiDistDir, { recursive: true });

fs.writeFileSync(path.join(uiDir, 'package.json'), JSON.stringify({
  "name": "@avantle/ui",
  "version": "0.1.0",
  "main": "dist/index.js"
}, null, 2));

fs.writeFileSync(path.join(uiDistDir, 'index.js'), 'export function Footer() { return null; }');

console.log('✅ Stub packages created');

// Remove workspace dependencies from package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

delete packageJson.dependencies['@avantle/core'];
delete packageJson.dependencies['@avantle/ui'];

fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

console.log('✅ Removed workspace dependencies');
console.log('🚀 Ready for build!');
