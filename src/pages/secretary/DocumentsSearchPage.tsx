import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { GlassCard } from '../../components/ui/glass-card';
import { ChevronLeftIcon, DownloadIcon, FileTextIcon } from '../../components/shared/CustomIcons';
import { documentosApi, DocumentoDTO } from '../../services/api';
import { toast } from 'sonner';

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
        toast.success(`Pesquisa concluída: ${Array.isArray(dados) ? dados.length : 0} documento(s).`);
      }
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao pesquisar documentos.');
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
      toast.error(error?.message || 'Erro ao carregar documentos.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: DocumentoDTO) => {
    try {
      await documentosApi.downloadDocumento(doc.id, doc.nomeOriginal);
      toast.success(`Download iniciado: ${doc.nomeOriginal}`);
    } catch {
      toast.error('Erro ao fazer download do documento.');
    }
  };

  const headerTextClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';

  return (
    <div className="max-w-[1600px] mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={onBack} className="gap-2 text-gray-700 dark:text-gray-200">
          <ChevronLeftIcon className="w-4 h-4" />
          Voltar
        </Button>
        <h1 className={`text-2xl font-bold ${headerTextClass}`}>Pesquisa de Documentos</h1>
      </div>

      <GlassCard className="p-5 space-y-4">
        <h2 className={`text-lg font-semibold ${headerTextClass}`}>Filtros por metadados</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
          <Input
            type="text"
            placeholder="Nome original do documento"
            value={nomeOriginal}
            onChange={(e) => setNomeOriginal(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Nome do utente"
            value={utenteNome}
            onChange={(e) => setUtenteNome(e.target.value)}
          />
          <Input
            type="text"
            placeholder="NIF do utente"
            value={utenteNif}
            onChange={(e) => setUtenteNif(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Tipo</label>
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
            <label className="text-sm text-gray-600 dark:text-gray-300">Desde</label>
            <DatePickerField value={desde} onChange={setDesde} buttonClassName="mt-1" />
          </div>

          <div>
            <label className="text-sm text-gray-600 dark:text-gray-300">Até</label>
            <DatePickerField value={ate} onChange={setAte} buttonClassName="mt-1" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handlePesquisar} className="bg-purple-600 hover:bg-purple-700 text-white" disabled={loading}>
            {loading ? 'A pesquisar...' : 'Pesquisar'}
          </Button>
          <Button variant="outline" onClick={handleLimpar} disabled={loading}>
            Limpar
          </Button>
        </div>
      </GlassCard>

      <GlassCard className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className={`text-lg font-semibold ${headerTextClass}`}>Resultados</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {resultados.length} documento(s) · {totalSizeMb} MB
          </p>
        </div>

        {resultados.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
            <FileTextIcon className="w-10 h-10 mx-auto text-gray-400 dark:text-gray-500 mb-2" />
            <p className="text-gray-600 dark:text-gray-400">Sem resultados para os filtros atuais.</p>
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
                        Marcação #{doc.marcacaoId} · {doc.tipoMime} · {(doc.tamanho / 1024).toFixed(1)} KB
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Utente: {doc.utenteNome || '—'} ({doc.utenteNif || '—'})
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Upload: {new Date(doc.uploadedEm).toLocaleString('pt-PT')}
                      </p>
                    </div>

                    <div>
                      <Button variant="outline" className="gap-2" onClick={() => handleDownload(doc)}>
                        <DownloadIcon className="w-4 h-4" />
                        Download
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
                    Página {paginaAtual} de {totalPaginas}
                  </p>
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Por página</label>
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
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima
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
