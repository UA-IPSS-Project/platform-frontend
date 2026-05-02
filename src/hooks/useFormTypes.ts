import { useState, useEffect } from 'react';
import { candidaturasApi, type FormTypeResponse } from '../services/api';

export function useFormTypes() {
  const [formTypes, setFormTypes] = useState<FormTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFormTypes = async () => {
    try {
      setLoading(true);
      const data = await candidaturasApi.listarTiposFormularios();
      setFormTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Erro ao carregar tipos de formulário'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFormTypes();
  }, []);

  return { formTypes, loading, error, refresh: fetchFormTypes };
}
