import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { GlassCard } from '../../components/ui/glass-card';
import { Button } from '../../components/ui/button';
import { marcacoesApi } from '../../services/api/marcacoes/marcacoesApi';
import { requisicoesApi } from '../../services/api/requisicoes/requisicoesApi';
import { reportsApi } from '../../services/api/reports/reportsApi';

// Helper to format date as YYYY-MM-DD in local time (avoids ISO timezone shift)
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDatePt = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
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
  ENVIADA: 'Enviada',
  EM_ANALISE: 'Em Análise',
  ACEITE: 'Aceite',
  RECUSADA: 'Recusada',
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
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
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  // Color palette for PDF (Fixed to Light Mode)
  const colors: Record<string, [number, number, number]> = {
    primary: [241, 149, 217], // #f195d9
    background: [255, 255, 255],
    foreground: [30, 41, 59],
    muted: [253, 242, 248], // pink-50
    accent: [253, 242, 248], // pink-50
    border: [251, 207, 232], // pink-200
  };

  const getStatusColor = (status?: string): [number, number, number] => {
    if (!status) return [107, 114, 128];
    const s = status.toUpperCase();
    if (['CONCLUIDO', 'ACEITE', 'CONCLUIDA'].includes(s)) return [16, 185, 129]; // Emerald 600
    if (['CANCELADO', 'RECUSADA', 'NAO_COMPARECIDO', 'INVALIDO'].includes(s)) return [220, 38, 38]; // Red 600
    if (['EM_PROGRESSO', 'EM_ANALISE', 'EM_PREENCHIMENTO', 'ENVIADA', 'URGENTE', 'ALTA'].includes(s)) return [245, 158, 11]; // Amber 600
    if (['AGENDADO', 'MEDIA'].includes(s)) return [241, 149, 217]; // #f195d9
    return [107, 114, 128]; // Gray
  };

  const getDiffDays = (isoDate?: string) => {
    if (!isoDate) return 0;
    const now = new Date();
    const d = new Date(isoDate);
    const diff = now.getTime() - d.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  const getDeadlineStyles = (days: number): { textColor?: [number, number, number], fontStyle?: 'bold', fillColor?: [number, number, number] } => {
    if (days >= 180) return { textColor: [255, 255, 255], fillColor: [0, 0, 0], fontStyle: 'bold' };
    if (days >= 90) return { textColor: [220, 38, 38], fontStyle: 'bold' };
    if (days >= 30) return { textColor: [180, 83, 9], fontStyle: 'bold' }; // Darker amber for yellow
    return { fontStyle: 'bold' };
  };

  const toggle = (id: ReportSection) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const preparePDF = async () => {
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

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 0;

    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageW, pageH, 'F');

    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageW, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Relatório Institucional', 14, 13);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Período: ${formatDatePt(startDate)} a ${formatDatePt(endDate)}`, 14, 21);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, pageW - 14 - doc.getTextWidth(`Gerado em: ${new Date().toLocaleString('pt-PT')}`), 21);

    y = 36;

    const addSectionTitle = (title: string, count: number) => {
      if (y > pageH - 50) {
        doc.addPage();
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageW, pageH, 'F');
        y = 20;
      }
      doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
      doc.roundedRect(10, y - 5, pageW - 20, 10, 2, 2, 'F');
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text(title, 14, y + 2);
      doc.setTextColor(120, 120, 120);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${count} registo(s)`, pageW - 14 - doc.getTextWidth(`${count} registo(s)`), y + 2);
      y += 12;
    };

    const addFooter = (pageNum: number) => {
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.setFont('helvetica', 'normal');
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.line(10, pageH - 12, pageW - 10, pageH - 12);
      doc.text('Documento gerado automaticamente — Florinhas do Vouga', 14, pageH - 7);
      doc.text(`Pág. ${pageNum}`, pageW - 14 - doc.getTextWidth(`Pág. ${pageNum}`), pageH - 7);
    };

    const tableStyles = { fontSize: 8, cellPadding: 2, textColor: colors.foreground, lineColor: colors.border };
    const tableHeadStyles = { fillColor: colors.primary, textColor: 255, fontStyle: 'bold' as const };
    const tableAlternateRowStyles = { fillColor: colors.accent };

    let sectionCount = 0;

    if (selected.has('secretaria')) {
      if (sectionCount > 0) { doc.addPage(); doc.setFillColor(255, 255, 255); doc.rect(0, 0, pageW, pageH, 'F'); y = 20; }
      sectionCount++;
      addSectionTitle('Marcações — Secretaria', marcacoesSecretaria.length);
      if (marcacoesSecretaria.length === 0) {
        doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text('Sem marcações no período selecionado.', 14, y); y += 8;
      } else {
        autoTable(doc, {
          startY: y, head: [['Data', 'Hora', 'Utente', 'Assunto', 'Tipo', 'Estado']],
          body: marcacoesSecretaria.map(m => [formatDateStr(m.data), formatTimeStr(m.data), m.marcacaoSecretaria?.utente?.nome ?? '—', m.marcacaoSecretaria?.assunto ?? '—', m.marcacaoSecretaria?.tipoAtendimento === 'PRESENCIAL' ? 'Presencial' : 'Remota', { content: ESTADO_LABELS[m.estado] ?? m.estado, styles: { textColor: getStatusColor(m.estado), fontStyle: 'bold' } }]),
          styles: tableStyles, headStyles: tableHeadStyles, alternateRowStyles: tableAlternateRowStyles, margin: { left: 10, right: 10 },
          didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if (selected.has('balneario')) {
      if (sectionCount > 0) { doc.addPage(); doc.setFillColor(255, 255, 255); doc.rect(0, 0, pageW, pageH, 'F'); y = 20; }
      sectionCount++;
      addSectionTitle('Marcações — Balneário', marcacoesBalneario.length);
      if (marcacoesBalneario.length === 0) {
        doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text('Sem marcações no período selecionado.', 14, y); y += 8;
      } else {
        autoTable(doc, {
          startY: y, head: [['Data', 'Hora', 'Utente', 'Higiene', 'Lavagem', 'Estado']],
          body: marcacoesBalneario.map(m => [formatDateStr(m.data), formatTimeStr(m.data), (m as any).marcacaoBalneario?.nomeUtente ?? '—', (m as any).marcacaoBalneario?.produtosHigiene ? 'Sim' : 'Não', (m as any).marcacaoBalneario?.lavagemRoupa ? 'Sim' : 'Não', { content: ESTADO_LABELS[m.estado] ?? m.estado, styles: { textColor: getStatusColor(m.estado), fontStyle: 'bold' } }]),
          styles: tableStyles, headStyles: tableHeadStyles, alternateRowStyles: tableAlternateRowStyles, margin: { left: 10, right: 10 },
          didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if (selected.has('material')) {
      if (sectionCount > 0) { doc.addPage(); doc.setFillColor(255, 255, 255); doc.rect(0, 0, pageW, pageH, 'F'); y = 20; }
      sectionCount++;
      addSectionTitle('Requisições de Material', reqMaterial.length);
      if (reqMaterial.length === 0) {
        doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text('Sem requisições no período selecionado.', 14, y); y += 8;
      } else {
        autoTable(doc, {
          startY: y, head: [['Data', 'Criado Por', 'Itens', 'Prioridade', 'Duração', 'Estado']],
          body: reqMaterial.map(r => { const days = getDiffDays(r.criadoEm); return [r.criadoEm ? formatDateStr(r.criadoEm) : '—', r.criadoPor?.nome ? `${r.criadoPor.nome} (${r.criadoPor.tipo ?? '?'})` : '—', (r.itens ?? []).map(i => `${i.material?.nome ?? '?'} ×${i.quantidade ?? 1}`).join(', ') || '—', PRIORIDADE_LABELS[r.prioridade] ?? r.prioridade, { content: `${days} d`, styles: getDeadlineStyles(days) }, { content: ESTADO_LABELS[r.estado] ?? r.estado, styles: { textColor: getStatusColor(r.estado), fontStyle: 'bold' } }]; }),
          styles: tableStyles, headStyles: tableHeadStyles, alternateRowStyles: tableAlternateRowStyles, margin: { left: 10, right: 10 }, columnStyles: { 2: { cellWidth: 50 } },
          didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if (selected.has('transporte')) {
      if (sectionCount > 0) { doc.addPage(); doc.setFillColor(255, 255, 255); doc.rect(0, 0, pageW, pageH, 'F'); y = 20; }
      sectionCount++;
      addSectionTitle('Requisições de Transporte', reqTransporte.length);
      if (reqTransporte.length === 0) {
        doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text('Sem requisições no período selecionado.', 14, y); y += 8;
      } else {
        autoTable(doc, {
          startY: y, head: [['Data', 'Criado Por', 'Destino', 'Veículo', 'Duração', 'Estado']],
          body: reqTransporte.map(r => { const days = getDiffDays(r.criadoEm); return [r.criadoEm ? formatDateStr(r.criadoEm) : '—', r.criadoPor?.nome ? `${r.criadoPor.nome} (${r.criadoPor.tipo ?? '?'})` : '—', r.destino ?? '—', r.transportes?.[0]?.transporte?.matricula ?? r.transporte?.matricula ?? '—', { content: `${days} d`, styles: getDeadlineStyles(days) }, { content: ESTADO_LABELS[r.estado] ?? r.estado, styles: { textColor: getStatusColor(r.estado), fontStyle: 'bold' } }]; }),
          styles: tableStyles, headStyles: tableHeadStyles, alternateRowStyles: tableAlternateRowStyles, margin: { left: 10, right: 10 },
          didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if (selected.has('manutencao')) {
      if (sectionCount > 0) { doc.addPage(); doc.setFillColor(255, 255, 255); doc.rect(0, 0, pageW, pageH, 'F'); y = 20; }
      sectionCount++;
      addSectionTitle('Requisições de Manutenção', reqManutencao.length);
      if (reqManutencao.length === 0) {
        doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text('Sem requisições no período selecionado.', 14, y); y += 8;
      } else {
        autoTable(doc, {
          startY: y, head: [['Data', 'Criado Por', 'Assunto', 'Prioridade', 'Duração', 'Estado']],
          body: reqManutencao.map(r => { const days = getDiffDays(r.criadoEm); return [r.criadoEm ? formatDateStr(r.criadoEm) : '—', r.criadoPor?.nome ? `${r.criadoPor.nome} (${r.criadoPor.tipo ?? '?'})` : '—', r.assunto ?? r.descricao ?? '—', PRIORIDADE_LABELS[r.prioridade] ?? r.prioridade, { content: `${days} d`, styles: getDeadlineStyles(days) }, { content: ESTADO_LABELS[r.estado] ?? r.estado, styles: { textColor: getStatusColor(r.estado), fontStyle: 'bold' } }]; }),
          styles: tableStyles, headStyles: tableHeadStyles, alternateRowStyles: tableAlternateRowStyles, margin: { left: 10, right: 10 },
          didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addFooter(i); }
    return doc;
  };

  const generatePDF = async () => {
    if (selected.size === 0) { toast.error('Selecione pelo menos um tipo de dados.'); return; }
    if (!startDate || !endDate) { toast.error('Intervalo de datas inválido.'); return; }
    setIsGenerating(true);
    try {
      const doc = await preparePDF();
      doc.save(`relatorio_${startDate}_${endDate}.pdf`);
      toast.success('Relatório gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar relatório.');
    } finally { setIsGenerating(false); }
  };

  const handleSendEmail = async () => {
    if (selected.size === 0) { toast.error('Selecione pelo menos um tipo de dados.'); return; }
    const email = window.prompt('Introduza o e-mail de destino:');
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error('E-mail inválido'); return; }

    setIsSendingEmail(true);
    try {
      const doc = await preparePDF();
      const pdfBase64 = doc.output('datauristring');
      const subject = `Relatório Institucional - Florinhas do Vouga (${formatDatePt(startDate)} a ${formatDatePt(endDate)})`;
      const body = `Olá,\n\nSegue em anexo o relatório institucional referente ao período de ${formatDatePt(startDate)} até ${formatDatePt(endDate)}.\n\n` +
        `Conteúdo do relatório:\n` +
        Array.from(selected).map(s => `- ${SECTIONS.find(sec => sec.id === s)?.label}`).join('\n') +
        `\n\nEste e-mail foi gerado automaticamente pelo portal de gestão.`;

      await reportsApi.sendByEmail({ to: email, subject, body, pdfBase64, fileName: `relatorio_${startDate}_${endDate}.pdf` });
      toast.success('Relatório enviado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar e-mail.');
    } finally { setIsSendingEmail(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
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

      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Período</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Início</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Fim</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500 outline-none" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { label: 'Este mês', start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 0) },
            { label: 'Últimos 30 dias', start: new Date(Date.now() - 29 * 86400000), end: today },
            { label: 'Este ano', start: new Date(today.getFullYear(), 0, 1), end: today },
          ].map(({ label, start, end }) => (
            <button key={label} onClick={() => { setStartDate(formatDate(start)); setEndDate(formatDate(end)); }} className="text-xs px-3 py-1.5 rounded-full border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 font-medium">
              {label}
            </button>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100 mb-4">Dados a Incluir</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTIONS.map(section => {
            const isChecked = selected.has(section.id);
            return (
              <button key={section.id} onClick={() => toggle(section.id)} className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${isChecked ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 bg-white/50 dark:bg-gray-800/30'}`}>
                <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center ${isChecked ? 'bg-purple-600 border-purple-600' : 'border-gray-300'}`}>
                  {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div><div className="font-medium text-sm text-gray-800 dark:text-gray-100">{section.label}</div><div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{section.description}</div></div>
              </button>
            );
          })}
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button onClick={() => setSelected(new Set(SECTIONS.map(s => s.id)))} className="text-xs text-purple-600 dark:text-purple-400 hover:underline">Selecionar tudo</button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <button onClick={() => setSelected(new Set())} className="text-xs text-gray-500 dark:text-gray-400 hover:underline">Limpar seleção</button>
        </div>
      </GlassCard>

      <div className="flex justify-end gap-3">
        <Button onClick={handleSendEmail} disabled={isSendingEmail || selected.size === 0} variant="outline" className="border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
          {isSendingEmail ? <> <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> A enviar...</> : <> <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Enviar por Email</>}
        </Button>
        <Button onClick={generatePDF} disabled={isGenerating || selected.size === 0} className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white px-8 py-3 rounded-xl shadow-lg shadow-pink-200 dark:shadow-pink-900/30 font-semibold text-sm transition-all flex items-center gap-2">
          {isGenerating ? <> <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg> A gerar...</> : <> <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg> Gerar PDF</>}
        </Button>
      </div>
    </div>
  );
}
