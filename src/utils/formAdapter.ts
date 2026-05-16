import { RJSFSchema, UiSchema } from '@rjsf/utils';
import { FormPage } from '../services/api/candidaturas/types';

export function buildPageSchemas(pages: FormPage[]): { schema: RJSFSchema; uiSchema: UiSchema }[] {
  if (!pages || pages.length === 0) {
    return [{
      schema: { type: 'object', properties: {} } as RJSFSchema,
      uiSchema: {},
    }];
  }

  return pages.map((page) => {
    const properties: Record<string, any> = {};
    const required: string[] = [];
    const uiSchema: Record<string, any> = {};

    if (page.fields && Array.isArray(page.fields)) {
      page.fields.forEach((field) => {
        // Create JSON Schema property
        const propSchema: Record<string, any> = {};
        
        // Map basic types
        if (['text', 'email', 'textarea', 'date'].includes(field.componentType)) {
          propSchema.type = 'string';
        } else if (field.componentType === 'number') {
          propSchema.type = 'number';
        } else if (field.componentType === 'boolean') {
          propSchema.type = 'boolean';
        } else {
          propSchema.type = 'string'; // Default fallback
        }

        // Map config to JSON schema
        if (field.config?.label) {
          propSchema.title = field.config.label;
        }
        if (field.config?.description) {
          propSchema.description = field.config.description;
        }

        // Format based on componentType
        if (field.componentType === 'email') {
          propSchema.format = 'email';
        } else if (field.componentType === 'date') {
          propSchema.format = 'date';
        }

        properties[field.key] = propSchema;

        // Handle required
        if (field.config?.required) {
          required.push(field.key);
        }

        // Create UI Schema
        const uiProp: Record<string, any> = {};
        if (field.componentType === 'textarea') {
          uiProp['ui:widget'] = 'textarea';
        } else if (field.componentType === 'date') {
          uiProp['ui:widget'] = 'date';
        }
        if (field.config?.placeholder) {
          uiProp['ui:placeholder'] = field.config.placeholder;
        }
        
        if (Object.keys(uiProp).length > 0) {
          uiSchema[field.key] = uiProp;
        }
      });
    }

    return {
      schema: {
        type: 'object',
        title: page.title,
        ...(page.description ? { description: page.description } : {}),
        properties,
        ...(required.length ? { required } : {}),
      } as RJSFSchema,
      uiSchema: uiSchema as UiSchema,
    };
  });
}

export function buildFullFormSchema(pages: FormPage[]): { schema: RJSFSchema; uiSchema: UiSchema } {
  const schemas = buildPageSchemas(pages);
  
  if (schemas.length === 1) {
    return schemas[0];
  }

  // Combine all schemas into a single object for the detail view
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
