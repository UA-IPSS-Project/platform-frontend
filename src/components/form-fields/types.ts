import type { ComponentType } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface FormFieldRenderProps {
  config: Record<string, unknown>;
}

export interface FormFieldConfigPanelProps {
  config: Record<string, unknown>;
  onChange: (newConfig: Record<string, unknown>) => void;
}

export interface FormFieldDescriptor {
  type: string;
  label: string;
  category: string;
  icon: LucideIcon;
  defaultConfig: Record<string, unknown>;
  Field: ComponentType<FormFieldRenderProps>;
  ConfigPanel: ComponentType<FormFieldConfigPanelProps>;
}
