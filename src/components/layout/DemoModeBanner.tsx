import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export function DemoModeBanner() {
  const { isDemoMode } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (!isDemoMode || dismissed) return null;

  return (
    <div className="relative flex items-center justify-center gap-2 bg-secondary px-4 py-2 text-secondary-foreground text-sm font-medium">
      <AlertTriangle className="h-4 w-4 shrink-0" />
      <span>
        Demo Mode — Backend is not connected. Showing sample data.
      </span>
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 rounded-sm p-0.5 hover:bg-secondary-foreground/10 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
