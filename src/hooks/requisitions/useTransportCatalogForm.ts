import { useState, type Dispatch, type SetStateAction } from 'react';
import { type TransporteCategoria, type TransporteCatalogo } from '../../services/api';

const DEFAULT_TRANSPORTE_CATEGORIA: TransporteCategoria = 'LIGEIRO_DE_PASSAGEIROS';

export const AVAILABLE_TRANSPORT_CATEGORIES: TransporteCategoria[] = [
  'LIGEIRO_DE_PASSAGEIROS', 'LIGEIRO_DE_MERCADORIAS', 'LIGEIRO_MISTO', 'LIGEIRO_ESPECIAL',
  'PESADO_DE_PASSAGEIROS', 'PESADO_DE_MERCADORIAS', 'PESADO_MISTO',
  'ADAPTADO', 'ESCOLAR', 'AMBULANCIA', 'TRACTOR', 'OUTRO'
];

export interface NewItemFields {
  novoTipo: string;
  novaMatricula: string;
  novaMarca: string;
  novoModelo: string;
  novaLotacao: string;
  novaDataMatricula: string;
  novaCategoria: TransporteCategoria;
}

export interface EditFields {
  editTipo: string;
  editMatricula: string;
  editMarca: string;
  editModelo: string;
  editLotacao: string;
  editDataMatricula: string;
  editCodigo: string;
  editCategoria: TransporteCategoria;
}

type Setter<T> = Dispatch<SetStateAction<T>>;

export interface NewItemSetters {
  setNovoTipo: Setter<string>;
  setNovaMatricula: Setter<string>;
  setNovaMarca: Setter<string>;
  setNovoModelo: Setter<string>;
  setNovaLotacao: Setter<string>;
  setNovaDataMatricula: Setter<string>;
  setNovaCategoria: Setter<TransporteCategoria>;
}

export interface EditSetters {
  setEditTipo: Setter<string>;
  setEditMatricula: Setter<string>;
  setEditMarca: Setter<string>;
  setEditModelo: Setter<string>;
  setEditLotacao: Setter<string>;
  setEditDataMatricula: Setter<string>;
  setEditCodigo: Setter<string>;
  setEditCategoria: Setter<TransporteCategoria>;
}

export function useTransportCatalogForm() {
  const [novoTipo, setNovoTipo] = useState('');
  const [novaCategoria, setNovaCategoria] = useState<TransporteCategoria>(DEFAULT_TRANSPORTE_CATEGORIA);
  const [novaMatricula, setNovaMatricula] = useState('');
  const [novaMarca, setNovaMarca] = useState('');
  const [novoModelo, setNovoModelo] = useState('');
  const [novaLotacao, setNovaLotacao] = useState('');
  const [novaDataMatricula, setNovaDataMatricula] = useState('');

  const [editTipo, setEditTipo] = useState('');
  const [editMatricula, setEditMatricula] = useState('');
  const [editMarca, setEditMarca] = useState('');
  const [editModelo, setEditModelo] = useState('');
  const [editLotacao, setEditLotacao] = useState('');
  const [editDataMatricula, setEditDataMatricula] = useState('');
  const [editCodigo, setEditCodigo] = useState('');
  const [editCategoria, setEditCategoria] = useState<TransporteCategoria>(DEFAULT_TRANSPORTE_CATEGORIA);

  const resetNewItem = () => {
    setNovoTipo('');
    setNovaCategoria(DEFAULT_TRANSPORTE_CATEGORIA);
    setNovaMatricula('');
    setNovaMarca('');
    setNovoModelo('');
    setNovaLotacao('');
    setNovaDataMatricula('');
  };

  const populateEditFields = (item: TransporteCatalogo) => {
    setEditTipo(item.tipo || '');
    setEditMatricula(item.matricula || '');
    setEditMarca(item.marca || '');
    setEditModelo(item.modelo || '');
    setEditLotacao(item.lotacao ? String(item.lotacao) : '');
    setEditDataMatricula(item.dataMatricula || '');
    setEditCodigo(item.codigo || '');
    setEditCategoria(item.categoria || DEFAULT_TRANSPORTE_CATEGORIA);
  };

  const newItemFields: NewItemFields = {
    novoTipo,
    novaMatricula,
    novaMarca,
    novoModelo,
    novaLotacao,
    novaDataMatricula,
    novaCategoria,
  };

  const editFields: EditFields = {
    editTipo,
    editMatricula,
    editMarca,
    editModelo,
    editLotacao,
    editDataMatricula,
    editCodigo,
    editCategoria,
  };

  const newItemSetters: NewItemSetters = {
    setNovoTipo,
    setNovaMatricula,
    setNovaMarca,
    setNovoModelo,
    setNovaLotacao,
    setNovaDataMatricula,
    setNovaCategoria,
  };

  const editSetters: EditSetters = {
    setEditTipo,
    setEditMatricula,
    setEditMarca,
    setEditModelo,
    setEditLotacao,
    setEditDataMatricula,
    setEditCodigo,
    setEditCategoria,
  };

  return {
    newItemFields,
    editFields,
    newItemSetters,
    editSetters,
    setNovoTipo,
    setNovaCategoria,
    setNovaMatricula,
    setNovaMarca,
    setNovoModelo,
    setNovaLotacao,
    setNovaDataMatricula,
    setEditTipo,
    setEditMatricula,
    setEditMarca,
    setEditModelo,
    setEditLotacao,
    setEditDataMatricula,
    setEditCodigo,
    setEditCategoria,
    resetNewItem,
    populateEditFields,
  };
}
