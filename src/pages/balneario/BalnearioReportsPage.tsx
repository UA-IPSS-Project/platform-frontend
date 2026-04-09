import { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toast } from 'sonner';
import { GlassCard } from '../../components/ui/glass-card';
import { Button } from '../../components/ui/button';
import { DatePickerField } from '../../components/ui/date-picker-field';
import { marcacoesApi } from '../../services/api/marcacoes/marcacoesApi';
import { requisicoesApi } from '../../services/api/requisicoes/requisicoesApi';
import type { RequisicaoResponse } from '../../services/api/requisicoes/types';
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

const loadImage = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (err) => reject(err);
    img.src = url;
  });
};

type ReportSection =
  | 'balneario'
  | 'material'
  | 'transporte'
  | 'manutencao';

const SECTIONS: { id: ReportSection; label: string; description: string }[] = [
  { id: 'balneario', label: 'Marcações do Balneário', description: 'Sessões de higiene, lavagem de roupa e estado' },
  { id: 'material', label: 'Requisições de Material', description: 'Pedidos de material de escritório e consumíveis' },
  { id: 'transporte', label: 'Requisições de Transporte', description: 'Reservas de viaturas e viagens agendadas' },
  { id: 'manutencao', label: 'Requisições de Manutenção', description: 'Pedidos de obras e reparações' },
];

