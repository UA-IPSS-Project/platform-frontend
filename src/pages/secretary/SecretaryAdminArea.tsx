import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDays, Package, Truck, Wrench, Settings2, Save, FileText, ScrollText, Languages, Eye, Edit3 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { GlassCard } from '../../components/ui/glass-card';
import { RequisitionsCatalogManagement } from '../../components/admin/RequisitionsCatalogManagement';
import { SubjectManagement } from '../../components/admin/catalog/SubjectManagement';
import { calendarioApi, requisicoesApi, marcacoesApi, type ManutencaoItem } from '../../services/api';
import { apiRequest } from '../../services/api/core/client';
import { utilizadoresApi } from '../../services/api/utilizadores/utilizadoresApi';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';


function SlotsManagement({
    isLoadingSlots,
    isSavingSlots,
    slotCapacities,
    savedCapacities,
    onChange,
    onSave,
    t,
}: Readonly<{
    isLoadingSlots: boolean;
    isSavingSlots: boolean;
    slotCapacities: { SECRETARIA: number };
    savedCapacities: { SECRETARIA: number };
    onChange: (tipo: 'SECRETARIA', value: string) => void;
    onSave: () => void;
    t: (k: string) => string;
}>) {
    return (
        <GlassCard className="p-6">
            <div className="flex flex-col gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Settings2 className="w-4 h-4" />
                        {t('dashboard.admin.slots.operationalConfiguration')}
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">{t('dashboard.admin.slots.title')}</h2>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        {t('dashboard.admin.slots.description')}
                    </p>
                </div>

                {/* Single slot — horizontal card with prominent value display */}
                <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-stretch">
                        {/* Left: icon + title + description */}
                        <div className="flex items-center gap-4 p-6 sm:flex-1">
                            <div className="flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                                <CalendarDays className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-foreground">{t('dashboard.admin.slots.secretaryScheduleTitle')}</h3>
                                <p className="text-sm text-muted-foreground mt-0.5">{t('dashboard.admin.slots.secretaryScheduleDescription')}</p>
                            </div>
                        </div>

                        {/* Divider */}
                        <div className="hidden sm:block w-px bg-border my-4" />
                        <div className="block sm:hidden h-px bg-border mx-6" />

                        {/* Right: current value display + input */}
                        <div className="flex items-center gap-6 p-6 sm:w-72">
                            <div className="text-center min-w-[3rem]">
                                <p className="text-5xl font-bold text-primary leading-none">{savedCapacities.SECRETARIA}</p>
                                <p className="text-xs text-muted-foreground mt-1.5">{t('dashboard.admin.slots.current')}</p>
                            </div>
                            <div className="flex-1 space-y-1.5">
                                <Label htmlFor="slot-SECRETARIA" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    {t('dashboard.admin.slots.maxPerSlot')}
                                </Label>
                                <Input
                                    id="slot-SECRETARIA"
                                    type="number"
                                    min={1}
                                    max={20}
                                    value={slotCapacities.SECRETARIA}
                                    onChange={(event) => onChange('SECRETARIA', event.target.value)}
                                    className="bg-background text-center text-lg font-semibold"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={isSavingSlots || isLoadingSlots}
                        className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                        <Save className="w-4 h-4" />
                        {isSavingSlots ? t('dashboard.admin.slots.saving') : t('dashboard.admin.slots.saveConfiguration')}
                    </Button>
                </div>
            </div>
        </GlassCard>
    );
}

interface TermsContentProps {
    pt: string;
    en: string;
    isSaving: boolean;
    onSave: (lang: 'pt' | 'en', content: string) => void;
}

