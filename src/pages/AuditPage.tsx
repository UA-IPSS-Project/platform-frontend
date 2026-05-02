import { useState, useEffect } from 'react';
import { auditApi, AuditLogDTO, AuditLogFilters } from '../services/api/audit/auditApi';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { GlassCard } from '../components/ui/glass-card';
import { ChevronLeft, ChevronRight, Search, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function AuditPage() {
    const [logs, setLogs] = useState<AuditLogDTO[]>([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(0);
    const [filters, setFilters] = useState<AuditLogFilters>({
        page: 0,
        size: 50,
    });

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const response = await auditApi.getLogs({ ...filters, page: currentPage });
            setLogs(response.content);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error('Erro ao carregar logs:', error);
            toast.error('Erro ao carregar logs de auditoria');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [currentPage]);

    const handleSearch = () => {
        setCurrentPage(0);
        fetchLogs();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('pt-PT', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getActionColor = (action: string) => {
        if (action.includes('CRIAR') || action.includes('UPLOAD')) return 'text-green-600 bg-green-100';
        if (action.includes('DELETE') || action.includes('ANONIMIZAR')) return 'text-red-600 bg-red-100';
        if (action.includes('ATUALIZAR') || action.includes('APROVAR')) return 'text-blue-600 bg-blue-100';
        if (action.includes('DOWNLOAD') || action.includes('PREVIEW')) return 'text-purple-600 bg-purple-100';
        return 'text-gray-600 bg-gray-100';
    };

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Auditoria</h1>
                    <p className="text-muted-foreground">Registo de todas as ações críticas do sistema</p>
                </div>
                <Button onClick={fetchLogs} variant="outline" disabled={loading}>
                    <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Atualizar
                </Button>
            </div>

            <GlassCard className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Ação</label>
                        <Select
                            value={filters.action || ''}
                            onValueChange={(value) => setFilters({ ...filters, action: value || undefined })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todas</SelectItem>
                                <SelectItem value="CRIAR_CONTA">Criar Conta</SelectItem>
                                <SelectItem value="APROVAR_FUNCIONARIO">Aprovar Funcionário</SelectItem>
                                <SelectItem value="ATUALIZAR_PERFIL">Atualizar Perfil</SelectItem>
                                <SelectItem value="ANONIMIZAR_UTILIZADOR">Anonimizar</SelectItem>
                                <SelectItem value="UPLOAD_DOCUMENTO">Upload Documento</SelectItem>
                                <SelectItem value="DOWNLOAD_DOCUMENTO">Download Documento</SelectItem>
                                <SelectItem value="PREVIEW_DOCUMENTO">Preview Documento</SelectItem>
                                <SelectItem value="DELETE_DOCUMENTO">Delete Documento</SelectItem>
                                <SelectItem value="CRIAR_MARCACAO_PRESENCIAL">Criar Marcação</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Tipo de Entidade</label>
                        <Select
                            value={filters.entityType || ''}
                            onValueChange={(value) => setFilters({ ...filters, entityType: value || undefined })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todas" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todas</SelectItem>
                                <SelectItem value="UTILIZADOR">Utilizador</SelectItem>
                                <SelectItem value="FUNCIONARIO">Funcionário</SelectItem>
                                <SelectItem value="DOCUMENTO">Documento</SelectItem>
                                <SelectItem value="MARCACAO">Marcação</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Data Início</label>
                        <Input
                            type="datetime-local"
                            value={filters.startDate || ''}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium mb-2 block">Data Fim</label>
                        <Input
                            type="datetime-local"
                            value={filters.endDate || ''}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                        />
                    </div>
                </div>

                <Button onClick={handleSearch} className="w-full md:w-auto">
                    <Search className="w-4 h-4 mr-2" />
                    Pesquisar
                </Button>
            </GlassCard>

            <GlassCard className="p-6">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="text-sm font-bold text-muted-foreground border-b">
                            <tr>
                                <th className="text-left pb-4 pl-4">Data/Hora</th>
                                <th className="text-left pb-4">Utilizador</th>
                                <th className="text-left pb-4">Ação</th>
                                <th className="text-left pb-4">Entidade</th>
                                <th className="text-left pb-4">Detalhes</th>
                                <th className="text-left pb-4 pr-4">IP</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-muted-foreground">
                                        A carregar...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-muted-foreground">
                                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        Nenhum registo encontrado
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="border-b border-border/20 hover:bg-muted/30">
                                        <td className="py-4 pl-4 font-medium">{formatDate(log.timestamp)}</td>
                                        <td className="py-4">{log.userName}</td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="py-4">
                                            {log.entityType && (
                                                <span className="text-xs bg-muted px-2 py-1 rounded">
                                                    {log.entityType} #{log.entityId}
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-4 max-w-md truncate">{log.details}</td>
                                        <td className="py-4 pr-4 text-xs text-muted-foreground">{log.ipAddress}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-6 pt-6 border-t">
                        <p className="text-sm text-muted-foreground">
                            Página {currentPage + 1} de {totalPages}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 0}
                                onClick={() => setCurrentPage((p) => p - 1)}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage >= totalPages - 1}
                                onClick={() => setCurrentPage((p) => p + 1)}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </GlassCard>
        </div>
    );
}
