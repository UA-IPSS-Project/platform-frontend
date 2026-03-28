import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { GlassCard } from '../../components/ui/glass-card';
import { Button } from '../../components/ui/button';
import { marcacoesApi } from '../../services/api/marcacoes/marcacoesApi';
import { requisicoesApi } from '../../services/api/requisicoes/requisicoesApi';

// Helper to format date as YYYY-MM-DD in local time (avoids ISO timezone shift)
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};


type ReportSection =
  | 'secretaria'
  | 'balneario'
  | 'material'
  | 'transporte'
  | 'manutencao';

const SECTIONS: { id: ReportSection; label: string; description: string }[] = [
  { id: 'secretaria', label: 'Marcações — Secretaria', description: 'Presenças, remotas e estado das consultas' },
  { id: 'balneario', label: 'Marcações — Balneário', description: 'Sessões de higiene, lavagem de roupa e estado' },
  { id: 'material', label: 'Requisições de Material', description: 'Pedidos de material de escritório e consumíveis' },
  { id: 'transporte', label: 'Requisições de Transporte', description: 'Reservas de viaturas e viagens agendadas' },
  { id: 'manutencao', label: 'Requisições de Manutenção', description: 'Pedidos de obras e reparações' },
];

const ESTADO_LABELS: Record<string, string> = {
  AGENDADO: 'Agendado',
  EM_PROGRESSO: 'Em Progresso',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  NAO_COMPARECIDO: 'Não Compareceu',
  INVALIDO: 'Inválido',
  EM_PREENCHIMENTO: 'Em Preenchimento',
  // Requisitions
  ABERTO: 'Aberto',
  FECHADO: 'Fechado',
};

const PRIORIDADE_LABELS: Record<string, string> = {
  BAIXA: 'Baixa', MEDIA: 'Média', ALTA: 'Alta', URGENTE: 'Urgente',
};

function formatDateStr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('pt-PT');
}

function formatTimeStr(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
}

