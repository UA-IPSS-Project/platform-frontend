import { useState } from 'react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { DatePickerField, formatDateInput, parseDateInput } from '../components/ui/date-picker-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import SUBJECTS, { getSubjectLabel } from '../lib/subjects';
import { ArrowLeftIcon, DownloadIcon, FileTextIcon } from '../components/shared/CustomIcons';
import { StatusBadge } from '../components/shared/status-badge';
import { useAppointmentStatus } from '../hooks/useAppointmentStatus';
import { Appointment } from '../types';

interface HistoryPageProps {
  appointments: Appointment[];
  onBack: () => void;
  onViewAppointment: (appointment: Appointment) => void;
  isDarkMode: boolean;
  startDate: Date | null;
  endDate: Date;
  onDateChange: (start: Date | null, end: Date) => void;
  isClient?: boolean;
}

const ITEMS_PER_PAGE = 10;

const parseAppointmentDate = (value: Appointment['date']) => {
  const parsed = new Date(value as Date);
  return isNaN(parsed.getTime()) ? null : parsed;
};

export function HistoryPage({ appointments, onBack, onViewAppointment, isDarkMode, startDate, endDate, onDateChange, isClient = false }: HistoryPageProps) {
  void isDarkMode;
  const { t, i18n } = useTranslation();
  const { getStatusLabel } = useAppointmentStatus();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  /* Sorting State */
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const currentLocale = i18n.resolvedLanguage === 'en' ? 'en-GB' : 'pt-PT';

  const readThemeColor = (variable: string, fallback: string) => {
    if (typeof window === 'undefined') return fallback;
    const value = getComputedStyle(document.documentElement).getPropertyValue(variable).trim();
    return value || fallback;
  };

  const themePalette = {
    primary: readThemeColor('--primary', 'black'),
    foreground: readThemeColor('--foreground', 'black'),
    background: readThemeColor('--background', 'white'),
    border: readThemeColor('--border', 'gray'),
    mutedForeground: readThemeColor('--muted-foreground', 'gray'),
    statusSuccess: readThemeColor('--status-success', 'green'),
    statusWarning: readThemeColor('--status-warning', 'orange'),
    statusError: readThemeColor('--status-error', 'red'),
    statusNeutral: readThemeColor('--status-neutral', 'gray'),
  };

  // Sort appointments by date
  const sortedAppointments = [...appointments].sort((a, b) => {
    const dateA = parseAppointmentDate(a.date);
    const dateB = parseAppointmentDate(b.date);
    const dateCompare = (dateB?.getTime() ?? 0) - (dateA?.getTime() ?? 0);

    // Reverse if ascending
    const modifier = sortOrder === 'asc' ? -1 : 1;

    if (dateCompare !== 0) return dateCompare * modifier;

    const [aHour, aMin] = a.time.split(':').map(Number);
    const [bHour, bMin] = b.time.split(':').map(Number);
    return ((bHour * 60 + bMin) - (aHour * 60 + aMin)) * modifier;
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
      appointmentDate?.toLocaleDateString(currentLocale)?.includes(searchTerm) ||
      apt.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      apt.patientNIF.includes(searchTerm) ||
      apt.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getSubjectLabel(apt.subject, t).toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  // ... (Export functions remain unchanged)
  // Gerar nome do arquivo
  const getFileName = (extension: string) => {
    const today = new Date();
    return `history_${today.toLocaleDateString(currentLocale).replace(/\//g, '-')}.${extension}`;
  };

  // Exportar como CSV
  const handleExportCSV = () => {
    if (filteredAppointments.length === 0) {
      toast.warning(t('history.toast.noAppointmentsToExport'));
      return;
    }

    const headers = [
      t('history.export.headers.time'),
      t('history.export.headers.date'),
      t('history.export.headers.attendant'),
    ];
    if (!isClient) {
      headers.push(
        t('history.export.headers.patientName'),
        'NIF',
        t('history.export.headers.contact'),
        t('history.export.headers.email'),
      );
    }
    headers.push(t('history.export.headers.subject'), t('history.export.headers.status'));

    const csvContent = [
      headers.join(';'),
      ...filteredAppointments.map(apt => {
        const date = parseAppointmentDate(apt.date);
        const formattedDate = date?.toLocaleDateString(currentLocale) ?? String(apt.date);
        const status = getStatusLabel(apt.status);

        const escapeField = (field: string) => {
          if (field.includes(';') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };

        const row = [
          apt.time,
          formattedDate,
          escapeField(apt.attendantName || '-')
        ];

        if (!isClient) {
          row.push(
            escapeField(apt.patientName || ''),
            apt.patientNIF || '',
            apt.patientContact || '',
            apt.patientEmail || ''
          );
        }

        row.push(
          escapeField(apt.subject || ''),
          status
        );

        return row.join(';');
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
    toast.success(t('history.toast.csvSuccess'));
  };

  // Exportar como Excel
  const handleExportExcel = () => {
    if (filteredAppointments.length === 0) {
      toast.warning(t('history.toast.noAppointmentsToExport'));
      return;
    }

    const headers = [
      t('history.export.headers.time'),
      t('history.export.headers.date'),
      t('history.export.headers.attendant'),
    ];
    if (!isClient) {
      headers.push(
        t('history.export.headers.patientName'),
        'NIF',
        t('history.export.headers.contact'),
        t('history.export.headers.email'),
      );
    }
    headers.push(t('history.export.headers.subject'), t('history.export.headers.status'));

    // Função para obter cor do status
    const getStatusColor = (statusKey: string) => {
      switch (statusKey) {
        case 'completed': return themePalette.statusSuccess;
        case 'no-show': return themePalette.statusWarning;
        case 'warning': return themePalette.statusWarning;
        case 'cancelled': return themePalette.statusError;
        default: return themePalette.statusNeutral;
      }
    };

    let tableContent = '<table border="1">';
    tableContent += '<tr>' + headers.map(h => `<th style="background-color:${themePalette.primary};color:${readThemeColor('--primary-foreground', 'white')};font-weight:bold;padding:8px;">${h}</th>`).join('') + '</tr>';

    filteredAppointments.forEach(apt => {
      const date = parseAppointmentDate(apt.date);
      const formattedDate = date?.toLocaleDateString(currentLocale) ?? String(apt.date);
      const status = getStatusLabel(apt.status);
      const statusColor = getStatusColor(apt.status);

      tableContent += '<tr>';
      tableContent += `<td style="padding:6px;">${apt.time}</td>`;
      tableContent += `<td style="padding:6px;">${formattedDate}</td>`;
      tableContent += `<td style="padding:6px;">${apt.attendantName || '-'}</td>`;

      if (!isClient) {
        tableContent += `<td style="padding:6px;">${apt.patientName || ''}</td>`;
        tableContent += `<td style="padding:6px;">${apt.patientNIF || ''}</td>`;
        tableContent += `<td style="padding:6px;">${apt.patientContact || ''}</td>`;
        tableContent += `<td style="padding:6px;">${apt.patientEmail || ''}</td>`;
      }

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
    toast.success(t('history.toast.excelSuccess'));
  };

  // Exportar como PDF
  const handleExportPDF = () => {
    if (filteredAppointments.length === 0) {
      toast.warning(t('history.toast.noAppointmentsToExport'));
      return;
    }

    const headers = [
      t('history.export.headers.time'),
      t('history.export.headers.date'),
      t('history.export.headers.attendant'),
    ];
    if (!isClient) {
      headers.push(t('history.export.headers.patientName'), 'NIF');
    }
    headers.push(t('history.export.headers.subject'), t('history.export.headers.status'));

    const today = new Date();

    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${t('history.title')}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            background-color: ${themePalette.background};
            color: ${themePalette.foreground};
          }
          h1 { color: ${themePalette.primary}; text-align: center; margin-bottom: 5px; }
          .subtitle { text-align: center; color: ${themePalette.mutedForeground}; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: ${themePalette.primary}; color: ${readThemeColor('--primary-foreground', 'white')}; padding: 10px; text-align: left; font-size: 12px; }
          td { padding: 8px; border-bottom: 1px solid ${themePalette.border}; font-size: 11px; }
          tr:nth-child(even) { background-color: ${readThemeColor('--muted', 'whitesmoke')}; }
          .status-completed { color: ${themePalette.statusSuccess}; font-weight: bold; }
          .status-cancelled { color: ${themePalette.statusError}; }
          .status-no_show { color: ${themePalette.statusWarning}; font-weight: bold; }
          .status-warning { color: ${themePalette.statusWarning}; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 10px; color: ${themePalette.mutedForeground}; }
          @media print {
            body { -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <br/><br/><br/>
        <h1>${t('history.title')}</h1>
        <p class="subtitle">${t('history.export.recordsFound', { count: filteredAppointments.length })}</p>
        <table>
          <thead>
            <tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>
          </thead>
          <tbody>
    `;

    filteredAppointments.forEach(apt => {
      const date = parseAppointmentDate(apt.date);
      const formattedDate = date?.toLocaleDateString(currentLocale) ?? String(apt.date);
      const status = getStatusLabel(apt.status);
      const statusClass = `status-${apt.status.toLowerCase().replace('-', '_')}`;

      htmlContent += `
        <tr>
          <td>${apt.time}</td>
          <td>${formattedDate}</td>
          <td>${apt.attendantName || '-'}</td>
          ${!isClient ? `<td>${apt.patientName || ''}</td><td>${apt.patientNIF || ''}</td>` : ''}
          <td>${apt.subject || ''}</td>
          <td class="${statusClass}">${status}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        <p class="footer">${t('history.export.generatedAt', {
          date: today.toLocaleDateString(currentLocale),
          time: today.toLocaleTimeString(currentLocale),
        })}</p>
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
    toast.success(t('history.toast.preparingPdf'));
  };

  const handleExport = () => {
    setExportDialogOpen(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-foreground hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeftIcon className="w-5 h-5" />
        <span>{t('history.backToAppointments')}</span>
      </button>

      {/* History Card */}
      <div className="rounded-lg bg-card border border-border shadow-xl p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl text-foreground">{t('history.title')}</h1>
          <Button
            variant="outline"
            onClick={handleExport}
            className="gap-2"
          >
            <DownloadIcon className="w-4 h-4" />
            {t('history.export.action')}
          </Button>
        </div>

        {/* Filters */}
        {/* Filters and Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="md:col-span-1">
            <label className="text-xs text-muted-foreground mb-1 ml-1 block">{t('history.filters.fromDate')}</label>
            <DatePickerField
              value={startDate ? formatDateInput(startDate) : ''}
              onChange={(value) => onDateChange(parseDateInput(value) ?? null, endDate)}
              buttonClassName="bg-background border-border text-foreground shadow-sm"
            />
          </div>

          <div className="md:col-span-3">
            <label className="text-xs text-muted-foreground mb-1 ml-1 block">{t('history.filters.searchLabel')}</label>
            <Input
              type="text"
              placeholder={t('history.filters.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-background border-border text-foreground shadow-sm"
            />
          </div>
        </div>

        {/* Existing Filters Row 2 (Status/Subject) */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="bg-background border-border text-foreground shadow-sm">
              <SelectValue placeholder={t('history.filters.allStatuses')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history.filters.allStatuses')}</SelectItem>
              <SelectItem value="completed">{t('history.status.completed')}</SelectItem>
              {/* <SelectItem value="warning">Aviso</SelectItem> */}
              <SelectItem value="no-show">{t('history.status.noShow')}</SelectItem>
              <SelectItem value="cancelled">{t('history.status.cancelled')}</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={subjectFilter}
            onValueChange={(value) => {
              setSubjectFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="bg-background border-border text-foreground shadow-sm">
              <SelectValue placeholder={t('history.filters.allSubjects')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('history.filters.allSubjects')}</SelectItem>
              {uniqueSubjects.map((subject) => (
                <SelectItem key={subject} value={subject}>
                  {getSubjectLabel(subject, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm text-primary">{t('history.table.timeHeader').toUpperCase()}</th>
                <th
                  className="text-left py-3 px-4 text-sm text-primary cursor-pointer hover:bg-muted/60 transition-colors group select-none"
                  onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                >
                  <div className="flex items-center gap-1">
                    {t('history.table.dayHeader').toUpperCase()}
                    <span className="flex flex-col -space-y-1">
                      <svg className={`w-2 h-2 ${sortOrder === 'asc' ? 'text-primary font-bold' : 'text-muted-foreground/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 15l7-7 7 7" /></svg>
                      <svg className={`w-2 h-2 ${sortOrder === 'desc' ? 'text-primary font-bold' : 'text-muted-foreground/50'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </span>
                  </div>
                </th>
                <th className="text-left py-3 px-4 text-sm text-primary">{t('history.table.attendantHeader').toUpperCase()}</th>
                {!isClient && <th className="text-left py-3 px-4 text-sm text-primary">{t('history.table.patientHeader').toUpperCase()}</th>}
                <th className="text-left py-3 px-4 text-sm text-primary">{t('history.table.subjectHeader').toUpperCase()}</th>
                <th className="text-left py-3 px-4 text-sm text-primary">{t('history.table.statusHeader').toUpperCase()}</th>
              </tr>
            </thead>
            <tbody>
              {paginatedAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-muted-foreground">
                    {t('history.table.noResults')}
                  </td>
                </tr>
              ) : (
                paginatedAppointments.map((apt) => (
                  <tr
                    key={apt.id}
                    onClick={() => onViewAppointment(apt)}
                    className="border-b border-border cursor-pointer transition-colors hover:bg-muted/40"
                  >
                    <td className="py-4 px-4 text-foreground">{apt.time}</td>
                    <td className="py-4 px-4 text-foreground">
                      {parseAppointmentDate(apt.date)?.toLocaleDateString(currentLocale) ?? String(apt.date)}
                    </td>
                    <td className="py-4 px-4 text-foreground">{apt.attendantName || '-'}</td>
                    {!isClient && <td className="py-4 px-4 text-foreground">{apt.patientName}</td>}
                    <td className="py-4 px-4 text-foreground">{getSubjectLabel(apt.subject, t)}</td>
                    <td className="py-4 px-4"><StatusBadge status={apt.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredAppointments.length > 0 && (
          <div className="flex items-center justify-between mt-6">
            <p className="text-sm text-muted-foreground">
              {t('history.pagination.showingRange', {
                start: startIndex + 1,
                end: Math.min(endIndex, filteredAppointments.length),
                total: filteredAppointments.length,
              })}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="border-border"
              >
                {t('history.pagination.previous')}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="border-border"
              >
                {t('history.pagination.next')}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Export Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-md w-full bg-card text-foreground border-border shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">{t('history.export.dialogTitle')}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              {t('history.export.dialogDescription', { count: filteredAppointments.length })}
            </p>
          </DialogHeader>
          <div className="grid gap-3 mt-4">
            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-muted/50 transition-colors"
              onClick={handleExportCSV}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[color:var(--status-success-soft)]">
                <FileTextIcon className="w-5 h-5 text-[color:var(--status-success)]" />
              </div>
              <div className="text-left">
                <div className="font-medium">CSV</div>
                <div className="text-xs text-muted-foreground">{t('history.export.csvDescription')}</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-muted/50 transition-colors"
              onClick={handleExportExcel}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[color:var(--status-info-soft)]">
                <svg className="w-5 h-5 text-[color:var(--status-info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">Excel</div>
                <div className="text-xs text-muted-foreground">{t('history.export.excelDescription')}</div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-start gap-4 h-16 px-4 hover:bg-muted/50 transition-colors"
              onClick={handleExportPDF}
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-[color:var(--status-error-soft)]">
                <svg className="w-5 h-5 text-[color:var(--status-error)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium">PDF</div>
                <div className="text-xs text-muted-foreground">{t('history.export.pdfDescription')}</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
