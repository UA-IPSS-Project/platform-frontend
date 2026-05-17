import { createContext, useContext } from 'react';
import type { CandidaturaDocumentoDTO } from '../services/api';

export interface CandidaturaFileContextValue {
  uploadFile: (file: File, fieldName?: string) => Promise<CandidaturaDocumentoDTO | null>;
  downloadFile: (docId: string, nomeOriginal: string) => Promise<void>;
  deleteFile?: (docId: string) => Promise<void>;
}

export const CandidaturaFileContext = createContext<CandidaturaFileContextValue | null>(null);

export function useCandidaturaFile(): CandidaturaFileContextValue | null {
  return useContext(CandidaturaFileContext);
}
