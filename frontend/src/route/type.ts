import { ComponentType, ReactNode } from 'react';

export interface RouteModelProps {
  name: string;
  list?: ComponentType;
  form?: ComponentType;
  kanban?: ComponentType;
  gantt?: ComponentType;
  icon?: ComponentType;
  children?: ReactNode;
  defaultView?: 'list' | 'kanban';
}

export interface ViewFormProps {
  isCreateForm?: boolean;
}
