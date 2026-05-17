import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { FormPage } from '../../services/api/candidaturas/types';

export const TABLE_TYPES = ['table', 'grid_table', 'ledger_table', 'structured_table'];

export interface BuildFormSchemaOptions {
  includeInternalPages?: boolean;
}

function getEnumValues(field: { config?: Record<string, any> }): string[] | undefined {
  const opts = field.config?.options;
  if (!Array.isArray(opts) || opts.length === 0) return undefined;
  return opts.map((o: any) => (typeof o === 'string' ? o : String(o.value ?? o.label ?? o)));
}

function isInternalAudience(audience?: string): boolean {
  return audience?.toUpperCase() === 'INTERNAL';
}

function shouldIncludePage(page: FormPage, includeInternalPages: boolean): boolean {
  if (includeInternalPages) return true;
  return !isInternalAudience(page.audience);
}

function shouldIncludeField(field: { audience?: string }, includeInternalPages: boolean): boolean {
  if (includeInternalPages) return true;
  return !isInternalAudience(field.audience);
}

export function buildPageSchemas(
  pages: FormPage[],
  options: BuildFormSchemaOptions = {},
): { schema: RJSFSchema; uiSchema: UiSchema }[] {
  const includeInternalPages = options.includeInternalPages === true;
  const visiblePages = (pages || []).filter((page) => shouldIncludePage(page, includeInternalPages));

  if (visiblePages.length === 0) {
    return [{
      schema: { type: 'object', properties: {} } as RJSFSchema,
      uiSchema: {},
    }];
  }

  return visiblePages.map((page) => {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    const uiSchema: Record<string, any> = {};

    const visibleFields = Array.isArray(page.fields)
      ? page.fields.filter((field) => shouldIncludeField(field, includeInternalPages))
      : [];

    visibleFields.forEach((field) => {
      const propSchema: Record<string, any> = {};
      const uiProp: Record<string, any> = {};

      if (field.config?.label) propSchema.title = field.config.label;
      if (field.config?.description) propSchema.description = field.config.description;
      if (field.config?.placeholder) uiProp['ui:placeholder'] = field.config.placeholder;

      const type = field.componentType;

      if (type === 'select' || type === 'radio') {
        propSchema.type = 'string';
        const enumValues = getEnumValues(field);
        if (enumValues) {
          propSchema.oneOf = enumValues.map((v) => ({ const: v, title: v }));
        }
        if (type === 'radio') uiProp['ui:widget'] = 'radio';
      } else if (type === 'multiselect') {
        propSchema.type = 'array';
        const enumValues = getEnumValues(field);
        propSchema.items = enumValues ? { type: 'string', enum: enumValues } : { type: 'string' };
        propSchema.uniqueItems = true;
        uiProp['ui:widget'] = 'checkboxes';
      } else if (TABLE_TYPES.includes(type)) {
        propSchema.type = 'string';
        uiProp['ui:widget'] = 'tableField';
        uiProp['ui:options'] = {
          tableType: type,
          fieldConfig: field.config ?? {},
        };
      } else if (['text', 'email', 'textarea', 'date'].includes(type)) {
        propSchema.type = 'string';
        if (type === 'email') propSchema.format = 'email';
        if (type === 'date') propSchema.format = 'date';
        if (type === 'textarea') uiProp['ui:widget'] = 'textarea';
        if (type === 'date') uiProp['ui:widget'] = 'date';
      } else if (type === 'number') {
        propSchema.type = 'number';
      } else if (type === 'checkbox' || type === 'boolean') {
        propSchema.type = 'boolean';
      } else if (type === 'file') {
        propSchema.type = 'string';
        uiProp['ui:widget'] = 'fileField';
      } else {
        propSchema.type = 'string';
      }

      properties[field.key] = propSchema;

      if (field.config?.required) required.push(field.key);
      if (Object.keys(uiProp).length > 0) uiSchema[field.key] = uiProp;
    });

    return {
      schema: {
        type: 'object',
        properties,
        ...(required.length ? { required } : {}),
      } as RJSFSchema,
      uiSchema: uiSchema as UiSchema,
    };
  });
}

export function buildFullFormSchema(
  pages: FormPage[],
  options: BuildFormSchemaOptions = {},
): { schema: RJSFSchema; uiSchema: UiSchema } {
  const schemas = buildPageSchemas(pages, options);

  if (schemas.length === 1) {
    return schemas[0];
  }

  const properties: Record<string, any> = {};
  const required: string[] = [];
  let uiSchema: Record<string, any> = {};

  schemas.forEach((pageSchema) => {
    Object.assign(properties, pageSchema.schema.properties);
    if (pageSchema.schema.required) {
      required.push(...(pageSchema.schema.required as string[]));
    }
    uiSchema = { ...uiSchema, ...pageSchema.uiSchema };
  });

  return {
    schema: {
      type: 'object',
      properties,
      ...(required.length ? { required } : {}),
    } as RJSFSchema,
    uiSchema,
  };
}
