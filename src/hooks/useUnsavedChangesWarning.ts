import { useEffect, useState, useContext, useCallback } from 'react';
import { UNSAFE_NavigationContext as NavigationContext } from 'react-router-dom';

/**
 * Hook para prevenir que o utilizador perca dados de formulários não guardados.
 *
 * NOTA: Como a app usa <BrowserRouter> e não um Data Router (createBrowserRouter),
 * o hook `useBlocker` nativo não funciona e causa um erro "Algo correu mal".
 * Esta é uma implementação customizada baseada no UNSAFE_NavigationContext.
 * 
 * @param isDirty Booleano que indica se existem alterações por guardar.
 */
export function useUnsavedChangesWarning(isDirty: boolean) {
  // ==========================================
  // Proteção Externa (Ações do Browser)
  // ==========================================
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isDirty) {
        event.preventDefault();
        event.returnValue = ''; 
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isDirty]);

  // ==========================================
  // Proteção Interna (Navegação na App via NavigationContext)
  // ==========================================
  const navigator = useContext(NavigationContext).navigator as any;
  const [blockedTx, setBlockedTx] = useState<any>(null);

  useEffect(() => {
    if (!isDirty || !navigator.block) return;

    // A função block aciona sempre que há tentativa de navegação
    const unblock = navigator.block((tx: any) => {
      // Guarda a transação para ser retomada (ou cancelada)
      setBlockedTx(tx);
    });

    return unblock;
  }, [navigator, isDirty]);

  const proceed = useCallback(() => {
    if (blockedTx) {
      const tx = blockedTx;
      setBlockedTx(null); // Reseta a UI
      tx.retry(); // Efetua a navegação bloqueada
    }
  }, [blockedTx]);

  const reset = useCallback(() => {
    setBlockedTx(null);
  }, []);

  return {
    state: blockedTx ? 'blocked' : 'unblocked',
    proceed,
    reset
  };
}
