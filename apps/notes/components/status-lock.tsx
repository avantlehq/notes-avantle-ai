import { Lock, Shield } from 'lucide-react';
import { KeyManager } from '@avantle/core';

export function StatusLock() {
  const hasKey = KeyManager.getCurrentKey() !== null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {hasKey ? (
        <>
          <Shield className="h-3 w-3 text-green-500" />
          <span>Encrypted locally</span>
        </>
      ) : (
        <>
          <Lock className="h-3 w-3 text-orange-500" />
          <span>Key required</span>
        </>
      )}
    </div>
  );
}