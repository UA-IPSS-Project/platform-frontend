import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { GlassCard } from '../../components/ui/glass-card';
import { ChevronLeftIcon, DownloadIcon, FileTextIcon } from '../../components/shared/CustomIcons';
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

export function DocumentsSearchPage({ onBack, isDarkMode }: DocumentsSearchPageProps) {
  const { t, i18n } = useTranslation();
  const [nomeOriginal, setNomeOriginal] = useState('');
  const [tipo, setTipo] = useState('');
  const [utenteNome, setUtenteNome] = useState('');
  const [utenteNif, setUtenteNif] = useState('');
  const [desde, setDesde] = useState('');
  const [ate, setAte] = useState('');

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
    const end = start + itensPorPagina;
    return resultados.slice(start, end);
  }, [resultados, paginaAtual, itensPorPagina]);

  useEffect(() => {
    setPaginaAtual((prev) => Math.min(prev, totalPaginas));
  }, [totalPaginas]);

  const normalizarInicioDia = (valor: string) => {
    const data = new Date(`${valor}T00:00:00`);
    return data.toISOString();
  };

  const normalizarFimDia = (valor: string) => {
    const data = new Date(`${valor}T23:59:59.999`);
    return data.toISOString();
  };

  const pesquisarDocumentos = async (showToast = true) => {
    try {
      setLoading(true);

      const dados = await documentosApi.pesquisarDocumentos({
        nomeOriginal: nomeOriginal || undefined,
        tipo: tipo || undefined,
        utenteNome: utenteNome || undefined,
        utenteNif: utenteNif || undefined,
        desde: desde ? normalizarInicioDia(desde) : undefined,
        ate: ate ? normalizarFimDia(ate) : undefined,
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

  useEffect(() => {
    pesquisarDocumentos(false);
  }, []);

  const handlePesquisar = async () => {
    await pesquisarDocumentos(true);
  };

  const handleLimpar = async () => {
    setNomeOriginal('');
    setTipo('');
    setUtenteNome('');
    setUtenteNif('');
    setDesde('');
    setAte('');
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

  const headerTextClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-700 dark:text-gray-200">
          <ChevronLeftIcon className="w-4 h-4" />
          {t('common.back')}
        </Button>
        <h1 className={`text-2xl font-bold ${headerTextClass}`}>{t('documents.title')}</h1>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className={`text-lg font-semibold ${headerTextClass}`}>{t('documents.metadataFilters')}</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Input
            type="text"
            placeholder={t('documents.filters.originalName')}
            value={nomeOriginal}
            onChange={(e) => setNomeOriginal(e.target.value)}
          />
          <Input
            type="text"
            placeholder={t('documents.filters.userName')}
            value={utenteNome}
            onChange={(e) => setUtenteNome(e.target.value)}
          />
          <Input
            type="text"
            placeholder={t('documents.filters.userNif')}
            value={utenteNif}
            onChange={(e) => setUtenteNif(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">{t('documents.filters.type')}</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full mt-1 h-10 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-gray-100"
            >
              {MIME_OPTIONS.map((option) => (
                <option key={option.value || 'all'} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">{t('documents.filters.from')}</label>
            <DatePickerField value={desde} onChange={setDesde} buttonClassName="mt-1" />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">{t('documents.filters.to')}</label>
            <DatePickerField value={ate} onChange={setAte} buttonClassName="mt-1" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handlePesquisar} className="bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
            {loading ? t('documents.actions.searching') : t('documents.actions.search')}
          </Button>
          <Button variant="outline" onClick={handleLimpar} disabled={loading}>
            {t('documents.actions.clear')}
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${headerTextClass}`}>{t('documents.resultsTitle')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('documents.resultsSummary', { count: resultados.length, size: totalSizeMb })}
          </p>
        </div>

        {resultados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
            <FileTextIcon className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">{t('documents.noResults')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={`page-${paginaAtual}-${itensPorPagina}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-3"
              >
                {resultadosPaginados.map((doc) => (
                  <div
                    key={doc.id}
                    className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-gray-100 truncate">{doc.nomeOriginal}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('documents.card.appointmentRef', {
                          id: doc.marcacaoId,
                          mime: doc.tipoMime,
                          size: (doc.tamanho / 1024).toFixed(1),
                        })}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {t('documents.card.userLine', { name: doc.utenteNome || '—', nif: doc.utenteNif || '—' })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {t('documents.card.uploadAt', { date: new Date(doc.uploadedEm).toLocaleString(currentLocale) })}
                      </p>
                    </div>

                    <div>
                      <Button variant="outline" className="gap-2" onClick={() => handleDownload(doc)}>
                        <DownloadIcon className="w-4 h-4" />
                        {t('documents.actions.download')}
                      </Button>
                    </div>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>

            {resultados.length > itensPorPagina && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-3">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('documents.pagination.pageOf', { page: paginaAtual, total: totalPaginas })}
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">{t('documents.pagination.perPage')}</label>
                    <select
                      value={itensPorPagina}
                      onChange={(e) => {
                        setItensPorPagina(Number(e.target.value));
                        setPaginaAtual(1);
                      }}
                      className="h-9 rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 text-sm text-gray-900 dark:text-gray-100"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                    disabled={paginaAtual === 1}
                  >
                    {t('history.pagination.previous')}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                  >
                    {t('history.pagination.next')}
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
