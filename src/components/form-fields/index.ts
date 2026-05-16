import { LayoutGrid, ScrollText, Table2, TableProperties } from 'lucide-react';
import { GridTable, GridTableConfig } from './GridTable';
import { LedgerTable, LedgerTableConfig } from './LedgerTable';
import { SimpleTable, SimpleTableConfig } from './SimpleTable';
import { StructuredTable, StructuredTableConfig } from './StructuredTable';
import type { FormFieldDescriptor } from './types';

export type { FormFieldConfigPanelProps, FormFieldDescriptor, FormFieldRenderProps } from './types';

// ─── Descriptors ──────────────────────────────────────────────────────────────

const simpleTable: FormFieldDescriptor = {
  type: 'table',
  label: 'Tabela simples',
  category: 'TABELAS',
  icon: Table2,
  defaultConfig: {
    columns: ['Coluna 1', 'Coluna 2', 'Coluna 3'],
    rows: 3,
  },
  Field: SimpleTable,
  ConfigPanel: SimpleTableConfig,
};

const gridTable: FormFieldDescriptor = {
  type: 'grid_table',
  label: 'Agregado Familiar',
  category: 'TABELAS',
  icon: LayoutGrid,
  defaultConfig: {
    columns: ['Nome', 'Parentesco', 'Data Nasc.', 'NIF'],
    rows: 4,
    showOutros: false,
    showTotal: true,
  },
  Field: GridTable,
  ConfigPanel: GridTableConfig,
};

const ledgerTable: FormFieldDescriptor = {
  type: 'ledger_table',
  label: 'Rendimento Mensal',
  category: 'TABELAS',
  icon: ScrollText,
  defaultConfig: {
    rows: ['Trabalho dependente', 'Trabalho independente', 'Pensão/Reforma', 'Subsídios'],
    showTotal: true,
  },
  Field: LedgerTable,
  ConfigPanel: LedgerTableConfig,
};

const structuredTable: FormFieldDescriptor = {
  type: 'structured_table',
  label: 'Caracterização Individual',
  category: 'TABELAS',
  icon: TableProperties,
  defaultConfig: {
    rows: ['Situação profissional', 'Habilitações literárias', 'Estado civil'],
    columns: ['Requerente', 'Cônjuge/U.F.'],
  },
  Field: StructuredTable,
  ConfigPanel: StructuredTableConfig,
};

// ─── Registry ─────────────────────────────────────────────────────────────────

export const FORM_FIELD_REGISTRY: Record<string, FormFieldDescriptor> = {
  [simpleTable.type]: simpleTable,
  [gridTable.type]: gridTable,
  [ledgerTable.type]: ledgerTable,
  [structuredTable.type]: structuredTable,
};

export const FORM_FIELD_DESCRIPTORS: FormFieldDescriptor[] = [
  simpleTable,
  gridTable,
  ledgerTable,
  structuredTable,
];
