/** Mascara o NIF mostrando apenas os últimos 4 dígitos: *****1234 */
export function maskNif(nif: string | null | undefined): string {
    if (!nif) return '—';
    const s = String(nif);
    const trimmed = s.trim();

    if (!/^\d{9}$/.test(trimmed)) return s;

    return '*'.repeat(trimmed.length - 4) + trimmed.slice(-4);
}
