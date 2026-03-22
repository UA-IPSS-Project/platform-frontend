# Sistema Modular de Estados de Marcações

## 📋 Visão Geral

Este documento descreve o sistema centralizado e modularizado de estados de marcações na aplicação. O objetivo é garantir **consistência visual** em toda a aplicação com **reutilização de código**, criando uma estrutura forte e simples.

---

## 🎯 Objetivos Alcançados

✅ **Centralização de Configurações**: Toda a lógica de cores, labels e estilos está em um único lugar (`appointmentStatusConfig.ts`)

✅ **Reutilização de Código**: Hook `useAppointmentStatus` fornece uma interface consistente

✅ **Componente Unificado**: `StatusBadge` é o único componente para renderizar status em toda a app

✅ **Escalabilidade**: Fácil adicionar novos estados ou modificar estilos globalmente

✅ **Eliminação de Duplicação**: Removidas funções `getStatusBadge` duplicadas em `HistoryPage` e `AppointmentDetailsDialog`

---

## 🏗️ Arquitetura

### 1. **Camada de Configuração** - `src/config/appointmentStatusConfig.ts`

Define a configuração para cada estado de marcação:

```typescript
export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatusType, StatusConfig> = {
  scheduled: {
    label: 'statusBadge.scheduled',
    color: { light: {...}, dark: {...} },
    variant: 'default',
  },
  'in-progress': { ... },
  completed: { ... },
  'no-show': { ... },
  cancelled: { ... },
  warning: { ... },
  reserved: { ... },
};
```

**Benefícios**:
- Único ponto de mudança para cores/styles
- Fácil expansão com novos estados
- `StatusStyleBuilder` para construir classes Tailwind dinamicamente

### 2. **Hook Reusável** - `src/hooks/useAppointmentStatus.ts`

Fornece interface uniforme para acessar lógica de status:

```typescript
const { 
  getStatusLabel,           // Tradução de um status
  getStatusClasses,         // Classes Tailwind completas
  isOutlineVariant,         // Verifica se é outline
  getBorderClasses,         // Classes de borda
  shouldShowAlertIcon,      // Se mostra ícone de alerta
} = useAppointmentStatus();
```

**Uso Típico**:
```typescript
const { getStatusLabel, getStatusClasses } = useAppointmentStatus();

// Em componentes
<div className={getStatusClasses('completed')}>
  {getStatusLabel('completed')}
</div>
```

### 3. **Componente Unificado** - `src/components/shared/status-badge.tsx`

Componente único para renderizar status em toda a app:

```typescript
<StatusBadge 
  status={appointment.status}
  size="md"                    // 'sm' | 'md' | 'lg'
  showIcon={true}              // Mostra ícone de alerta quando aplicável
  className="custom-class"     // Classes adicionais opcionais
/>
```

**Variantes Suportadas**:
- `scheduled` - Pink badge com background
- `in-progress` - Purple badge com background  
- `completed` - Green badge com background
- `no-show` - Amber outline badge
- `cancelled` - Red outline badge
- `warning` - Amber outline com ícone de alerta
- `reserved` - Slate badge com background

---

## 🔄 Fluxo de Uso

```
User Interface (HistoryPage, AppointmentDetailsDialog, etc.)
        ↓
    <StatusBadge status={apt.status} />
        ↓
  useAppointmentStatus() hook
        ↓
appointmentStatusConfig.ts (Configurações)
        ↓
Renderização consistente de badge com cores/labels/ícones
```

---

## 📍 Locais Refatorados

### ✅ `src/pages/HistoryPage.tsx`
- **Antes**: Função local `getStatusBadge` com cores duplicadas em hardcode
- **Depois**: Usa `<StatusBadge status={apt.status} />`
- **Resultado**: Cores agora consistentes com todo sistema

### ✅ `src/components/secretary/AppointmentDetailsDialog.tsx`
- **Antes**: Função local `getStatusBadge` com switch case duplicado
- **Depois**: Usa `<StatusBadge status={appointment.status} size="md" />`
- **Resultado**: Eliminada duplicação de 30+ linhas

### ✅ `src/components/secretary/TodayAppointments.tsx`
- **Estado**: Já estava usando `<StatusBadge />`
- **Verificado**: Compatível com novo sistema

