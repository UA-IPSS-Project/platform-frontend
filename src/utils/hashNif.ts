/**
 * Calcula SHA-256 do NIF e devolve hex string de 64 chars.
 * O NIF em claro nunca é enviado ao backend.
 */
export async function hashNif(nif: string): Promise<string> {
    const encoded = new TextEncoder().encode(nif);
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}
