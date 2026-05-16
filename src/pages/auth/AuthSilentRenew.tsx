import { useEffect } from 'react';
import { userManager } from '../../contexts/AuthContext';

export default function AuthSilentRenew() {
  useEffect(() => {
    userManager.signinSilentCallback().catch(() => {
      // Silent renew failures are handled by AuthContext via the OIDC events.
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground">A renovar sessão...</p>
      </div>
    </div>
  );
}
