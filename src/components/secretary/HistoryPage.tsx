import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner';
import SUBJECTS from '../../lib/subjects';
import { ArrowLeftIcon, DownloadIcon, FileTextIcon } from '../CustomIcons';
import type { Appointment } from '../SecretaryDashboard';

interface HistoryPageProps {
  appointments: Appointment[];
  onBack: () => void;
  onViewAppointment: (appointment: Appointment) => void;
  isDarkMode: boolean;
}

const ITEMS_PER_PAGE = 4;

const parseAppointmentDate = (value: Appointment['date']) => {
  const parsed = new Date(value as Date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

const getStatusLabel = (status: Appointment['status']) => {
  switch (status) {
    case 'completed':
      return 'Concluído';
    case 'warning':
      return 'Aviso';
    case 'no-show':
      return 'Não compareceu';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

const getStatusBadge = (status: Appointment['status']) => {
  switch (status) {
    case 'completed':
      return <Badge className="bg-green-600 text-white">Concluído</Badge>;
    case 'warning':
      return <Badge className="bg-yellow-500 text-gray-900">Aviso</Badge>;
    case 'no-show':
      return <Badge style={{ backgroundColor: '#f97316', color: 'white' }}>Não compareceu</Badge>;
    case 'cancelled':
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return null;
  }
};

export function HistoryPage({ appointments, onBack, onViewAppointment, isDarkMode }: HistoryPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  // Sort appointments by date (most recent first)
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = parseAppointmentDate(a.date);
    const dateB = parseAppointmentDate(b.date);
    const dateCompare = (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);
    if (dateCompare !== 0) return dateCompare;

    const [aHour, aMin] = a.time.split(':').map(Number);
    const [bHour, bMin] = b.time.split(':').map(Number);
    return (bHour * 60 + bMin) - (aHour * 60 + aMin);
  });

  // Use the predefined SUBJECTS list for filters
  const uniqueSubjects = SUBJECTS;

  // Filter appointments
  const filteredAppointments = sortedAppointments.filter(apt => {
    const statusText = getStatusLabel(apt.status);
    const appointmentDate = parseAppointmentDate(apt.date);
    const matchesSearch =
      searchTerm === '' ||
      apt.time.includes(searchTerm) ||
      appointmentDate?.toLocaleDateString('pt-PT')?.includes(searchTerm) ||
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientNIF.includes(searchTerm) ||
      apt.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      statusText.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || apt.status === statusFilter;
    const matchesSubject = subjectFilter === 'all' || apt.subject === subjectFilter;

    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Pagination
  const totalPages = Math.ceil(filteredAppointments.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAppointments = filteredAppointments.slice(startIndex, endIndex);

  // Gerar nome do arquivo
  const getFileName = (extension: string) => {
    const today = new Date();
    return `historico_${today.toLocaleDateString('pt-PT').replace(/\//g, '-')}.${extension}`;
  };

  // Exportar como CSV
  const handleExportCSV = () => {
    if (filteredAppointments.length === 0) {
      toast.warning('Não existem marcações para exportar');
      return;
    }

    const headers = ['Horário', 'Data', 'Atendente', 'Nome do Utente', 'NIF', 'Contacto', 'Email', 'Assunto', 'Estado'];
    const csvContent = [
      headers.join(';'),
      ...filteredAppointments.map(apt => {
        const date = parseAppointmentDate(apt.date);
        const formattedDate = date?.toLocaleDateString('pt-PT') ?? String(apt.date);
        const status = getStatusLabel(apt.status);

        const escapeField = (field: string) => {
          if (field.includes(';') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };

        return [
          apt.time,
          formattedDate,
          escapeField(apt.attendantName || '-'),
          escapeField(apt.patientName || ''),
          apt.patientNIF || '',
          apt.patientContact || '',
          apt.patientEmail || '',
          escapeField(apt.subject || ''),
          status
        ].join(';');
      })
    ].join('\n');

    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', getFileName('csv'));
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setExportDialogOpen(false);
    toast.success('Histórico exportado em CSV com sucesso');
  };

  // Exportar como Excel
  const handleExportExcel = () => {
    if (filteredAppointments.length === 0) {
      toast.warning('Não existem marcações para exportar');
      return;
    }

    const headers = ['Horário', 'Data', 'Atendente', 'Nome do Utente', 'NIF', 'Contacto', 'Email', 'Assunto', 'Estado'];

    // Função para obter cor do status
    const getStatusColor = (statusKey: string) => {
      switch (statusKey) {
        case 'completed': return '#38a169';
        case 'no-show': return '#f97316';
        case 'warning': return '#d69e2e';
        case 'cancelled': return '#e53e3e';
        default: return '#4a5568';
      }
    };

    let tableContent = '<table border="1">';
    tableContent += '<tr>' + headers.map(h => `<th style="background-color:#4a5568;color:white;font-weight:bold;padding:8px;">${h}</th>`).join('') + '</tr>';

    filteredAppointments.forEach(apt => {
      const date = parseAppointmentDate(apt.date);
      const formattedDate = date?.toLocaleDateString('pt-PT') ?? String(apt.date);
      const status = getStatusLabel(apt.status);
      const statusColor = getStatusColor(apt.status);

      tableContent += '<tr>';
      tableContent += `<td style="padding:6px;">${apt.time}</td>`;
      tableContent += `<td style="padding:6px;">${formattedDate}</td>`;
      tableContent += `<td style="padding:6px;">${apt.attendantName || '-'}</td>`;
      tableContent += `<td style="padding:6px;">${apt.patientName || ''}</td>`;
      tableContent += `<td style="padding:6px;">${apt.patientNIF || ''}</td>`;
      tableContent += `<td style="padding:6px;">${apt.patientContact || ''}</td>`;
      tableContent += `<td style="padding:6px;">${apt.patientEmail || ''}</td>`;
      tableContent += `<td style="padding:6px;">${apt.subject || ''}</td>`;
      tableContent += `<td style="padding:6px;color:${statusColor};font-weight:bold;">${status}</td>`;
      tableContent += '</tr>';
    });
    tableContent += '</table>';

    const excelContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel">
      <head><meta charset="UTF-8"></head>
      <body>${tableContent}</body>
      </html>
    `;

    const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', getFileName('xls'));
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);

    setExportDialogOpen(false);
    toast.success('Histórico exportado em Excel com sucesso');
  };

  // Exportar como PDF
  const handleExportPDF = () => {
    if (filteredAppointments.length === 0) {
      toast.warning('Não existem marcações para exportar');
      return;
    }

    const headers = ['Horário', 'Data', 'Atendente', 'Nome do Utente', 'NIF', 'Assunto', 'Estado'];
    const today = new Date();

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Histórico de Marcações</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          h1 { color: #1a202c; text-align: center; margin-bottom: 5px; }
          .subtitle { text-align: center; color: #4a5568; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #4a5568; color: white; padding: 10px; text-align: left; font-size: 12px; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 11px; }
          tr:nth-child(even) { background-color: #f7fafc; }
          .status-completed { color: #38a169; font-weight: bold; }
          .status-cancelled { color: #e53e3e; }
          .status-no_show { color: #f97316; font-weight: bold; }
          .status-warning { color: #d69e2e; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #718096; }
        </style>
      </head>
      <body>
        <br/><br/><br/>
        <h1>Histórico de Marcações</h1>
        <p class="subtitle">${filteredAppointments.length} registos encontrados</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
    `;

    filteredAppointments.forEach(apt => {
      const date = parseAppointmentDate(apt.date);
      const formattedDate = date?.toLocaleDateString('pt-PT') ?? String(apt.date);
      const status = getStatusLabel(apt.status);
      const statusClass = `status-${apt.status.toLowerCase().replace('-', '_')}`;

      htmlContent += `
        <tr>
          <td>${apt.time}</td>
          <td>${formattedDate}</td>
          <td>${apt.attendantName || '-'}</td>
          <td>${apt.patientName || ''}</td>
          <td>${apt.patientNIF || ''}</td>
          <td>${apt.subject || ''}</td>
          <td class="${statusClass}">${status}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        <p class="footer">Gerado em ${today.toLocaleDateString('pt-PT')} às ${today.toLocaleTimeString('pt-PT')}</p>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      printWindow.document.replaceChild(
        printWindow.document.importNode(doc.documentElement, true),
        printWindow.document.documentElement
      );
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }

    setExportDialogOpen(false);
    toast.success('A preparar PDF para impressão...');
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:text-purple-600 dark:hover:text-purple-400 mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>Voltar para Marcações</span>
      </button>

      {/* History Card */}
      <div className={`rounded-lg ${isDarkMode ? 'bg-gray-900/50 border border-gray-800 shadow-lg' : 'bg-white shadow-xl'} p-6`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl text-gray-900 dark:text-gray-100">Histórico de Marcações</h1>
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <DownloadIcon className="w-4 h-4" />
            Exportar
          </Button>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Input
            type="text"
            placeholder="Pesquisar..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className={`${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white'} shadow-sm`}
          />

          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={`${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white'} shadow-sm`}>
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os estados</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="completed">Concluído</SelectItem>
              <SelectItem value="warning">Aviso</SelectItem>
              <SelectItem value="no-show">Não compareceu</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={subjectFilter}
            onValueChange={(value) => {
              setSubjectFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className={`${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white'} shadow-sm`}>
              <SelectValue placeholder="Todos os assuntos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os assuntos</SelectItem>
              {uniqueSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {subject}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className={isDarkMode ? 'bg-gray-900/30' : 'bg-gray-50'}>
              <tr className={`border-b ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">HORÁRIO</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">DIA</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">ATENDENTE</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">UTENTE</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">ASSUNTO</th>
                <th className="text-left py-3 px-4 text-sm text-purple-600 dark:text-purple-400">ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-500 dark:text-gray-400">
                    Nenhuma marcação encontrada
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((apt) => (
                  <tr
                    key={apt.id}
                    onClick={() => onViewAppointment(apt)}
                    className={`border-b cursor-pointer transition-colors ${isDarkMode
                      ? 'border-gray-800 hover:bg-gray-800/50'
                      : 'border-gray-100 hover:bg-gray-50'
                      }`}
                  >
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">{apt.time}</td>
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">
                      {parseAppointmentDate(apt.date)?.toLocaleDateString('pt-PT') ?? String(apt.date)}
                    </td>
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">{apt.attendantName || '-'}</td>
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">{apt.patientName}</td>
                    <td className="py-4 px-4 text-gray-900 dark:text-gray-100">{apt.subject}</td>
                    <td className="py-4 px-4">{getStatusBadge(apt.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAppointments.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              A mostrar {startIndex + 1}-{Math.min(endIndex, filteredAppointments.length)} de {filteredAppointments.length} resultados
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={isDarkMode ? 'border-gray-700' : ''}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={isDarkMode ? 'border-gray-700' : ''}
              >
                Seguinte
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md w-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-gray-200 dark:border-gray-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">Exportar Histórico</DialogTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Escolha o formato de exportação ({filteredAppointments.length} registos)
            </p>
          </DialogHeader>
          <div className="grid gap-3 mt-4">
            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={handleExportCSV}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30">
                <FileTextIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-left">
                <div className="font-medium">CSV</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Formato de texto compatível com Excel e outras aplicações</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={handleExportExcel}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">Excel</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Ficheiro formatado para Microsoft Excel</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              onClick={handleExportPDF}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">PDF</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Documento para impressão ou visualização</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
