import React from 'react';
import { Button } from './ui/button';

export function ResetApp() {
  const resetApp = () => {
    if (!confirm('Tem a certeza que quer repor a aplicação para o estado por defeito? Isto eliminará dados locais.')) return;

    try {
      // Remove known app keys
      const keysToRemove = ['appointments', 'history_appointments', 'users'];
      keysToRemove.forEach((k) => localStorage.removeItem(k));

      // Remove password_* keys
      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (!key) continue;
        if (key.startsWith('password_')) localStorage.removeItem(key);
      }

      // Optionally clear other app-specific keys if needed
    } catch (e) {
      // ignore errors
    }

    // Reload to let the app re-seed defaults
    window.location.reload();
  };

  return (
    <div className="px-4 py-2">
      <Button onClick={resetApp} variant="destructive">
        Repor aplicação (estado por defeito)
      </Button>
    </div>
  );
}

export default ResetApp;
