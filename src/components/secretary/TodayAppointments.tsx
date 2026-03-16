import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Popover, PopoverTrigger, PopoverContent } from '../ui/popover';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import SUBJECTS from '../../lib/subjects';
import { toast } from 'sonner';
import { ClockIcon, DownloadIcon, HistoryIcon, AlertTriangleIcon, FileTextIcon } from '../shared/CustomIcons';
import { Appointment } from '../../types';
import { StatusBadge } from '../shared/status-badge';
import { useTranslation } from 'react-i18next';

interface TodayAppointmentsProps {
  appointments: Appointment[];
  onViewAppointment: (appointment: Appointment) => void;
  onShowHistory: () => void;
  onShowDocumentSearch?: () => void;
  isDarkMode: boolean;
  /** show filter button and controls (secretary only) */
  showFilter?: boolean;
  isBalneario?: boolean;
}

export function TodayAppointments({ appointments, onViewAppointment, onShowHistory, onShowDocumentSearch, isDarkMode, showFilter = false, isBalneario = false }: TodayAppointmentsProps) {
  const { t } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayAppointments = appointments
    .filter(apt => {
      const aptDate = new Date(apt.date);
      aptDate.setHours(0, 0, 0, 0);
      // Apenas marcações de hoje que estão: Agendado, Em Curso ou Aviso
      return aptDate.getTime() === today.getTime() &&
        (apt.status === 'scheduled' || apt.status === 'in-progress' || apt.status === 'warning');
    })
    .sort((a, b) => {
      const [aHour, aMin] = a.time.split(':').map(Number);
      const [bHour, bMin] = b.time.split(':').map(Number);
      return aHour * 60 + aMin - (bHour * 60 + bMin);
    });

  const handleExport = () => {
    toast.success(t('todayAppointments.exportSuccess'));
  };

  const headerTextClass = isDarkMode ? 'text-gray-100' : 'text-gray-900';

  // Filter state (used when showFilter === true)
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | Appointment['status']>('all');
  const [subjectFilter, setSubjectFilter] = useState<'all' | string>('all');

  // Popover open state and temporary controls so filters are applied only after confirmation
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [tempSearch, setTempSearch] = useState('');
  const [tempStatus, setTempStatus] = useState<'all' | Appointment['status']>('all');
  const [tempSubject, setTempSubject] = useState<'all' | string>('all');

  useEffect(() => {
    if (popoverOpen) {
      // initialize temporary controls from active filters when opening
      setTempSearch(searchTerm);
      setTempStatus(statusFilter);
      setTempSubject(subjectFilter);
    }
  }, [popoverOpen]);

  // Use shared SUBJECTS list (source of truth)
  const uniqueSubjects = SUBJECTS;

  const filteredTodayAppointments = todayAppointments.filter(apt => {
    // Map the special filter value for the warning state correctly
    const statusMatch =
      statusFilter === 'all' ||
      (statusFilter === 'warning' && apt.status === 'warning') ||
      apt.status === statusFilter;
    const subjectMatch = subjectFilter === 'all' || apt.subject === subjectFilter;
    const searchLower = searchTerm.trim().toLowerCase();
    const searchMatch =
      searchLower === '' ||
      apt.subject.toLowerCase().includes(searchLower) ||
      apt.patientName.toLowerCase().includes(searchLower) ||
      apt.patientNIF.includes(searchLower) ||
      apt.time.includes(searchLower);

    return statusMatch && subjectMatch && searchMatch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Header - Title top, buttons below right */}
      <div className="flex flex-col mb-4 gap-2">
        <h2 className={`text-2xl font-bold ml-1 ${headerTextClass}`}>{t(isBalneario ? 'todayAppointments.titleBalneario' : 'todayAppointments.titleSecretary')}</h2>
        <div className="flex items-center gap-2 self-end">
          {showFilter && (
            <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 h-8 text-xs shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
                  {t('todayAppointments.filter')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-3">
                <div className="flex flex-col gap-2">
                  <Input
                    placeholder={t('history.filters.searchPlaceholder')}
                    value={tempSearch}
                    onChange={(e) => setTempSearch(e.target.value)}
                    className="text-sm"
                  />

                  <Select value={tempStatus} onValueChange={(v: Appointment['status'] | 'all') => setTempStatus(v)}>
                    <SelectTrigger className="w-full text-sm">
                      <SelectValue placeholder={t('history.filters.allStatuses')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t('history.filters.allStatuses')}</SelectItem>
                      <SelectItem value="in-progress">{t('statusBadge.inProgress')}</SelectItem>
                      <SelectItem value="scheduled">{t('statusBadge.scheduled')}</SelectItem>
                      <SelectItem value="warning">
                        <div className="flex items-center gap-2">
                          <AlertTriangleIcon className="w-3 h-3 text-yellow-500" />
                          <span>{t('statusBadge.warning')}</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {!isBalneario && (
                    <Select value={tempSubject} onValueChange={(v: string | 'all') => setTempSubject(v)}>
                      <SelectTrigger className="w-full text-sm">
                        <SelectValue placeholder={t('history.filters.allSubjects')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('history.filters.allSubjects')}</SelectItem>
                        {uniqueSubjects.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  <div className="flex gap-2 mt-2">
                    <Button
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => {
                        // apply temporary filters to active filters
                        setSearchTerm(tempSearch);
                        setStatusFilter(tempStatus);
                        setSubjectFilter(tempSubject);
                        setPopoverOpen(false);
                      }}
                    >
                      {t('todayAppointments.applyFilters')}
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        // clear both temporary and active filters
                        setTempSearch('');
                        setTempStatus('all');
                        setTempSubject('all');
                        setSearchTerm('');
                        setStatusFilter('all');
                        setSubjectFilter('all');
                      }}
                    >
                      {t('todayAppointments.clearFilters')}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}

          <Button variant="outline" size="sm" onClick={onShowHistory} className="gap-2 h-8 text-xs shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800">
            <HistoryIcon className="w-3.5 h-3.5" />
            {t('sidebar.history')}
          </Button>

          {onShowDocumentSearch && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShowDocumentSearch}
              className="gap-2 h-8 text-xs shrink-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <FileTextIcon className="w-3.5 h-3.5" />
              {t('documents.title')}
            </Button>
          )}
        </div>
      </div>

      {/* Transparent container for floating cards list */}
      <div className="flex-1 h-[650px] relative overflow-hidden flex flex-col">
        {/* Appointments List - Container com scroll */}
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-purple-400 scrollbar-track-gray-200 dark:scrollbar-thumb-purple-600 dark:scrollbar-track-gray-800">
          <div className="space-y-3">
            {filteredTodayAppointments.length === 0 ? (
              <div className={`rounded-lg p-8 text-center border-dashed border-2 ${isDarkMode
                ? 'border-gray-700 bg-gray-800/50'
                : 'border-gray-200 bg-gray-50/50'
                }`}>
                <ClockIcon className="w-12 h-12 mx-auto mb-2 text-gray-400 dark:text-gray-600 opacity-50" />
                <p className="text-sm text-gray-500 dark:text-gray-500">{t(isBalneario ? 'todayAppointments.emptyBalneario' : 'todayAppointments.emptySecretary')}</p>
              </div>
            ) : (
              filteredTodayAppointments.map((apt) => (
                <div
                  key={apt.id}
                  className={`rounded-xl p-4 cursor-pointer transition-all duration-200 border ${isDarkMode
                    ? 'bg-gray-900/95 border-gray-800 hover:bg-gray-900 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/10'
                    : 'bg-white/95 border-gray-100 hover:bg-white hover:border-purple-200 hover:shadow-md'
                    }`}
                  onClick={() => onViewAppointment(apt)}
                >
                  <div className="flex items-start justify-between">
                    <span className="font-medium text-gray-900 dark:text-gray-100 text-lg">
                      {apt.time}
                    </span>
                    <StatusBadge status={apt.status} />
                  </div>

                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">{apt.patientName}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{apt.subject}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Export Button */}
      {filteredTodayAppointments.length > 0 && (
        <Button variant="outline" className="w-full gap-2 h-9 text-sm mt-4 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800" onClick={handleExport}>
          <DownloadIcon className="w-4 h-4" />
          {t('todayAppointments.exportAction')}
        </Button>
      )}
    </div>
  );
}