function TermsContentEditor({ pt, en, isSaving, onSave }: Readonly<TermsContentProps>) {
    const [localPt, setLocalPt] = useState(pt);
    const [localEn, setLocalEn] = useState(en);
    const [activeTab, setActiveTab] = useState<'pt' | 'en'>('pt');

    useEffect(() => { setLocalPt(pt); }, [pt]);
    useEffect(() => { setLocalEn(en); }, [en]);

    return (
        <GlassCard className="p-6">
            <div className="flex flex-col gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Languages className="w-4 h-4" />
                        Conteúdo dos Termos (Multilingue)
                    </div>
                    <h2 className="mt-2 text-xl font-semibold text-foreground">Editor de Conteúdo</h2>
                    <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                        Edite o texto integral dos Termos de Uso. Recomendamos o uso de parágrafos claros. O conteúdo será exibido no modal de aceitação.
                    </p>
                </div>

                <Tabs defaultValue="pt" onValueChange={(v) => setActiveTab(v as 'pt' | 'en')}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="pt" className="gap-2">
                            <span className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 flex items-center justify-center text-[10px] font-bold">PT</span>
                            Português
                        </TabsTrigger>
                        <TabsTrigger value="en" className="gap-2">
                            <span className="w-4 h-4 rounded-full overflow-hidden flex-shrink-0 bg-slate-200 flex items-center justify-center text-[10px] font-bold">EN</span>
                            English
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="pt" className="space-y-4 outline-none">
                        <div className="relative group">
                            <div className="absolute top-3 right-3 opacity-20 group-focus-within:opacity-100 transition-opacity">
                                <Edit3 className="w-4 h-4" />
                            </div>
                            <Textarea
                                value={localPt}
                                onChange={(e) => setLocalPt(e.target.value)}
                                placeholder="Insira os termos em Português..."
                                className="min-h-[300px] font-mono text-sm leading-relaxed p-6 bg-slate-50/50 dark:bg-slate-900/50"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={() => onSave('pt', localPt)}
                                disabled={isSaving || localPt === pt}
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'A guardar...' : 'Guardar Português'}
                            </Button>
                        </div>
                    </TabsContent>
                    <TabsContent value="en" className="space-y-4 outline-none">
                        <div className="relative group">
                            <div className="absolute top-3 right-3 opacity-20 group-focus-within:opacity-100 transition-opacity">
                                <Edit3 className="w-4 h-4" />
                            </div>
                            <Textarea
                                value={localEn}
                                onChange={(e) => setLocalEn(e.target.value)}
                                placeholder="Enter terms in English..."
                                className="min-h-[300px] font-mono text-sm leading-relaxed p-6 bg-slate-50/50 dark:bg-slate-900/50"
                            />
                        </div>
                        <div className="flex justify-end">
                            <Button 
                                onClick={() => onSave('en', localEn)}
                                disabled={isSaving || localEn === en}
                                className="gap-2"
                            >
                                <Save className="w-4 h-4" />
                                {isSaving ? 'A guardar...' : 'Guardar English'}
                            </Button>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </GlassCard>
    );
}

