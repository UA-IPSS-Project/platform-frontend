import { Page } from '../services/api/core/client';

/** Extracts items from a Page<T> or plain array response. */
export function unwrapPage<T>(data: T[] | Page<T> | null | undefined): T[] {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return data.content ?? [];
}