### ℹ️ `src/components/secretary/WeeklySchedule.tsx`
- **Contexto**: Usa estilos próprios para células de calendário (não badges)
- **Decisão**: Mantido sistema próprio pois é contexto diferente (células interativas vs badges em tabelas)

---

## 🎨 Guia de Cores Consistentes

| Estado | Fundo (Light) | Texto (Light) | Fundo (Dark) | Texto (Dark) | Tipo |
|--------|---------------|---------------|--------------|--------------|------|
| Scheduled | pink-100 | pink-700 | pink-900/40 | pink-200 | Badge |
| In Progress | #ede9fe | #5b21b6 | #4c1d95 | #c4b5fd | Badge |
| Completed | emerald-100 | emerald-700 | emerald-900/40 | emerald-200 | Badge |
| No-Show | transparent | amber-700 | transparent | amber-400 | Outline |
| Cancelled | transparent | red-600 | transparent | red-500 | Outline |
| Warning | transparent | amber-700 | transparent | amber-400 | Outline + Icon |
| Reserved | slate-100 | slate-700 | slate-700 | slate-200 | Badge |

---

## 💡 Como Adicionar um Novo Estado

Se precisar adicionar um novo estado (ex: `postponed`):

### 1. Adicionar em `appointmentStatusConfig.ts`:
```typescript
export const APPOINTMENT_STATUS_CONFIG: Record<AppointmentStatusType, StatusConfig> = {
  // ... outros estados
  postponed: {
    label: 'statusBadge.postponed',
    color: {
      light: { bg: 'bg-blue-100', text: 'text-blue-700' },
      dark: { bg: 'dark:bg-blue-900/40', text: 'dark:text-blue-200' },
    },
    variant: 'default',
  },
};
```

### 2. Adicionar string i18n em `public/locales/pt.json`:
```json
"statusBadge": {
  "postponed": "Adiado",
  ...
}
```

### 3. Usar em componentes:
```typescript
<StatusBadge status="postponed" />
```

---

## 🔧 Extensibilidade

### Adicionar Nova Variante de Tamanho

Em `StatusBadge.tsx`:
```typescript
const sizeClasses = {
  sm: 'px-1.5 py-0.25 text-xs',
  md: 'px-2 py-0.5 text-xs',
  lg: 'px-3 py-1 text-sm',
  xl: 'px-4 py-2 text-base',  // Nova
};
```

### Adicionar Novo Tipo de Ícone

Na configuração:
```typescript
icon?: 'alert' | 'check' | 'clock' | 'none';
```

E em `StatusBadge.tsx`:
```typescript
const iconMap = {
  alert: <AlertTriangleIcon className="w-3 h-3" />,
  check: <CheckIcon className="w-3 h-3" />,
  clock: <ClockIcon className="w-3 h-3" />,
};
```

---

## 📊 Checklist de Uso Correto

Ao criar/modificar componentes que mostram status de marcações:

- [ ] Usar `<StatusBadge status={apt.status} />` em vez de Badge customizado
- [ ] Nunca duplicar lógica de cores de status em inline styles
- [ ] Se precisar informações sobre status, usar `useAppointmentStatus()` hook
- [ ] Adicionar novos estados em `appointmentStatusConfig.ts`
- [ ] Adicionar tradução em `public/locales/pt.json`
- [ ] Testar em modo claro e escuro

---

## 🧪 Validação

Para validar consistência visual:

1. **Abrir HistoryPage** - Verificar badges em tabela
2. **Abrir AppointmentDetailsDialog** - Verificar badge ao lado do título
3. **Verificar TodayAppointments** - Verificar badges em lista do dia
4. **Testar Modo Escuro** - Todas cores devem ser legíveis
5. **Testar Idiomas** - Labels devem aparecer em PT e EN

---

## 📝 Notas

- Sistema funciona em **todas as roles/visões** (Secretária, Balneário, Escola, Cliente)
- Labels automáticos traduzem via i18n (`useTranslation` hook)
- Componente é totalmente reusável e escalável
- Fácil fazer mudanças globais de design futuramente

---

## 🚀 Próximos Passos (Opcional)

- Criar histórias Storybook para cada variante de StatusBadge
- Adicionar testes unitários para `StatusStyleBuilder`
- Integrar com sistema de temas global (se tiver)
- Extensão para requisições (similar refactor)
