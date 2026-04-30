/** Mascara o NIF mostrando apenas os últimos 4 dígitos: *****1234 */
export function maskNif(nif: string | null | undefined): string {
    if (!nif) return '—';
    const s = String(nif);
    if (s.length <= 4) return s;
    return '*'.repeat(s.length - 4) + s.slice(-4);
}
