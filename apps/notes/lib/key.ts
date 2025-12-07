import { CryptoService } from './crypto';
import { StoreService } from './store';

export class KeyManager {
  private static currentKey: CryptoKey | null = null;

  static async deriveKey(password: string): Promise<CryptoKey> {
    let salt = StoreService.getSalt();
    if (!salt) {
      salt = CryptoService.generateSalt();
      StoreService.setSalt(salt);
    }
    
    this.currentKey = await CryptoService.deriveKey(password, salt);
    return this.currentKey;
  }

  static getCurrentKey(): CryptoKey | null {
    return this.currentKey;
  }

  static clearKey(): void {
    this.currentKey = null;
  }
}