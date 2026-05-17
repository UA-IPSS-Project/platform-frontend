import { useState } from 'react';
import { Download, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { useCandidaturaFile } from '../../../contexts/CandidaturaFileContext';
import { type RjsfWidgetProps } from './types';

interface StoredFile { docId: string; nomeOriginal: string }

function parseStoredFile(value: unknown): StoredFile | null {
  if (typeof value !== 'string' || !value) return null;
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed.docId === 'string') return parsed as StoredFile;
  } catch { /* not JSON */ }
  return null;
}

export function FileFieldWidget(props: RjsfWidgetProps) {
  const { id, value, required, disabled, readonly, onChange, schema } = props;
  const fileCtx = useCandidaturaFile();
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);

  const stored = parseStoredFile(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !fileCtx) return;
    setUploading(true);
    const fieldName = schema.title || id.replace(/^root_/, '');
    try {
      const result = await fileCtx.uploadFile(file, fieldName);
      if (result) {
        onChange(JSON.stringify({ docId: result.id, nomeOriginal: result.nomeOriginal }));
      }
    } catch {
      toast.error('Erro ao carregar o ficheiro.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = () => {
    if (!stored || !fileCtx) return;
    void fileCtx.downloadFile(stored.docId, stored.nomeOriginal);
  };

  const handleRemove = async () => {
    if (!stored || !fileCtx) return;
    setRemoving(true);
    try {
      await fileCtx.deleteFile?.(stored.docId);
    } catch { /* best-effort */ }
    onChange('');
    setRemoving(false);
  };

  if (readonly || disabled) {
    if (!stored) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
          <Paperclip className="w-4 h-4 shrink-0" />
          <span>Nenhum ficheiro</span>
        </div>
      );
    }
    return (
      <button
        type="button"
        onClick={handleDownload}
        className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors w-full text-left"
      >
        <Paperclip className="w-4 h-4 shrink-0 text-muted-foreground" />
        <span className="truncate flex-1">{stored.nomeOriginal}</span>
        <Download className="w-4 h-4 shrink-0 text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label
          htmlFor={id}
          className={`flex flex-1 items-center gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors ${
            uploading || removing || !fileCtx ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-primary hover:text-foreground'
          }`}
        >
          <input
            id={id}
            type="file"
            required={required && !stored}
            disabled={uploading || removing || !fileCtx}
            className="sr-only"
            onChange={handleFileChange}
          />
          <Paperclip className="w-4 h-4 shrink-0" />
          {uploading ? (
            <span>A carregar…</span>
          ) : stored ? (
            <span className="truncate text-foreground">{stored.nomeOriginal}</span>
          ) : (
            <span>Escolher ficheiro…</span>
          )}
        </label>
        {stored && (
          <button
            type="button"
            title="Remover ficheiro"
            onClick={() => void handleRemove()}
            disabled={uploading || removing}
            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {removing ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
          </button>
        )}
      </div>
      {stored && !uploading && (
        <button
          type="button"
          onClick={handleDownload}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Download className="w-3 h-3" />
          Descarregar ficheiro atual
        </button>
      )}
    </div>
  );
}
