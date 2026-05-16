import { useEffect, useRef } from 'react';

export function useDebounce(fn: () => void, deps: unknown[], delay = 300): void {
    const fnRef = useRef(fn);
    fnRef.current = fn;

    useEffect(() => {
        const t = setTimeout(() => fnRef.current(), delay);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [...deps, delay]);
}
