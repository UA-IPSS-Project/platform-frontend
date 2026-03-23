import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { GlassCard } from '../../components/ui/glass-card';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  FileTextIcon,
  UserIcon,
  ClockIcon,
  SlidersIcon,
} from '../../components/shared/CustomIcons';
import { documentosApi, DocumentoDTO } from '../../services/api';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface DocumentsSearchPageProps {
  onBack: () => void;
  isDarkMode: boolean;
}

const MIME_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'application/pdf', label: 'PDF' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/jpg', label: 'JPG' },
  { value: 'image/png', label: 'PNG' },
  { value: 'application/msword', label: 'DOC' },
  { value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', label: 'DOCX' },
];

/** Returns a short label and colour scheme for a MIME type */
function getMimeInfo(mime: string): { label: string; color: string; bg: string } {
  if (mime?.includes('pdf')) return { label: 'PDF', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' };
  if (mime?.includes('jpeg') || mime?.includes('jpg'))
    return { label: 'JPEG', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' };
  if (mime?.includes('png')) return { label: 'PNG', color: 'text-sky-600 dark:text-sky-400', bg: 'bg-sky-50 dark:bg-sky-900/20 border-sky-200 dark:border-sky-800' };
  if (mime?.includes('word') || mime?.includes('doc'))
    return { label: 'DOC', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' };
  return { label: mime?.split('/')[1]?.toUpperCase() || '—', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700' };
}

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function DocumentsSearchPage({ onBack }: DocumentsSearchPageProps) {
  const { t, i18n } = useTranslation();
  const [nomeOriginal, setNomeOriginal] = useState('');
  const [tipo, setTipo] = useState('');
  const [utenteNome, setUtenteNome] = useState('');
  const [utenteNif, setUtenteNif] = useState('');
  const [marcacaoDesde, setMarcacaoDesde] = useState('');
  const [marcacaoAte, setMarcacaoAte] = useState('');

  const [loading, setLoading] = useState(false);
  const [resultados, setResultados] = useState<DocumentoDTO[]>([]);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(10);
  const currentLocale = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'pt-PT';

  const totalSizeMb = useMemo(() => {
    const totalBytes = resultados.reduce((acc, doc) => acc + (doc.tamanho ?? 0), 0);
    return (totalBytes / (1024 * 1024)).toFixed(2);
  }, [resultados]);

  const totalPaginas = Math.max(1, Math.ceil(resultados.length / itensPorPagina));

  const resultadosPaginados = useMemo(() => {
    const start = (paginaAtual - 1) * itensPorPagina;
    return resultados.slice(start, start + itensPorPagina);
  }, [resultados, paginaAtual, itensPorPagina]);

  useEffect(() => {
    setPaginaAtual((prev) => Math.min(prev, totalPaginas));
  }, [totalPaginas]);

  const normalizarInicioDia = (valor: string) => new Date(`${valor}T00:00:00`).toISOString();
  const normalizarFimDia = (valor: string) => new Date(`${valor}T23:59:59.999`).toISOString();

  const pesquisarDocumentos = async (showToast = true) => {
    try {
      setLoading(true);
      const dados = await documentosApi.pesquisarDocumentos({
        nomeOriginal: nomeOriginal || undefined,
        tipo: tipo || undefined,
        utenteNome: utenteNome || undefined,
        utenteNif: utenteNif || undefined,
        marcacaoDesde: marcacaoDesde ? normalizarInicioDia(marcacaoDesde) : undefined,
        marcacaoAte: marcacaoAte ? normalizarFimDia(marcacaoAte) : undefined,
      });
      setResultados(Array.isArray(dados) ? dados : []);
      setPaginaAtual(1);
      if (showToast) {
        toast.success(t('documents.messages.searchDone', { count: Array.isArray(dados) ? dados.length : 0 }));
      }
    } catch (error: any) {
      toast.error(error?.message || t('documents.errors.search'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { pesquisarDocumentos(false); }, []);

  const handlePesquisar = () => pesquisarDocumentos(true);

  const handleLimpar = async () => {
    setNomeOriginal(''); setTipo(''); setUtenteNome(''); setUtenteNif(''); setMarcacaoDesde(''); setMarcacaoAte('');
    try {
      setLoading(true);
      const dados = await documentosApi.pesquisarDocumentos({});
      setResultados(Array.isArray(dados) ? dados : []);
      setPaginaAtual(1);
    } catch (error: any) {
      toast.error(error?.message || t('documents.errors.load'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: DocumentoDTO) => {
    try {
      await documentosApi.downloadDocumento(doc.id, doc.nomeOriginal);
      toast.success(t('documents.messages.downloadStarted', { name: doc.nomeOriginal }));
    } catch {
      toast.error(t('documents.errors.download'));
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={onBack}
          className="gap-2 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
        >
          <ChevronLeftIcon className="w-4 h-4" />
          {t('common.back')}
        </Button>
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="flex items-center gap-2">
          <FileTextIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('documents.title')}</h1>
        </div>
      </div>

      {/* ── Filter panel ── */}
      <GlassCard className="p-5 space-y-5">
        <div className="flex items-center gap-2">
          <SlidersIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{t('documents.metadataFilters')}</h2>
        </div>

        {/* Row 1: text filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('documents.filters.originalName')}
            </label>
            <Input
              type="text"
              placeholder="ex: relatorio.pdf"
              value={nomeOriginal}
              onChange={(e) => setNomeOriginal(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('documents.filters.userName')}
            </label>
            <Input
              type="text"
              placeholder="ex: João Silva"
              value={utenteNome}
              onChange={(e) => setUtenteNome(e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('documents.filters.userNif')}
            </label>
            <Input
              type="text"
              placeholder="ex: 123456789"
              value={utenteNif}
              onChange={(e) => setUtenteNif(e.target.value)}
            />
          </div>
        </div>

        {/* Row 2: type + dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('documents.filters.type')}
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
            >
              {MIME_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('documents.filters.from')} (data marcação)
            </label>
            <DatePickerField value={marcacaoDesde} onChange={setMarcacaoDesde} buttonClassName="mt-0" />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t('documents.filters.to')} (data marcação)
            </label>
            <DatePickerField value={marcacaoAte} onChange={setMarcacaoAte} buttonClassName="mt-0" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            onClick={handlePesquisar}
            className="bg-purple-600 hover:bg-purple-700 text-white px-5"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                {t('documents.actions.searching')}
              </span>
            ) : t('documents.actions.search')}
          </Button>
          <Button variant="outline" onClick={handleLimpar} disabled={loading}>
            {t('documents.actions.clear')}
          </Button>
        </div>
      </GlassCard>

      {/* ── Results panel ── */}
      <GlassCard className="p-5 space-y-4">
        {/* Results header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">{t('documents.resultsTitle')}</h2>
          {resultados.length > 0 && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                {resultados.length} {resultados.length === 1 ? 'documento' : 'documentos'}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{totalSizeMb} MB total</span>
            </div>
          )}
        </div>

        {/* Empty state */}
        {resultados.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-14 h-14 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <FileTextIcon className="w-7 h-7 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('documents.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${paginaAtual}-${itensPorPagina}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-3"
              >
                {resultadosPaginados.map((doc) => {
                  const mimeInfo = getMimeInfo(doc.tipoMime);
                  return (
                    <div
                      key={doc.id}
                      className="group relative rounded-xl border border-gray-200 dark:border-gray-700/60 bg-white dark:bg-gray-900/80 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all duration-200 overflow-hidden"
                    >
                      {/* Subtle top accent line */}
                      <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/60 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

                      <div className="p-4 flex items-start gap-4">
                        {/* File type icon badge */}
                        <div className={`flex-shrink-0 w-11 h-11 rounded-lg border flex items-center justify-center font-bold text-xs tracking-wide ${mimeInfo.bg} ${mimeInfo.color}`}>
                          {mimeInfo.label === '—' ? (
                            <FileTextIcon className="w-5 h-5 opacity-70" />
                          ) : (
                            mimeInfo.label
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-gray-100 truncate leading-snug">
                            {doc.nomeOriginal}
                          </p>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {/* Appointment ref */}
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 dark:bg-purple-500 flex-shrink-0" />
                              {t('documents.card.appointmentRef', {
                                id: doc.marcacaoId,
                                mime: doc.tipoMime,
                                size: formatSize(doc.tamanho),
                              })}
                            </span>
                          </div>

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                            {/* Patient */}
                            <span className="inline-flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                              <UserIcon className="w-3 h-3 flex-shrink-0 text-gray-400" />
                              {doc.utenteNome || '—'}
                              {doc.utenteNif && (
                                <span className="ml-1 font-mono text-gray-400 dark:text-gray-500">({doc.utenteNif})</span>
                              )}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                            <ClockIcon className="w-3 h-3 flex-shrink-0" />
                            {new Date(doc.uploadedEm).toLocaleString(currentLocale)}
                          </div>
                        </div>

                        {/* Download button */}
                        <div className="flex-shrink-0 pt-0.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
                            onClick={() => handleDownload(doc)}
                          >
                            <DownloadIcon className="w-3.5 h-3.5" />
                            {t('documents.actions.download')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>

            {/* ── Pagination ── */}
            {resultados.length > itensPorPagina && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('documents.pagination.pageOf', { page: paginaAtual, total: totalPaginas })}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-gray-400 dark:text-gray-500">{t('documents.pagination.perPage')}</label>
                    <select
                      value={itensPorPagina}
                      onChange={(e) => { setItensPorPagina(Number(e.target.value)); setPaginaAtual(1); }}
                      className="h-8 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                    className="gap-1 px-2"
                  >
                    <ChevronLeftIcon className="w-4 h-4" />
                    {t('history.pagination.previous')}
                  </Button>

                  {/* Page pills */}
                  <div className="flex items-center gap-1 mx-1">
                    {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaAtual) <= 1)
                      .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                        if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                        acc.push(p);
                        return acc;
                      }, [])
                      .map((p, idx) =>
                        p === '...' ? (
                          <span key={`ellipsis-${idx}`} className="px-1 text-gray-400 text-xs">…</span>
                        ) : (
                          <button
                            key={p}
                            onClick={() => setPaginaAtual(p as number)}
                            className={`w-7 h-7 rounded-md text-xs font-medium transition-colors ${paginaAtual === p
                                ? 'bg-purple-600 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                              }`}
                          >
                            {p}
                          </button>
                        )
                      )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                    className="gap-1 px-2"
                  >
                    {t('history.pagination.next')}
                    <ChevronRightIcon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