export function SecretaryAdminArea() {
    const { t } = useTranslation();
    const [slotCapacities, setSlotCapacities] = useState({
        SECRETARIA: 1,
    });
    const [savedCapacities, setSavedCapacities] = useState({
        SECRETARIA: 1,
    });
    const [catalogCounts, setCatalogCounts] = useState({
        materiais: 0,
        transportes: 0,
        tiposManutencao: 0,
        assuntosAtivos: 0,
    });
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const [isSavingSlots, setIsSavingSlots] = useState(false);

    const [retencaoAnos, setRetencaoAnos] = useState(5);
    const [savedRetencaoAnos, setSavedRetencaoAnos] = useState(5);
    const [isLoadingRetencao, setIsLoadingRetencao] = useState(false);
    const [isSavingRetencao, setIsSavingRetencao] = useState(false);

    const [currentTermsVersion, setCurrentTermsVersion] = useState(1);
    const [newTermsVersion, setNewTermsVersion] = useState(2);
    const [termsChangeDescription, setTermsChangeDescription] = useState('');
    const [isLoadingTerms, setIsLoadingTerms] = useState(false);
    const [isSavingTerms, setIsSavingTerms] = useState(false);

    const [termsContent, setTermsContent] = useState({ pt: '', en: '' });
    const [isSavingTermsContent, setIsSavingTermsContent] = useState(false);

    const loadSlotCapacities = async () => {
        setIsLoadingSlots(true);
        try {
            const config = await calendarioApi.listarConfiguracaoSlots();
            const value = config.find(item => item.tipo === 'SECRETARIA')?.capacidadePorSlot ?? 1;
            setSlotCapacities({ SECRETARIA: value });
            setSavedCapacities({ SECRETARIA: value });
        } catch (error) {
            toast.error(t('dashboard.admin.errors.loadSlotConfig'));
        } finally {
            setIsLoadingSlots(false);
        }
    };

    const loadTermsContent = async () => {
        try {
            const [ptData, enData] = await Promise.all([
                utilizadoresApi.getTermsContent('pt'),
                utilizadoresApi.getTermsContent('en'),
            ]);
            setTermsContent({ pt: ptData.content, en: enData.content });
        } catch {
            // Silencioso
        }
    };

    useEffect(() => {
        loadSlotCapacities();
        loadRetencaoDocumentos();
        loadTermsVersion();
        loadTermsContent();
    }, []);

    const loadTermsVersion = async () => {
        setIsLoadingTerms(true);
        try {
            const status = await utilizadoresApi.checkTermsStatus();
            setCurrentTermsVersion(status.currentVersion);
            setNewTermsVersion(status.currentVersion + 1);
        } catch {
            // silencioso — não crítico
        } finally {
            setIsLoadingTerms(false);
        }
    };

    const handleUpdateTermsVersion = async () => {
        if (newTermsVersion <= currentTermsVersion) {
            toast.error(`Nova versão deve ser superior à atual (${currentTermsVersion})`);
            return;
        }
        setIsSavingTerms(true);
        try {
            await utilizadoresApi.updateTermsVersion(newTermsVersion, termsChangeDescription);
            toast.success(`Termos atualizados para v${newTermsVersion}. Utilizadores notificados por email.`);
            setCurrentTermsVersion(newTermsVersion);
            setNewTermsVersion(newTermsVersion + 1);
            setTermsChangeDescription('');
        } catch {
            toast.error('Erro ao atualizar versão dos termos');
        } finally {
            setIsSavingTerms(false);
        }
    };

    const handleSaveTermsContent = async (lang: 'pt' | 'en', content: string) => {
        setIsSavingTermsContent(true);
        try {
            await utilizadoresApi.updateTermsContent(lang, content);
            toast.success(`Conteúdo (${lang.toUpperCase()}) atualizado com sucesso`);
            setTermsContent(prev => ({ ...prev, [lang]: content }));
        } catch {
            toast.error(`Erro ao atualizar conteúdo (${lang.toUpperCase()})`);
        } finally {
            setIsSavingTermsContent(false);
        }
    };

    const loadRetencaoDocumentos = async () => {
        setIsLoadingRetencao(true);
        try {
            const data = await apiRequest<{ anos: number }>('/api/config/documento/retencao', { method: 'GET' });
            setRetencaoAnos(data.anos);
            setSavedRetencaoAnos(data.anos);
        } catch (error) {
            toast.error('Erro ao carregar configuração de retenção');
        } finally {
            setIsLoadingRetencao(false);
        }
    };

    const handleSaveRetencao = async () => {
        if (retencaoAnos < 1 || retencaoAnos > 50) {
            toast.error('Prazo deve estar entre 1 e 50 anos');
            return;
        }

        setIsSavingRetencao(true);
        try {
            await apiRequest('/api/config/documento/retencao', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anos: retencaoAnos }),
            });
            toast.success('Prazo de retenção atualizado com sucesso');
            setSavedRetencaoAnos(retencaoAnos);
        } catch (error) {
            toast.error('Erro ao atualizar prazo de retenção');
        } finally {
            setIsSavingRetencao(false);
        }
    };

    useEffect(() => {
        const loadCatalogCounts = async () => {
            try {
                const [materiais, transportes, manutencaoItems, assuntos] = await Promise.all([
                    requisicoesApi.listarMateriais(),
                    requisicoesApi.listarTransportes(),
                    requisicoesApi.listarManutencaoItems(),
                    marcacoesApi.listarAssuntos(),
                ]);

                setCatalogCounts({
                    materiais: Array.isArray(materiais) ? materiais.length : 0,
                    transportes: Array.isArray(transportes) ? transportes.length : 0,
                    tiposManutencao: Array.isArray(manutencaoItems) 
                        ? new Set(manutencaoItems.map((i: ManutencaoItem) => i.categoria).filter(Boolean)).size 
                        : 0,
                    assuntosAtivos: Array.isArray(assuntos) ? assuntos.length : 0,
                });
            } catch (error) {
                toast.error(t('dashboard.admin.errors.loadCatalogCounts', 'Erro ao carregar métricas de catálogos'));
            }
        };

        loadCatalogCounts();
    }, [t]);

    const handleSlotCapacityChange = (tipo: 'SECRETARIA', value: string) => {
        const parsed = Number.parseInt(value, 10);
        const safeValue = Number.isFinite(parsed) ? Math.min(20, Math.max(1, parsed)) : 1;
        setSlotCapacities(prev => ({ ...prev, [tipo]: safeValue }));
    };

    const handleSaveSlotCapacities = async () => {
        setIsSavingSlots(true);
        try {
            await calendarioApi.atualizarConfiguracaoSlot('SECRETARIA', slotCapacities.SECRETARIA);
            toast.success(t('dashboard.admin.messages.slotConfigUpdated'));
            await loadSlotCapacities();
        } catch (error) {
            toast.error(t('dashboard.admin.errors.saveSlotConfig'));
        } finally {
            setIsSavingSlots(false);
        }
    };

    const summaryCards = useMemo(() => [
        {
            title: t('dashboard.admin.summary.slots.title'),
            value: savedCapacities.SECRETARIA,
            description: t('dashboard.admin.summary.slots.description'),
            icon: CalendarDays,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: t('dashboard.admin.summary.assuntos.title'),
            value: catalogCounts.assuntosAtivos,
            description: t('dashboard.admin.summary.assuntos.description'),
            icon: Settings2,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: t('dashboard.admin.summary.materials.title'),
            value: catalogCounts.materiais,
            description: t('dashboard.admin.summary.materials.description'),
            icon: Package,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: t('dashboard.admin.summary.transports.title'),
            value: catalogCounts.transportes,
            description: t('dashboard.admin.summary.transports.description'),
            icon: Truck,
            iconClassName: 'bg-primary/15 text-primary',
        },
        {
            title: t('dashboard.admin.summary.maintenanceTypes.title'),
            value: catalogCounts.tiposManutencao,
            description: t('dashboard.admin.summary.maintenanceTypes.description'),
            icon: Wrench,
            iconClassName: 'bg-primary/15 text-primary',
        },
    ], [savedCapacities, catalogCounts, t]);

    return (
        <div className="space-y-10 max-w-6xl mx-auto">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-foreground">{t('dashboard.admin.mainTitle')}</h1>
                <p className="text-muted-foreground max-w-2xl">
                    {t('dashboard.admin.mainDescription')}
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                {summaryCards.map((card) => (
                    <GlassCard key={card.title} className="p-6 flex items-start justify-between">
                        <div>
                            <p className="text-xs uppercase tracking-[0.08em] font-medium text-muted-foreground">{card.title}</p>
                            <p className="mt-2 text-4xl leading-none font-semibold text-foreground">{card.value}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                        </div>
                        <div className={`flex-shrink-0 inline-flex h-10 w-10 items-center justify-center rounded-2xl ${card.iconClassName}`}>
                            <card.icon className="w-5 h-5" />
                        </div>
                    </GlassCard>
                ))}
            </div>
            
            <SlotsManagement
                isLoadingSlots={isLoadingSlots}
                isSavingSlots={isSavingSlots}
                slotCapacities={slotCapacities}
                savedCapacities={savedCapacities}
                onChange={handleSlotCapacityChange}
                onSave={handleSaveSlotCapacities}
                t={t}
            />

            <GlassCard className="p-6">
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <FileText className="w-4 h-4" />
                            Gestão de Retenção (RGPD)
                        </div>
                        <h2 className="mt-2 text-xl font-semibold text-foreground">Retenção de Documentos</h2>
                        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                            Configure o prazo de retenção automática de documentos. Após este período, os documentos serão automaticamente removidos para cumprir com o RGPD.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-stretch">
                            <div className="flex items-center gap-4 p-6 sm:flex-1">
                                <div className="flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-foreground">Prazo de Expiração</h3>
                                    <p className="text-sm text-muted-foreground mt-0.5">Tempo máximo de permanência dos ficheiros no sistema</p>
                                </div>
                            </div>

                            <div className="hidden sm:block w-px bg-border my-4" />
                            <div className="block sm:hidden h-px bg-border mx-6" />

                            <div className="flex items-center gap-6 p-6 sm:w-72">
                                <div className="text-center min-w-[3rem]">
                                    <p className="text-5xl font-bold text-primary leading-none">{savedRetencaoAnos}</p>
                                    <p className="text-xs text-muted-foreground mt-1.5">Anos Atuais</p>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="retencao-anos" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Anos
                                    </Label>
                                    <Input
                                        id="retencao-anos"
                                        type="number"
                                        min={1}
                                        max={50}
                                        value={retencaoAnos}
                                        onChange={(e) => setRetencaoAnos(Number(e.target.value))}
                                        disabled={isLoadingRetencao}
                                        className="bg-background text-center text-lg font-semibold"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 items-center">
                        <p className="text-xs text-muted-foreground bg-accent/50 px-3 py-1.5 rounded-full border border-border">
                            Execução diária às 02h00
                        </p>
                        <Button
                            onClick={handleSaveRetencao}
                            disabled={isSavingRetencao || retencaoAnos === savedRetencaoAnos}
                            className="gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {isSavingRetencao ? 'A guardar...' : 'Guardar Configuração'}
                        </Button>
                    </div>
                </div>
            </GlassCard>

            <GlassCard className="p-6">
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground">
                            <ScrollText className="w-4 h-4" />
                            Política de Privacidade (RGPD)
                        </div>
                        <h2 className="mt-2 text-xl font-semibold text-foreground">Versionamento dos Termos de Uso</h2>
                        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
                            Ao publicar uma nova versão, todos os utilizadores serão notificados e obrigados a re-aceitar os termos no próximo acesso à plataforma.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                        <div className="flex flex-col sm:flex-row items-stretch">
                            <div className="flex items-center gap-4 p-6 sm:flex-1">
                                <div className="flex-shrink-0 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <ScrollText className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-semibold text-foreground">Nova Versão</h3>
                                    <div className="mt-3">
                                        <Label htmlFor="terms-change-desc" className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1.5 block">
                                            Descrição das alterações (enviada por email)
                                        </Label>
                                        <Textarea
                                            id="terms-change-desc"
                                            placeholder="Descreva as principais alterações para os utilizadores..."
                                            value={termsChangeDescription}
                                            onChange={(e) => setTermsChangeDescription(e.target.value)}
                                            rows={2}
                                            className="resize-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="hidden sm:block w-px bg-border my-4" />
                            <div className="block sm:hidden h-px bg-border mx-6" />

                            <div className="flex items-center gap-6 p-6 sm:w-72">
                                <div className="text-center min-w-[3rem]">
                                    <p className="text-5xl font-bold text-amber-600 leading-none">{currentTermsVersion}</p>
                                    <p className="text-xs text-muted-foreground mt-1.5">Versão Atual</p>
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <Label htmlFor="new-terms-version" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                        Próxima v
                                    </Label>
                                    <Input
                                        id="new-terms-version"
                                        type="number"
                                        min={currentTermsVersion + 1}
                                        value={newTermsVersion}
                                        onChange={(e) => setNewTermsVersion(Number(e.target.value))}
                                        disabled={isLoadingTerms}
                                        className="bg-background text-center text-lg font-semibold border-amber-200 dark:border-amber-900 focus-visible:ring-amber-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button
                            onClick={handleUpdateTermsVersion}
                            disabled={isSavingTerms || isLoadingTerms || newTermsVersion <= currentTermsVersion}
                            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white"
                        >
                            <ScrollText className="w-4 h-4" />
                            {isSavingTerms ? 'A publicar...' : `Publicar v${newTermsVersion} e Notificar`}
                        </Button>
                    </div>
                </div>
            </GlassCard>

            <TermsContentEditor 
                pt={termsContent.pt} 
                en={termsContent.en} 
                isSaving={isSavingTermsContent} 
                onSave={handleSaveTermsContent} 
            />

            <GlassCard className="p-6">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <Settings2 className="w-4 h-4" />
                    {t('dashboard.admin.assuntos.sectionTitle')}
                </div>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl mb-6">
                    {t('dashboard.admin.assuntos.sectionDescription')}
                </p>
                
                <SubjectManagement />
            </GlassCard>

            <GlassCard className="p-6">
                <div className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                    <Settings2 className="w-4 h-4" />
                    {t('dashboard.admin.catalogs.title')}
                </div>
                <p className="mt-1 text-sm text-muted-foreground max-w-2xl mb-4">
                    {t('dashboard.admin.catalogs.description')}
                </p>
                
                <h2 className="text-xl font-semibold text-foreground mb-6">
                    {t('dashboard.admin.catalogs.managementTitle')}
                </h2>

                <RequisitionsCatalogManagement />
            </GlassCard>
        </div>
    );
}
