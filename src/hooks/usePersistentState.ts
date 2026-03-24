import { Dispatch, SetStateAction, useEffect, useState } from 'react';

type StorageType = 'local' | 'session';

type Initializer<T> = T | (() => T);

const getStorage = (storageType: StorageType): Storage | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  return storageType === 'local' ? window.localStorage : window.sessionStorage;
};

const resolveInitialValue = <T>(initialValue: Initializer<T>): T => {
  return typeof initialValue === 'function' ? (initialValue as () => T)() : initialValue;
};

export function usePersistentState<T>(
  key: string,
  initialValue: Initializer<T>,
  storageType: StorageType = 'local'
): [T, Dispatch<SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    const storage = getStorage(storageType);
    const fallback = resolveInitialValue(initialValue);

    if (!storage) {
      return fallback;
    }

    const stored = storage.getItem(key);
    if (!stored) {
      return fallback;
    }

    try {
      return JSON.parse(stored) as T;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    const storage = getStorage(storageType);
    if (!storage) {
      return;
    }

    storage.setItem(key, JSON.stringify(state));
  }, [key, state, storageType]);

  return [state, setState];
}
