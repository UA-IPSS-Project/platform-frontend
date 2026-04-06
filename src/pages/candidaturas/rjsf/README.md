# RJSF setup in this project

This folder keeps RJSF concerns isolated from business pages.

## Folder structure

- `schemas/`: JSON Schemas (`RJSFSchema`) for form data contracts
- `ui/`: `uiSchema` per form (presentation, widgets, placeholders)
- `widgets/`: custom widgets mapped to local UI components
- `templates/`: field/object/array templates for common visual rules
- `RjsfCandidaturaForm.tsx`: mockup entry component for candidaturas

## Install

```bash
npm install @rjsf/core @rjsf/validator-ajv8
```

## Usage pattern

1. Create schema in `schemas/`.
2. Create uiSchema in `ui/`.
3. Add/extend widgets in `widgets/`.
4. Compose `Form` in a page/component and pass:

```tsx
<Form
  schema={schema}
  uiSchema={uiSchema}
  validator={validator}
  widgets={rjsfWidgets}
  templates={{ FieldTemplate: RjsfFieldTemplate }}
/>
```

## Why this approach

- Avoids mixing schema logic inside page components.
- Makes forms reusable across pages.
- Keeps design consistency through shared widgets/templates.