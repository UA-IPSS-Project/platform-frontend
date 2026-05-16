import { useEffect, useRef, useCallback } from 'react';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions {
  /** Whether auto-save is active (set false when form is not yet persisted or editor is closed) */
  enabled: boolean;
  /** Debounce delay in ms after the last change before saving (default 2000) */
  debounceMs?: number;
  /** Periodic save interval in ms (default 30000) */
  intervalMs?: number;
  /** Called to perform the save. Should return a resolved promise on success, rejected on error. */
  onSave: () => Promise<void>;
  /** Called when save status changes */
  onStatusChange: (status: SaveStatus) => void;
}

export function useAutoSave({
  enabled,
  debounceMs = 2000,
  intervalMs = 30000,
  onSave,
  onStatusChange,
}: UseAutoSaveOptions) {
  const onSaveRef = useRef(onSave);
  const onStatusChangeRef = useRef(onStatusChange);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);

  // Keep refs up-to-date so closures always call the latest version
  useEffect(() => { onSaveRef.current = onSave; }, [onSave]);
  useEffect(() => { onStatusChangeRef.current = onStatusChange; }, [onStatusChange]);

  const executeSave = useCallback(async () => {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    onStatusChangeRef.current('saving');
    try {
      await onSaveRef.current();
      onStatusChangeRef.current('saved');
    } catch {
      onStatusChangeRef.current('error');
    } finally {
      isSavingRef.current = false;
    }
  }, []);

  /** Call this whenever the form content changes to reset the debounce timer */
  const touch = useCallback(() => {
    if (!enabled) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      executeSave();
    }, debounceMs);
  }, [enabled, debounceMs, executeSave]);

  // Periodic save every intervalMs
  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(() => { executeSave(); }, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, executeSave]);

  // Save on page unload (beforeunload)
  useEffect(() => {
    if (!enabled) return;
    const handler = () => { executeSave(); };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled, executeSave]);

  // Clear debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  return { touch };
}