export function ReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [startDate, setStartDate] = useState(formatDate(firstOfMonth));
  const [endDate, setEndDate] = useState(formatDate(lastOfMonth));
  const [selected, setSelected] = useState<Set<ReportSection>>(
    new Set(['secretaria', 'balneario'])
  );
  const [isGenerating, setIsGenerating] = useState(false);

  const toggle = (id: ReportSection) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const generatePDF = async () => {
    if (selected.size === 0) {
      toast.error('Selecione pelo menos um tipo de dados para incluir no relatório.');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Selecione um intervalo de datas válido.');
      return;
    }

    setIsGenerating(true);
    try {
      const startISO = `${startDate}T00:00:00`;
      const endISO = `${endDate}T23:59:59`;

      // Parallel fetch
      const [marcacoesSecretaria, marcacoesBalneario, requisicoes] = await Promise.all([
        selected.has('secretaria') ? marcacoesApi.consultarAgenda(startISO, endISO, 'SECRETARIA') : Promise.resolve([]),
        selected.has('balneario') ? marcacoesApi.consultarAgenda(startISO, endISO, 'BALNEARIO') : Promise.resolve([]),
        (selected.has('material') || selected.has('transporte') || selected.has('manutencao'))
          ? requisicoesApi.listar()
          : Promise.resolve([]),
      ]);

      // Filter requisicoes by date range
      const startMs = new Date(startISO).getTime();
      const endMs = new Date(endISO).getTime();
      const filteredReqs = requisicoes.filter(r => {
        if (!r.criadoEm) return true;
        const t = new Date(r.criadoEm).getTime();
        return t >= startMs && t <= endMs;
      });
      const reqMaterial = filteredReqs.filter(r => r.tipo === 'MATERIAL');
      const reqTransporte = filteredReqs.filter(r => r.tipo === 'TRANSPORTE');
      const reqManutencao = filteredReqs.filter(r => r.tipo === 'MANUTENCAO');

      // Create PDF
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      let y = 0;

      // --- Header ---
      doc.setFillColor(109, 40, 217); // purple-700
      doc.rect(0, 0, pageW, 28, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório Institucional', 14, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Período: ${new Date(startISO).toLocaleDateString('pt-PT')} a ${new Date(endISO).toLocaleDateString('pt-PT')}`,
        14, 21
      );
      doc.text(
        `Gerado em: ${new Date().toLocaleString('pt-PT')}`,
        pageW - 14 - doc.getTextWidth(`Gerado em: ${new Date().toLocaleString('pt-PT')}`),
        21
      );

      y = 36;

      const addSectionTitle = (title: string, count: number) => {
        // Check space
        if (y > pageH - 50) { doc.addPage(); y = 20; }
        doc.setFillColor(245, 243, 255);
        doc.roundedRect(10, y - 5, pageW - 20, 10, 2, 2, 'F');
        doc.setTextColor(109, 40, 217);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(title, 14, y + 2);
        doc.setTextColor(120, 120, 120);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`${count} registro(s)`, pageW - 14 - doc.getTextWidth(`${count} registro(s)`), y + 2);
        y += 12;
      };

      // Footer hook
      const totalPagesRef = { value: 0 };
      const addFooter = (pageNum: number) => {
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.setFont('helvetica', 'normal');
        doc.line(10, pageH - 12, pageW - 10, pageH - 12);
        doc.text('Documento gerado automaticamente — Florinhas do Vouga', 14, pageH - 7);
        doc.text(`Pág. ${pageNum}`, pageW - 14 - doc.getTextWidth(`Pág. ${pageNum}`), pageH - 7);
      };

      // ── Marcações Secretaria ─────────────────────────────────────
      if (selected.has('secretaria')) {
        addSectionTitle('Marcacoes — Secretaria', marcacoesSecretaria.length);
        if (marcacoesSecretaria.length === 0) {
          doc.setFontSize(9); doc.setTextColor(140, 140, 140);
          doc.text('Sem marcações no período selecionado.', 14, y); y += 8;
        } else {
          autoTable(doc, {
            startY: y,
            head: [['Data', 'Hora', 'Utente', 'Assunto', 'Tipo', 'Estado']],
            body: marcacoesSecretaria.map(m => [
              formatDateStr(m.data),
              formatTimeStr(m.data),
              m.marcacaoSecretaria?.utente?.nome ?? '—',
              m.marcacaoSecretaria?.assunto ?? '—',
              m.marcacaoSecretaria?.tipoAtendimento === 'PRESENCIAL' ? 'Presencial' : 'Remota',
              ESTADO_LABELS[m.estado] ?? m.estado,
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [109, 40, 217], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 245, 255] },
            margin: { left: 10, right: 10 },
            didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // ── Marcações Balneário ─────────────────────────────────────
      if (selected.has('balneario')) {
        addSectionTitle('Marcacoes — Balneario', marcacoesBalneario.length);
        if (marcacoesBalneario.length === 0) {
          doc.setFontSize(9); doc.setTextColor(140, 140, 140);
          doc.text('Sem marcações no período selecionado.', 14, y); y += 8;
        } else {
          autoTable(doc, {
            startY: y,
            head: [['Data', 'Hora', 'Utente', 'Higiene', 'Lavagem', 'Estado']],
            body: marcacoesBalneario.map(m => [
              formatDateStr(m.data),
              formatTimeStr(m.data),
              (m as any).marcacaoBalneario?.nomeUtente ?? '—',
              (m as any).marcacaoBalneario?.produtosHigiene ? 'Sim' : 'Não',
              (m as any).marcacaoBalneario?.lavagemRoupa ? 'Sim' : 'Não',
              ESTADO_LABELS[m.estado] ?? m.estado,
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [8, 145, 178], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 249, 255] },
            margin: { left: 10, right: 10 },
            didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // ── Requisições Material ─────────────────────────────────────
      if (selected.has('material')) {
        addSectionTitle('Requisicoes de Material', reqMaterial.length);
        if (reqMaterial.length === 0) {
          doc.setFontSize(9); doc.setTextColor(140, 140, 140);
          doc.text('Sem requisições no período selecionado.', 14, y); y += 8;
        } else {
          autoTable(doc, {
            startY: y,
            head: [['Data', 'Criado Por', 'Itens', 'Prioridade', 'Estado']],
            body: reqMaterial.map(r => [
              r.criadoEm ? formatDateStr(r.criadoEm) : '—',
              r.criadoPor?.nome ?? '—',
              (r.itens ?? []).map(i => `${i.material?.nome ?? '?'} ×${i.quantidade ?? 1}`).join(', ') || '—',
              PRIORIDADE_LABELS[r.prioridade] ?? r.prioridade,
              ESTADO_LABELS[r.estado] ?? r.estado,
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [255, 247, 237] },
            margin: { left: 10, right: 10 },
            columnStyles: { 2: { cellWidth: 60 } },
            didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // ── Requisições Transporte ───────────────────────────────────
      if (selected.has('transporte')) {
        addSectionTitle('Requisicoes de Transporte', reqTransporte.length);
        if (reqTransporte.length === 0) {
          doc.setFontSize(9); doc.setTextColor(140, 140, 140);
          doc.text('Sem requisições no período selecionado.', 14, y); y += 8;
        } else {
          autoTable(doc, {
            startY: y,
            head: [['Data', 'Criado Por', 'Destino', 'Veículo', 'Passageiros', 'Estado']],
            body: reqTransporte.map(r => [
              r.criadoEm ? formatDateStr(r.criadoEm) : '—',
              r.criadoPor?.nome ?? '—',
              r.destino ?? '—',
              r.transportes?.[0]?.transporte?.matricula ?? r.transporte?.matricula ?? '—',
              r.numeroPassageiros?.toString() ?? '—',
              ESTADO_LABELS[r.estado] ?? r.estado,
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [240, 253, 244] },
            margin: { left: 10, right: 10 },
            didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // ── Requisições Manutenção ───────────────────────────────────
      if (selected.has('manutencao')) {
        addSectionTitle('Requisicoes de Manutencao', reqManutencao.length);
        if (reqManutencao.length === 0) {
          doc.setFontSize(9); doc.setTextColor(140, 140, 140);
          doc.text('Sem requisições no período selecionado.', 14, y); y += 8;
        } else {
          autoTable(doc, {
            startY: y,
            head: [['Data', 'Criado Por', 'Assunto', 'Prioridade', 'Estado']],
            body: reqManutencao.map(r => [
              r.criadoEm ? formatDateStr(r.criadoEm) : '—',
              r.criadoPor?.nome ?? '—',
              r.assunto ?? r.descricao ?? '—',
              PRIORIDADE_LABELS[r.prioridade] ?? r.prioridade,
              ESTADO_LABELS[r.estado] ?? r.estado,
            ]),
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [100, 116, 139], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [248, 250, 252] },
            margin: { left: 10, right: 10 },
            didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
          });
          y = (doc as any).lastAutoTable.finalY + 10;
        }
      }

      // Add footer to last page
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        addFooter(i);
      }
      totalPagesRef.value = totalPages;

      // Save
      const filename = `relatorio_${startDate}_${endDate}.pdf`;
      doc.save(filename);
      toast.success(`Relatório gerado com sucesso! (${filename})`);
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      toast.error('Erro ao gerar o relatório. Verifique a ligação ao servidor.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Page Title */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Gere relatórios em PDF com os dados institucionais</p>
        </div>
      </div>

      {/* Date Range */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          Período
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Início</label>
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Data de Fim</label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
            />
          </div>
        </div>
        {/* Quick range buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {[
            { label: 'Este mês', start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 0) },
            { label: 'Mês passado', start: new Date(today.getFullYear(), today.getMonth() - 1, 1), end: new Date(today.getFullYear(), today.getMonth(), 0) },
            { label: 'Últimos 7 dias', start: new Date(Date.now() - 6 * 86400000), end: today },
            { label: 'Últimos 30 dias', start: new Date(Date.now() - 29 * 86400000), end: today },
            { label: 'Este ano', start: new Date(today.getFullYear(), 0, 1), end: today },
          ].map(({ label, start, end }) => (
            <button
              key={label}
              onClick={() => {
                setStartDate(formatDate(start));
                setEndDate(formatDate(end));
              }}
              className="text-xs px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 transition font-medium"
            >
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      {/* Data Types */}
      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
          Dados a Incluir
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTIONS.map(section => {
            const isChecked = selected.has(section.id);
            return (
              <button
                key={section.id}
                onClick={() => toggle(section.id)}
                className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                  isChecked
                    ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white/50 dark:bg-gray-800/30'
                }`}
              >
                <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center transition-colors ${
                  isChecked ? 'bg-purple-600 border-purple-600' : 'border-gray-300 dark:border-gray-500'
                }`}>
                  {isChecked && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div>
                  <div className="font-medium text-sm text-gray-800 dark:text-gray-100">
                    {section.label}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.description}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <button
            onClick={() => setSelected(new Set(SECTIONS.map(s => s.id)))}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
          >
            Selecionar tudo
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button
            onClick={() => setSelected(new Set())}
            className="text-xs text-gray-500 dark:text-gray-400 hover:underline"
          >
            Limpar seleção
          </button>
          <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">{selected.size} de {SECTIONS.length} selecionados</span>
        </div>
      </GlassCard>

      {/* Generate Button */}
      <div className="flex justify-end">
        <Button
          onClick={generatePDF}
          disabled={isGenerating || selected.size === 0}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white px-8 py-3 rounded-xl shadow-lg shadow-purple-200 dark:shadow-purple-900/30 font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              A gerar relatório…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Gerar PDF
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
