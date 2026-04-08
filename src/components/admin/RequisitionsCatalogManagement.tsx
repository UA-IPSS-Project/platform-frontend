import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Truck, Wrench } from 'lucide-react';
import { 
  requisicoesApi, 
  type MaterialCatalogo, 
  type TransporteCatalogo, 
  type ManutencaoItem 
} from '../../services/api';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { formatarCategoria } from '../../utils/formatters';
import { MaterialCatalog } from './catalog/MaterialCatalog';
import { TransportCatalog } from './catalog/TransportCatalog';
import { MaintenanceCatalog } from './catalog/MaintenanceCatalog';
import { GlassCard } from '../ui/glass-card';

const MAX_LOAD_CATALOGO_RETRIES = 4;

export function RequisitionsCatalogManagement() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [transportes, setTransportes] = useState<TransporteCatalogo[]>([]);
  const [manutencaoItems, setManutencaoItems] = useState<ManutencaoItem[]>([]);

  const formatCategoryName = (name: string) => formatarCategoria(name);

  const loadCatalogo = async (retryCount = 0) => {
    try {
      const [materiaisRes, transportesRes, manutencaoRes] = await Promise.all([
        requisicoesApi.listarMateriais(),
        requisicoesApi.listarTransportes(),
        requisicoesApi.listarManutencaoItems(),
      ]);

      setMateriais(Array.isArray(materiaisRes) ? materiaisRes : []);
      setTransportes(Array.isArray(transportesRes) ? transportesRes : []);
      setManutencaoItems(Array.isArray(manutencaoRes) ? manutencaoRes : []);
    } catch (error) {
      if (retryCount < MAX_LOAD_CATALOGO_RETRIES) {
        setTimeout(() => void loadCatalogo(retryCount + 1), 1000);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCatalogo();
  }, []);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="materials" className="w-full">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <TabsList className="grid w-full md:w-auto grid-cols-3 md:min-w-[450px]">
                <TabsTrigger value="materials" className="gap-2">
                    <Package className="w-4 h-4" />
                    <span className="hidden sm:inline">Materiais</span>
                </TabsTrigger>
                <TabsTrigger value="transports" className="gap-2">
                    <Truck className="w-4 h-4" />
                    <span className="hidden sm:inline">Transportes</span>
                </TabsTrigger>
                <TabsTrigger value="maintenance" className="gap-2">
                    <Wrench className="w-4 h-4" />
                    <span className="hidden sm:inline">Manutenção</span>
                </TabsTrigger>
            </TabsList>
        </div>

        {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse">A carregar catálogo...</p>
            </div>
        ) : (
            <>
                <TabsContent value="materials" className="mt-0 focus-visible:ring-0">
                    <MaterialCatalog 
                        materiais={materiais} 
                        onRefresh={() => loadCatalogo()} 
                        formatCategoryName={formatCategoryName}
                    />
                </TabsContent>

                <TabsContent value="transports" className="mt-0 focus-visible:ring-0">
                    <TransportCatalog 
                        transportes={transportes} 
                        onRefresh={() => loadCatalogo()} 
                        formatCategoryName={formatCategoryName}
                    />
                </TabsContent>

                <TabsContent value="maintenance" className="mt-0 focus-visible:ring-0">
                    <MaintenanceCatalog 
                        items={manutencaoItems} 
                        onRefresh={() => loadCatalogo()} 
                        formatCategoryName={formatCategoryName}
                    />
                </TabsContent>
            </>
        )}
      </Tabs>
    </div>
  );
}
