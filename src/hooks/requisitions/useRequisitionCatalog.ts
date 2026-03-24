import { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'sonner';
import { MaterialCatalogo, ManutencaoItem, TransporteCatalogo, requisicoesApi } from '../../services/api';

export function useRequisitionCatalog(t: (key: string) => string) {
  const [materiais, setMateriais] = useState<MaterialCatalogo[]>([]);
  const [transportes, setTransportes] = useState<TransporteCatalogo[]>([]);
  const [manutencaoItems, setManutencaoItems] = useState<ManutencaoItem[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(false);

  const fetchCatalogo = useCallback(async () => {
    try {
      setLoadingCatalogo(true);
      const [materiaisData, transportesData, manutencaoData] = await Promise.all([
        requisicoesApi.listarMateriais(),
        requisicoesApi.listarTransportes(),
        requisicoesApi.listarManutencaoItems(),
      ]);
      setMateriais(Array.isArray(materiaisData) ? materiaisData : []);
      setTransportes(Array.isArray(transportesData) ? transportesData : []);
      setManutencaoItems(Array.isArray(manutencaoData) ? manutencaoData : []);
    } catch (error: any) {
      toast.error(error?.message || t('requisitions.errors.loadCatalogFailed'));
    } finally {
      setLoadingCatalogo(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCatalogo();
  }, [fetchCatalogo]);

  return useMemo(() => ({
    materiais,
    transportes,
    manutencaoItems,
    loadingCatalogo,
    fetchCatalogo,
  }), [materiais, transportes, manutencaoItems, loadingCatalogo, fetchCatalogo]);
}
