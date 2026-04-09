import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Pencil, Plus, Search } from 'lucide-react';
import { marcacoesApi, type Assunto } from '../../../services/api';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { TrashIcon } from '../../shared/CustomIcons';
import { CatalogSection } from './CatalogSection';
import { cn } from '../../ui/utils';

export function SubjectManagement() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [assuntos, setAssuntos] = useState<Assunto[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    
    // New Subject State
    const [novoNome, setNovoNome] = useState('');
    const [novaDescricao, setNovaDescricao] = useState('');
    const [isAddFormOpen, setIsAddFormOpen] = useState(true);

    // Edit State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editNome, setEditNome] = useState('');
    const [editDescricao, setEditDescricao] = useState('');

    const loadAssuntos = async () => {
        try {
            setLoading(true);
            const res = await marcacoesApi.listarAssuntosAdmin();
            setAssuntos(Array.isArray(res) ? res : []);
        } catch (error) {
            toast.error('Erro ao carregar assuntos');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssuntos();
    }, []);

    const handleCreate = async () => {
        if (!novoNome.trim()) {
            toast.error('O nome do assunto é obrigatório');
            return;
        }

        try {
            setSaving(true);
            await marcacoesApi.criarAssunto({
                nome: novoNome.trim(),
                descricao: novaDescricao.trim(),
                ativo: true
            });

            setNovoNome('');
            setNovaDescricao('');
            await loadAssuntos();
            toast.success('Assunto criado com sucesso');
        } catch (error) {
            toast.error('Erro ao criar assunto');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (id: number) => {
        if (!editNome.trim()) {
            toast.error('O nome do assunto é obrigatório');
            return;
        }

        try {
            const currentItem = assuntos.find(a => a.id === id);
            await marcacoesApi.atualizarAssunto(id, {
                nome: editNome.trim(),
                descricao: editDescricao.trim(),
                ativo: currentItem?.ativo ?? true
            });
            setEditingId(null);
            await loadAssuntos();
            toast.success('Assunto atualizado');
        } catch (error) {
            toast.error('Erro ao atualizar assunto');
        }
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Tem a certeza que deseja desativar este assunto?')) return;
        try {
            await marcacoesApi.apagarAssunto(id);
            await loadAssuntos();
            toast.success('Assunto desativado');
        } catch (error) {
            toast.error('Erro ao desativar assunto');
        }
    };

    const filteredAssuntos = assuntos.filter(a => 
        a.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (a.descricao && a.descricao.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading && assuntos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse">A carregar assuntos...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Pesquisar assuntos..." 
                        className="pl-10 bg-background/50 backdrop-blur-sm border-border/40 focus:ring-primary/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="flex flex-col gap-8">
                {/* Add Section */}
                <CatalogSection
                    title="Novo Assunto de Marcação"
                    isOpen={isAddFormOpen}
                    onToggle={() => setIsAddFormOpen(!isAddFormOpen)}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground ml-1">Nome do Assunto</label>
                            <Input 
                                className="h-11 rounded-xl" 
                                placeholder="Ex: Pagar mensalidade" 
                                value={novoNome} 
                                onChange={(e) => setNovoNome(e.target.value)} 
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-muted-foreground ml-1">Descrição (opcional)</label>
                            <Input 
                                className="h-11 rounded-xl" 
                                placeholder="Pequena descrição informativa" 
                                value={novaDescricao} 
                                onChange={(e) => setNovaDescricao(e.target.value)} 
                            />
                        </div>

                        <div>
                            <Button 
                                onClick={() => void handleCreate()} 
                                disabled={saving} 
                                className="h-11 px-8 bg-primary rounded-xl shadow-lg shadow-primary/20 gap-2 w-full lg:w-auto"
                            >
                                {saving ? 'A guardar...' : <><Plus className="w-5 h-5" /> Adicionar Assunto</>}
                            </Button>
                        </div>
                    </div>
                </CatalogSection>

                {/* List Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-4 px-2">
                        <h4 className="font-bold text-muted-foreground uppercase tracking-widest text-xs">Assuntos Geridos</h4>
                        <div className="h-px flex-1 bg-border/40" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredAssuntos.map(assunto => (
                            <div 
                                key={assunto.id} 
                                className={cn(
                                    "group/item relative p-5 rounded-2xl border transition-all duration-300",
                                    !assunto.ativo && "grayscale opacity-60",
                                    editingId === assunto.id 
                                        ? "bg-primary/5 border-primary shadow-inner" 
                                        : "bg-background/40 border-border/40 hover:border-primary/40 hover:bg-muted/30"
                                )}
                            >
                                {editingId === assunto.id ? (
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Nome</label>
                                            <Input 
                                                value={editNome} 
                                                onChange={(e) => setEditNome(e.target.value)} 
                                                className="h-10 bg-background" 
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Descrição</label>
                                            <Input 
                                                value={editDescricao} 
                                                onChange={(e) => setEditDescricao(e.target.value)} 
                                                className="h-10 bg-background" 
                                            />
                                        </div>
                                        <div className="flex gap-2 justify-end pt-2">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancelar</Button>
                                            <Button size="sm" onClick={() => void handleUpdate(assunto.id)}>Guardar</Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-start justify-between">
                                        <div className="space-y-1 pr-10">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-base text-foreground block">{assunto.nome}</span>
                                                {!assunto.ativo && <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full font-black text-muted-foreground uppercase">Inativo</span>}
                                            </div>
                                            {assunto.descricao && (
                                                <p className="text-sm text-muted-foreground line-clamp-2">{assunto.descricao}</p>
                                            )}
                                        </div>
                                        
                                        <div className="flex gap-1 absolute top-4 right-4 opacity-0 group-hover/item:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm p-1 rounded-xl border border-border/40 shadow-sm">
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary" 
                                                onClick={() => {
                                                    setEditingId(assunto.id);
                                                    setEditNome(assunto.nome);
                                                    setEditDescricao(assunto.descricao || '');
                                                }}
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                                size="icon" 
                                                variant="ghost" 
                                                className="h-8 w-8 rounded-lg hover:bg-destructive/10 hover:text-destructive" 
                                                onClick={() => void handleDelete(assunto.id)}
                                            >
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {filteredAssuntos.length === 0 && (
                        <div className="text-center py-20 border-2 border-dashed border-border/40 rounded-3xl bg-muted/5">
                            <p className="text-muted-foreground font-medium">Nenhum assunto encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
