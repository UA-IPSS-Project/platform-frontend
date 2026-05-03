import { useState, useEffect, useCallback } from 'react';
import { auditApi, AuditLogDTO, AuditLogFilters } from '../services/api/audit/auditApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  ChevronLeft, ChevronRight, Search, RefreshCw,
  LogIn, LogOut, UserPlus, FileUp, FileDown, Eye,
  Trash2, ShieldCheck, User, FileText, Server,
  AlertTriangle, Activity, Filter, X, Clock, FilePlus,
  Truck, Package, ClipboardList, Wrench
} from 'lucide-react';
import { toast } from 'sonner';

// ─── action metadata ────────────────────────────────────────────────────────

interface ActionMeta {
  icon: React.ElementType;
  label: string;
  color: string;        // bg + text (for badge)
  dot: string;          // dot indicator colour
}

const ACTION_META: Record<string, ActionMeta> = {
  LOGIN_FUNCIONARIO:    { icon: LogIn,      label: 'Login Funcionário',   color: 'bg-blue-500/15 text-blue-400',    dot: 'bg-blue-400' },
  LOGIN_UTENTE:         { icon: LogIn,      label: 'Login Utente',        color: 'bg-blue-500/15 text-blue-400',    dot: 'bg-blue-400' },
  LOGOUT:               { icon: LogOut,     label: 'Logout',              color: 'bg-slate-500/15 text-slate-400',  dot: 'bg-slate-400' },
  REGISTO_UTENTE:       { icon: UserPlus,   label: 'Registo Utente',      color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  REGISTO_FUNCIONARIO:  { icon: UserPlus,   label: 'Registo Funcionário', color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  CRIAR_CONTA:          { icon: UserPlus,   label: 'Criar Conta',         color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  CRIAR_CONTA_SECRETARIA: { icon: UserPlus,  label: 'Conta p/ Secretaria', color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  UPLOAD_DOCUMENTO:     { icon: FileUp,     label: 'Upload Documento',    color: 'bg-violet-500/15 text-violet-400', dot: 'bg-violet-400' },
  DOWNLOAD_DOCUMENTO:   { icon: FileDown,   label: 'Download Documento',  color: 'bg-indigo-500/15 text-indigo-400', dot: 'bg-indigo-400' },
  PREVIEW_DOCUMENTO:    { icon: Eye,        label: 'Preview Documento',   color: 'bg-cyan-500/15 text-cyan-400',    dot: 'bg-cyan-400' },
  DELETE_DOCUMENTO:     { icon: Trash2,     label: 'Apagar Documento',    color: 'bg-red-500/15 text-red-400',      dot: 'bg-red-400' },
  APROVAR_FUNCIONARIO:  { icon: ShieldCheck,label: 'Aprovar Funcionário', color: 'bg-amber-500/15 text-amber-400',  dot: 'bg-amber-400' },
  ATUALIZAR_PERFIL:     { icon: User,       label: 'Atualizar Perfil',    color: 'bg-sky-500/15 text-sky-400',      dot: 'bg-sky-400' },
  RECUPERAR_CONTA:      { icon: RefreshCw,  label: 'Recuperar Conta',     color: 'bg-orange-500/15 text-orange-400', dot: 'bg-orange-400' },
  SOLICITAR_ELIMINACAO: { icon: Trash2,     label: 'Pedido Eliminação',   color: 'bg-red-500/15 text-red-400',      dot: 'bg-red-400' },
  ANONIMIZAR_UTILIZADOR:{ icon: AlertTriangle,label:'Anonimizar',         color: 'bg-orange-500/15 text-orange-400',dot: 'bg-orange-400' },
  CRIAR_MARCACAO_PRESENCIAL:{ icon: FileText,label:'Criar Marcação',      color: 'bg-teal-500/15 text-teal-400',    dot: 'bg-teal-400' },
  CRIAR_MARCACAO_BALNEARIO:{ icon: Activity,  label:'Marcação Balneário',   color: 'bg-blue-400/15 text-blue-300',    dot: 'bg-blue-300' },
  ATUALIZAR_DETALHES_BALNEARIO:{ icon: FileText,label:'Detalhes Balneário', color: 'bg-blue-400/15 text-blue-300',    dot: 'bg-blue-300' },
  ATUALIZAR_ESTADO_MARCACAO:{ icon: Activity, label:'Alterar Estado',     color: 'bg-slate-400/15 text-slate-300',  dot: 'bg-slate-300' },
  REAGENDAR_MARCACAO:   { icon: Clock,      label:'Reagendar',            color: 'bg-sky-400/15 text-sky-300',      dot: 'bg-sky-300' },
  CRIAR_ITEM_ARMAZEM:   { icon: Package,    label:'Novo Item Armazém',    color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  ATUALIZAR_ITEM_ARMAZEM:{ icon: RefreshCw,  label:'Atualizar Armazém',    color: 'bg-amber-500/15 text-amber-400',  dot: 'bg-amber-400' },
  ELIMINAR_ITEM_ARMAZEM:{ icon: Trash2,     label:'Eliminar do Armazém',  color: 'bg-red-500/15 text-red-400',      dot: 'bg-red-400' },
  CRIAR_MATERIAL_CATALOGO:{ icon: Package,   label:'Novo Mat. Catálogo',   color: 'bg-violet-500/15 text-violet-400', dot: 'bg-violet-400' },
  ATUALIZAR_MATERIAL_CATALOGO:{ icon: RefreshCw, label:'Atu. Mat. Catálogo',color: 'bg-violet-500/15 text-violet-400', dot: 'bg-violet-400' },
  APAGAR_MATERIAL_CATALOGO:{ icon: Trash2,   label:'Del. Mat. Catálogo',   color: 'bg-red-500/15 text-red-400',      dot: 'bg-red-400' },
  CRIAR_TRANSPORTE_CATALOGO:{ icon: Truck,     label:'Novo Veículo',         color: 'bg-indigo-500/15 text-indigo-400', dot: 'bg-indigo-400' },
  ATUALIZAR_TRANSPORTE_CATALOGO:{ icon: RefreshCw, label:'Atu. Veículo',     color: 'bg-indigo-500/15 text-indigo-400', dot: 'bg-indigo-400' },
  MOVER_CATEGORIA_TRANSPORTE:{ icon: Activity,label:'Mover Categoria',     color: 'bg-slate-500/15 text-slate-400',  dot: 'bg-slate-400' },
  CRIAR_TIPO_MANUTENCAO:{ icon: Wrench,     label:'Novo Tipo Manut.',     color: 'bg-cyan-500/15 text-cyan-400',    dot: 'bg-cyan-400' },
  ATUALIZAR_TIPO_MANUTENCAO:{ icon: RefreshCw,label:'Atu. Tipo Manut.',     color: 'bg-cyan-500/15 text-cyan-400',    dot: 'bg-cyan-400' },
  APAGAR_TIPO_MANUTENCAO:{ icon: Trash2,     label:'Del. Tipo Manut.',     color: 'bg-red-500/15 text-red-400',      dot: 'bg-red-400' },
  CRIAR_REQUISICAO_MATERIAL:{ icon: ClipboardList, label:'Req. Material',  color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  CRIAR_REQUISICAO_TRANSPORTE:{ icon: Truck, label:'Req. Transporte',      color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  CRIAR_REQUISICAO_MANUTENCAO:{ icon: Wrench, label:'Req. Manutenção',      color: 'bg-emerald-500/15 text-emerald-400', dot: 'bg-emerald-400' },
  CRIAR_ITEM_MANUTENCAO_CATALOGO:{ icon: FilePlus, label:'Novo Item Manut.', color: 'bg-cyan-500/15 text-cyan-400',    dot: 'bg-cyan-400' },
  ATUALIZAR_ITEM_MANUTENCAO_CATALOGO:{ icon: RefreshCw, label:'Atu. Item Manut.',color: 'bg-cyan-500/15 text-cyan-400', dot: 'bg-cyan-400' },
  APAGAR_ITEM_MANUTENCAO_CATALOGO:{ icon: Trash2, label:'Del. Item Manut.', color: 'bg-red-500/15 text-red-400',      dot: 'bg-red-400' },
  ATUALIZAR_ESTADO_REQUISICAO:{ icon: Activity, label:'Atu. Est. Requisição',color: 'bg-slate-500/15 text-slate-400',  dot: 'bg-slate-400' },
};

function getMeta(action: string): ActionMeta {
  return ACTION_META[action] ?? {
    icon: Activity,
    label: action,
    color: 'bg-muted text-muted-foreground',
    dot: 'bg-muted-foreground',
  };
}

// ─── entity type pill ────────────────────────────────────────────────────────

const ENTITY_ICON: Record<string, React.ElementType> = {
  UTILIZADOR: User,
  FUNCIONARIO: User,
  DOCUMENTO: FileText,
  MARCACAO: FileText,
  AUTH: ShieldCheck,
};

function EntityPill({ type, id }: { type: string | null; id: number | null }) {
  if (!type) return <span className="text-muted-foreground/40">—</span>;
  const Icon = ENTITY_ICON[type] ?? Server;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs bg-muted/60 text-muted-foreground border border-border/50">
      <Icon className="w-3 h-3" />
      {type}{id ? ` #${id}` : ''}
    </span>
  );
}

// ─── action badge ─────────────────────────────────────────────────────────────

function ActionBadge({ action }: { action: string }) {
  const meta = getMeta(action);
  const Icon = meta.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.color}`}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      {meta.label}
    </span>
  );
}

// ─── stats card ──────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}

// ─── main page ────────────────────────────────────────────────────────────────

export function AuditPage() {
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const [filters, setFilters] = useState<AuditLogFilters>({ page: 0, size: 25 });
  const [pendingFilters, setPendingFilters] = useState<AuditLogFilters>({ page: 0, size: 25 });

  const fetchLogs = useCallback(async (page = currentPage, f = filters) => {
    setLoading(true);
    try {
      const response = await auditApi.getLogs({ ...f, page });
      setLogs(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
      toast.error('Erro ao carregar logs de auditoria');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => { fetchLogs(currentPage, filters); }, [currentPage]);

  const handleSearch = () => {
    setFilters(pendingFilters);
    setCurrentPage(0);
    fetchLogs(0, pendingFilters);
  };

  const handleClearFilters = () => {
    const fresh = { page: 0, size: 25 };
    setPendingFilters(fresh);
    setFilters(fresh);
    setCurrentPage(0);
    fetchLogs(0, fresh);
  };

  const hasActiveFilters = !!(filters.action || filters.entityType || filters.startDate || filters.endDate);

  // Compute simple stats from current page
  const authCount  = logs.filter(l => l.action.includes('LOGIN') || l.action.includes('LOGOUT') || l.action.includes('REGISTO')).length;
  const docCount   = logs.filter(l => l.action.includes('DOCUMENTO')).length;
  const adminCount = logs.filter(l => l.action.includes('APROVAR') || l.action.includes('ANONIMIZAR')).length;

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return {
      date: d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: d.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    };
  };

  const ALL_ACTIONS = Object.keys(ACTION_META);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Auditoria do Sistema</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Registo de todas as ações críticas — logins, registos, logouts e operações de dados
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(v => !v)}
              className={hasActiveFilters ? 'border-primary text-primary' : ''}
            >
              <Filter className="w-4 h-4 mr-1.5" />
              Filtros
              {hasActiveFilters && (
                <span className="ml-1.5 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">
                  !
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(currentPage, filters)}
              disabled={loading}
            >
              <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total (página)" value={logs.length} icon={Activity} color="bg-primary/10 text-primary" />
          <StatCard label="Autenticações" value={authCount} icon={LogIn} color="bg-blue-500/10 text-blue-400" />
          <StatCard label="Documentos" value={docCount} icon={FileText} color="bg-violet-500/10 text-violet-400" />
          <StatCard label="Ações Admin" value={adminCount} icon={ShieldCheck} color="bg-amber-500/10 text-amber-400" />
        </div>

        {/* ── Filter Panel ── */}
        {showFilters && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-4 animate-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-sm font-semibold text-foreground">Filtros de pesquisa</h2>
              {hasActiveFilters && (
                <button
                  onClick={handleClearFilters}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Limpar filtros
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Ação</label>
                <Select
                  value={pendingFilters.action || 'all'}
                  onValueChange={(v) => setPendingFilters(f => ({ ...f, action: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger className="bg-background border-border text-foreground h-9 text-sm">
                    <SelectValue placeholder="Todas as ações" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Todas as ações</SelectItem>
                    {ALL_ACTIONS.map(a => (
                      <SelectItem key={a} value={a} className="text-popover-foreground">
                        {ACTION_META[a].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entidade</label>
                <Select
                  value={pendingFilters.entityType || 'all'}
                  onValueChange={(v) => setPendingFilters(f => ({ ...f, entityType: v === 'all' ? undefined : v }))}
                >
                  <SelectTrigger className="bg-background border-border text-foreground h-9 text-sm">
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="UTILIZADOR">Utilizador</SelectItem>
                    <SelectItem value="FUNCIONARIO">Funcionário</SelectItem>
                    <SelectItem value="DOCUMENTO">Documento</SelectItem>
                    <SelectItem value="MARCACAO">Marcação</SelectItem>
                    <SelectItem value="AUTH">Auth</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data início</label>
                <Input
                  type="datetime-local"
                  value={pendingFilters.startDate || ''}
                  onChange={(e) => setPendingFilters(f => ({ ...f, startDate: e.target.value || undefined }))}
                  className="bg-background border-border text-foreground h-9 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data fim</label>
                <Input
                  type="datetime-local"
                  value={pendingFilters.endDate || ''}
                  onChange={(e) => setPendingFilters(f => ({ ...f, endDate: e.target.value || undefined }))}
                  className="bg-background border-border text-foreground h-9 text-sm"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button onClick={handleSearch} size="sm" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Search className="w-3.5 h-3.5 mr-1.5" />
                Pesquisar
              </Button>
            </div>
          </div>
        )}

        {/* ── Log Table ── */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">

          {/* Table header info */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-muted/30">
            <span className="text-xs text-muted-foreground">
              {loading ? 'A carregar…' : `${totalElements} registos no total · página ${currentPage + 1} de ${Math.max(1, totalPages)}`}
            </span>
            <Select
              value={String(pendingFilters.size || 25)}
              onValueChange={(v) => {
                const updated = { ...pendingFilters, size: Number(v) };
                setPendingFilters(updated);
                setFilters(updated);
                setCurrentPage(0);
                fetchLogs(0, updated);
              }}
            >
              <SelectTrigger className="h-7 w-28 text-xs bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border text-xs">
                <SelectItem value="10">10 / página</SelectItem>
                <SelectItem value="25">25 / página</SelectItem>
                <SelectItem value="50">50 / página</SelectItem>
                <SelectItem value="100">100 / página</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <RefreshCw className="w-8 h-8 animate-spin opacity-40" />
              <p className="text-sm">A carregar registos…</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
              <Activity className="w-10 h-10 opacity-20" />
              <p className="text-sm font-medium">Nenhum registo encontrado</p>
              {hasActiveFilters && (
                <button onClick={handleClearFilters} className="text-xs text-primary hover:underline">
                  Limpar filtros
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {logs.map((log) => {
                const { date, time } = formatDate(log.timestamp);
                const meta = getMeta(log.action);
                const Icon = meta.icon;
                const isExpanded = expandedId === log.id;

                return (
                  <div
                    key={log.id}
                    className="group hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-center gap-4 px-5 py-3.5">
                      {/* Colour dot */}
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />

                      {/* Action badge + entity */}
                      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2 ml-2">
                        <ActionBadge action={log.action} />
                        <EntityPill type={log.entityType} id={log.entityId} />
                      </div>

                      {/* User */}
                      <div className="hidden md:flex items-center gap-1.5 min-w-[130px]">
                        <User className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm text-foreground truncate max-w-[120px]" title={log.userName}>
                          {log.userName || '—'}
                        </span>
                      </div>

                      {/* Timestamp */}
                      <div className="hidden lg:flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{date}</span>
                        <span className="opacity-60">{time}</span>
                      </div>

                      {/* IP */}
                      <div className="hidden xl:block text-xs text-muted-foreground/60 font-mono w-28 text-right truncate">
                        {log.ipAddress || '—'}
                      </div>

                      {/* Expand caret */}
                      <ChevronRight className={`w-4 h-4 text-muted-foreground/40 flex-shrink-0 transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>

                    {/* Expanded detail row */}
                    {isExpanded && (
                      <div className="px-5 pb-4 ml-14 space-y-2 animate-in slide-in-from-top-1 duration-150">
                        {/* Mobile fields */}
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground md:hidden">
                          <span><strong>Utilizador:</strong> {log.userName || '—'}</span>
                          <span><strong>ID:</strong> {log.userId ?? '—'}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground lg:hidden">
                          <span><strong>Data:</strong> {date} {time}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground xl:hidden">
                          <span><strong>IP:</strong> {log.ipAddress || '—'}</span>
                        </div>

                        {/* Details */}
                        {log.details && (
                          <div className="bg-muted/40 border border-border/50 rounded-lg px-3 py-2">
                            <p className="text-xs text-foreground/80 font-mono leading-relaxed">{log.details}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3.5 border-t border-border bg-muted/20">
              <p className="text-xs text-muted-foreground">
                Página {currentPage + 1} de {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage === 0 || loading}
                  onClick={() => setCurrentPage(0)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage === 0 || loading}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>

                {/* Page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const start = Math.max(0, Math.min(currentPage - 2, totalPages - 5));
                  const p = start + i;
                  return (
                    <Button
                      key={p}
                      variant={p === currentPage ? 'default' : 'outline'}
                      size="sm"
                      className="h-8 w-8 p-0 text-xs"
                      disabled={loading}
                      onClick={() => setCurrentPage(p)}
                    >
                      {p + 1}
                    </Button>
                  );
                })}

                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage >= totalPages - 1 || loading}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage >= totalPages - 1 || loading}
                  onClick={() => setCurrentPage(totalPages - 1)}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