const ESTADO_LABELS: Record<string, string> = {
  AGENDADO: 'Agendado',
  CONCLUIDO: 'Concluído',
  CANCELADO: 'Cancelado',
  NAO_COMPARECIDO: 'Não Compareceu',
  INVALIDO: 'Inválido',
  EM_PREENCHIMENTO: 'Em Preenchimento',
  // Requisitions (includes EM_PROGRESSO)
  ABERTO: 'Aberto',
  EM_PROGRESSO: 'Em Progresso',
  FECHADO: 'Fechado',
  RECUSADO: 'Recusado',
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

// Color palette for PDF (Fixed to Light Mode)
const colors: Record<string, [number, number, number]> = {
  primary: [241, 149, 217], // brand primary RGB (Pink)
  background: [247, 242, 244], // light background RGB
  foreground: [30, 41, 59],
  muted: [252, 231, 243], // pink-100
  accent: [252, 231, 243], // pink-100
  border: [251, 207, 232], // pink-200
  tableBorder: [227, 45, 145], // table border RGB
};

const getStatusColor = (status?: string): [number, number, number] => {
  if (!status) return [107, 114, 128];
  const s = status.toUpperCase();
  if (['CONCLUIDO', 'ACEITE', 'CONCLUIDA'].includes(s)) return [16, 185, 129]; // Emerald 600
  if (['CANCELADO', 'RECUSADA', 'NAO_COMPARECIDO', 'INVALIDO'].includes(s)) return [220, 38, 38]; // Red 600
  if (['EM_PROGRESSO', 'EM_ANALISE', 'EM_PREENCHIMENTO', 'ENVIADA', 'URGENTE', 'ALTA'].includes(s)) return [245, 158, 11]; // Amber 600
  if (['AGENDADO', 'MEDIA'].includes(s)) return [241, 149, 217]; // scheduled/medium RGB
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
  if (days >= 30) return { textColor: [180, 83, 9], fontStyle: 'bold' };
  return { fontStyle: 'bold' };
};

const isRequisitionFinished = (estado?: string): boolean => {
  if (!estado) return false;
  const s = estado.toUpperCase();
  return s === 'FECHADO' || s === 'RECUSADO';
};

const getDurationCell = (r: RequisicaoResponse) => {
  const isFinished = isRequisitionFinished(r.estado);
  const effectiveDate = r.ultimaAlteracaoEstadoEm || r.criadoEm || '';
  const days = isFinished ? null : getDiffDays(effectiveDate);

  return {
    content: days !== null ? `${days} d` : '—',
    styles: days !== null ? getDeadlineStyles(days) : undefined
  };
};

export function BalnearioReportsPage() {
  const today = new Date();
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  const [startDate, setStartDate] = useState(formatDate(firstOfMonth));
  const [endDate, setEndDate] = useState(formatDate(lastOfMonth));
  const [selected, setSelected] = useState<Set<ReportSection>>(new Set(['balneario', 'material', 'transporte', 'manutencao']));
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const toggle = (id: ReportSection) =>
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const preparePDF = async () => {
    const startISO = `${startDate}T00:00:00`;
    const endISO = `${endDate}T23:59:59`;

    // Fetch Balneario Appointments and ALL requisitions (we filter them later)
    const [marcacoesBalneario, allRequisitions, logoData] = await Promise.all([
      selected.has('balneario') ? marcacoesApi.consultarAgenda(startISO, endISO, 'BALNEARIO') : Promise.resolve([]),
      (selected.has('material') || selected.has('transporte') || selected.has('manutencao'))
        ? requisicoesApi.listar()
        : Promise.resolve([]),
      loadImage('/assets/LogoSemTexto.png').catch(() => null),
    ]);

    const startMs = new Date(startISO).getTime();
    const endMs = new Date(endISO).getTime();

    // Filter requisitions by date and specifically by ROLE (BALNEARIO)
    const filteredReqs = allRequisitions.filter(r => {
      // Date filter
      const createdAt = r.criadoEm ? new Date(r.criadoEm).getTime() : 0;
      const isWithinDate = createdAt >= startMs && createdAt <= endMs;

      // Role filter: Only show requisitions made by Balneario staff
      const isFromBalneario = r.criadoPor?.tipo === 'BALNEARIO';

      return isWithinDate && isFromBalneario;
    });

    const reqMaterial = filteredReqs.filter(r => r.tipo === 'MATERIAL' && selected.has('material'));
    const reqTransporte = filteredReqs.filter(r => r.tipo === 'TRANSPORTE' && selected.has('transporte'));
    const reqManutencao = filteredReqs.filter(r => r.tipo === 'MANUTENCAO' && selected.has('manutencao'));

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    let y = 0;

    // Set background color
    doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Header
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, 0, pageW, 28, 'F');
    
    // Header Content
    if (logoData) {
      doc.addImage(logoData, 'PNG', 14, 5, 18, 18);
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Atividade do Balneário', 38, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${formatDatePt(startDate)} a ${formatDatePt(endDate)}`, 38, 21);
    } else {
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Relatório de Atividade do Balneário', 14, 13);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Período: ${formatDatePt(startDate)} a ${formatDatePt(endDate)}`, 14, 21);
    }
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-PT')}`, pageW - 14 - doc.getTextWidth(`Gerado em: ${new Date().toLocaleString('pt-PT')}`), 21);

    y = 36;

    const addSectionTitle = (title: string, count: number) => {
      if (y > pageH - 50) {
        doc.addPage();
        doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]);
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
      doc.text('Relatório de Atividade — Balneário Social', 14, pageH - 7);
      doc.text(`Pág. ${pageNum}`, pageW - 14 - doc.getTextWidth(`Pág. ${pageNum}`), pageH - 7);
    };

    const tableStyles = { fontSize: 8, cellPadding: 2, textColor: colors.foreground, lineColor: colors.border, fillColor: colors.background };
    const tableHeadStyles = { fillColor: colors.primary, textColor: 255, fontStyle: 'bold' as const };
    const tableAlternateRowStyles = { fillColor: colors.accent };

    let sectionCount = 0;

    if (selected.has('balneario')) {
      if (sectionCount > 0) { doc.addPage(); doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]); doc.rect(0, 0, pageW, pageH, 'F'); y = 20; }
      sectionCount++;
      addSectionTitle('Marcações do Balneário', marcacoesBalneario.length);
      if (marcacoesBalneario.length === 0) {
        doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text('Sem marcações no período selecionado.', 14, y); y += 8;
      } else {
        autoTable(doc, {
          startY: y, head: [['Data', 'Hora', 'Utente', 'Higiene', 'Lavagem', 'Estado']],
          body: marcacoesBalneario.map(m => [
            formatDateStr(m.data),
            formatTimeStr(m.data),
            (m as any).marcacaoBalneario?.nomeUtente ?? '—',
            (m as any).marcacaoBalneario?.produtosHigiene ? 'Sim' : 'Não',
            (m as any).marcacaoBalneario?.lavagemRoupa ? 'Sim' : 'Não',
            { content: ESTADO_LABELS[m.estado] ?? m.estado, styles: { textColor: getStatusColor(m.estado), fontStyle: 'bold' } }
          ]),
          styles: tableStyles, headStyles: tableHeadStyles, alternateRowStyles: tableAlternateRowStyles, margin: { left: 10, right: 10 },
          tableLineColor: colors.tableBorder, tableLineWidth: 0.5,
          didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if (selected.has('material')) {
      if (sectionCount > 0) { doc.addPage(); doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]); doc.rect(0, 0, pageW, pageH, 'F'); y = 20; }
      sectionCount++;
      addSectionTitle('Requisições de Material (Equipa Balneário)', reqMaterial.length);
      if (reqMaterial.length === 0) {
        doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text('Sem requisições no período selecionado.', 14, y); y += 8;
      } else {
        autoTable(doc, {
          startY: y, head: [['Data Criação', 'Criado Por', 'Itens', 'Prioridade', 'Duração', 'Estado']],
          body: reqMaterial.map(r => {
            const grouped = (r.itens ?? []).reduce((acc: Record<string, string[]>, i) => {
              const cat = i.material?.categoria || 'Geral';
              if (!acc[cat]) acc[cat] = [];
              acc[cat].push(`• ${i.material?.nome ?? '?'} x${i.quantidade ?? 1}`);
              return acc;
            }, {});
            const itensStr = Object.entries(grouped)
              .map(([cat, items]) => `${cat}:\n${items.join('\n')}`)
              .join('\n\n') || '—';
            return [
              r.criadoEm ? formatDateStr(r.criadoEm) : '—',
              r.criadoPor?.nome ?? '—',
              itensStr,
              PRIORIDADE_LABELS[r.prioridade] ?? r.prioridade,
              getDurationCell(r),
              { content: ESTADO_LABELS[r.estado] ?? r.estado, styles: { textColor: getStatusColor(r.estado), fontStyle: 'bold' } }
            ];
          }),
          styles: tableStyles, headStyles: tableHeadStyles, alternateRowStyles: tableAlternateRowStyles, margin: { left: 10, right: 10 }, columnStyles: { 2: { cellWidth: 50 } },
          tableLineColor: colors.tableBorder, tableLineWidth: 0.5,
          didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if (selected.has('transporte')) {
      if (sectionCount > 0) { doc.addPage(); doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]); doc.rect(0, 0, pageW, pageH, 'F'); y = 20; }
      sectionCount++;
      addSectionTitle('Requisições de Transporte (Equipa Balneário)', reqTransporte.length);
      if (reqTransporte.length === 0) {
        doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text('Sem requisições no período selecionado.', 14, y); y += 8;
      } else {
        autoTable(doc, {
          startY: y, head: [['Data Criação', 'Criado Por', 'Destino', 'Veículo', 'Duração', 'Estado']],
          body: reqTransporte.map(r => [
            r.criadoEm ? formatDateStr(r.criadoEm) : '—',
            r.criadoPor?.nome ?? '—',
            r.destino ?? '—',
            r.transportes?.[0]?.transporte?.matricula ?? r.transporte?.matricula ?? '—',
            getDurationCell(r),
            { content: ESTADO_LABELS[r.estado] ?? r.estado, styles: { textColor: getStatusColor(r.estado), fontStyle: 'bold' } }
          ]),
          styles: tableStyles, headStyles: tableHeadStyles, alternateRowStyles: tableAlternateRowStyles, margin: { left: 10, right: 10 },
          tableLineColor: colors.tableBorder, tableLineWidth: 0.5,
          didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    if (selected.has('manutencao')) {
      if (sectionCount > 0) { doc.addPage(); doc.setFillColor(colors.background[0], colors.background[1], colors.background[2]); doc.rect(0, 0, pageW, pageH, 'F'); y = 20; }
      sectionCount++;
      addSectionTitle('Requisições de Manutenção (Equipa Balneário)', reqManutencao.length);
      if (reqManutencao.length === 0) {
        doc.setFontSize(9); doc.setTextColor(140, 140, 140); doc.text('Sem requisições no período selecionado.', 14, y); y += 8;
      } else {
        autoTable(doc, {
          startY: y, head: [['Data Criação', 'Criado Por', 'Assunto', 'Prioridade', 'Duração', 'Estado']],
          body: reqManutencao.map(r => [
            r.criadoEm ? formatDateStr(r.criadoEm) : '—',
            r.criadoPor?.nome ?? '—',
            r.assunto ?? r.descricao ?? '—',
            PRIORIDADE_LABELS[r.prioridade] ?? r.prioridade,
            getDurationCell(r),
            { content: ESTADO_LABELS[r.estado] ?? r.estado, styles: { textColor: getStatusColor(r.estado), fontStyle: 'bold' } }
          ]),
          styles: tableStyles, headStyles: tableHeadStyles, alternateRowStyles: tableAlternateRowStyles, margin: { left: 10, right: 10 },
          tableLineColor: colors.tableBorder, tableLineWidth: 0.5,
          didDrawPage: (data) => { addFooter(data.pageNumber); y = data.cursor?.y ?? y; },
        });
        y = (doc as any).lastAutoTable.finalY + 10;
      }
    }

    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) { doc.setPage(i); addFooter(i); }
    return doc;
  };

  const getReportFilename = () => {
    const moduleNames = SECTIONS
      .filter(s => selected.has(s.id))
      .map(s => s.id.charAt(0).toUpperCase() + s.id.slice(1))
      .join('_');

    const formatDateForFileName = (dStr: string) => {
      const [y, m, d] = dStr.split('-');
      return `${d}_${m}_${y}`;
    };

    const start = formatDateForFileName(startDate);
    const end = formatDateForFileName(endDate);

    const datePart = start === end ? start : `${start}_a_${end}`;

    return `relatorio_balneario_${moduleNames}_${datePart}.pdf`;
  };

  const generatePDF = async () => {
    if (selected.size === 0) {
      toast.error('Selecione pelo menos um tipo de dados.');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Intervalo de datas inválido.');
      return;
    }
    setIsGenerating(true);
    try {
      const doc = await preparePDF();
      doc.save(getReportFilename());
      toast.success('Relatório gerado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao gerar relatório.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSendEmail = async () => {
    if (selected.size === 0) {
      toast.error('Selecione pelo menos um tipo de dados.');
      return;
    }
    const email = window.prompt('Introduza o e-mail de destino:');
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('E-mail inválido');
      return;
    }

    setIsSendingEmail(true);
    try {
      const doc = await preparePDF();
      const pdfBase64 = doc.output('datauristring');
      const filename = getReportFilename();
      const subject = `Relatório Balneário - Florinhas do Vouga (${formatDatePt(startDate)} a ${formatDatePt(endDate)})`;
      const body = `Olá,\n\nSegue em anexo o relatório de atividade do balneário referente ao período de ${formatDatePt(startDate)} até ${formatDatePt(endDate)}.\n\n` +
        `Conteúdo do relatório:\n` +
        Array.from(selected).map(s => `- ${SECTIONS.find(sec => sec.id === s)?.label}`).join('\n') +
        `\n\nEste e-mail foi gerado automaticamente pelo portal de gestão.`;

      await reportsApi.sendByEmail({ to: email, subject, body, pdfBase64, fileName: filename });
      toast.success('Relatório enviado com sucesso!');
    } catch (err) {
      console.error(err);
      toast.error('Erro ao enviar e-mail.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg">
          <svg className="w-5 h-5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios do Balneário</h1>
          <p className="text-sm text-muted-foreground">Gere relatórios da sua atividade e requisições</p>
        </div>
      </div>

      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Período de Atividade</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Início</label>
            <DatePickerField value={startDate} onChange={setStartDate} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-foreground">Fim</label>
            <DatePickerField value={endDate} onChange={setEndDate} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {[
            { label: 'Hoje', start: today, end: today },
            { label: 'Este mês', start: new Date(today.getFullYear(), today.getMonth(), 1), end: new Date(today.getFullYear(), today.getMonth() + 1, 0) },
            { label: 'Mês passado', start: new Date(today.getFullYear(), today.getMonth() - 1, 1), end: new Date(today.getFullYear(), today.getMonth(), 0) },
          ].map(({ label, start, end }) => {
            const sStr = formatDate(start);
            const eStr = formatDate(end);
            const isActive = startDate === sStr && endDate === eStr;

            return (
              <button
                key={label}
                onClick={() => { setStartDate(sStr); setEndDate(eStr); }}
                className={`text-xs px-4 py-2 rounded-xl transition-all font-medium border ${isActive
                  ? 'bg-primary border-primary text-primary-foreground shadow-md'
                  : 'border-border text-muted-foreground hover:bg-accent bg-card/50'
                  }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Dados a Incluir no Relatório</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SECTIONS.map(section => {
            const isChecked = selected.has(section.id);
            return (
              <button key={section.id} onClick={() => toggle(section.id)} className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all ${isChecked ? 'border-primary bg-primary/10' : 'border-border hover:border-border/80 bg-card/50'}`}>
                <div className={`mt-0.5 w-5 h-5 rounded flex-shrink-0 border-2 flex items-center justify-center ${isChecked ? 'bg-primary border-primary' : 'border-border'}`}>
                  {isChecked && <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div><div className="font-medium text-sm text-foreground">{section.label}</div><div className="text-xs text-muted-foreground mt-0.5">{section.description}</div></div>
              </button>
            );
          })}
        </div>
      </GlassCard>

      <div className="flex justify-end gap-3">
        <Button onClick={handleSendEmail} disabled={isSendingEmail || selected.size === 0} variant="outline" className="border-border text-foreground hover:bg-accent px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
          {isSendingEmail ? 'A enviar...' : 'Enviar por Email'}
        </Button>
        <Button onClick={generatePDF} disabled={isGenerating || selected.size === 0} className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 rounded-xl shadow-lg font-semibold text-sm transition-all flex items-center gap-2">
          {isGenerating ? 'A gerar...' : 'Gerar PDF'}
        </Button>
      </div>
    </div>
  );
}
