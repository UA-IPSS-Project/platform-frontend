import { useState, useRef, useCallback } from 'react';

/**
 * Returns [isOnCooldown, wrap] where wrap(fn) executes fn and blocks re-execution
 * for `cooldownMs` milliseconds.
 */
export function useSubmitCooldown(cooldownMs = 5000) {
  const [isOnCooldown, setIsOnCooldown] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wrap = useCallback(
    <T>(fn: (arg: T) => Promise<void>) =>
      async (arg: T) => {
        if (isOnCooldown) return;
        setIsOnCooldown(true);
        try {
          await fn(arg);
        } finally {
          timerRef.current = setTimeout(() => setIsOnCooldown(false), cooldownMs);
        }
      },
    [isOnCooldown, cooldownMs]
  );

  return [isOnCooldown, wrap] as const;
}
