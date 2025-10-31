import { Lock } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t bg-muted/50 p-4">
      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
        <Lock className="h-3 w-3" />
        <span>End-to-end encrypted • Data never leaves your device</span>
      </div>
    </footer>
  );
}