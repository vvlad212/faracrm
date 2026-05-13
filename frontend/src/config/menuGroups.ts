import {
  IconUsers,
  IconGridScan,
  IconSettings,
  IconFiles,
  IconHeartHandshake,
  IconCalculator,
  IconTemplate,
} from '@tabler/icons-react';

export const MenuGroups = {
  crm: {
    id: 'category_crm',
    label: 'Лиды',
    labelKey: 'common:menu.crm',
    Icon: IconHeartHandshake,
    order: 10,
  },
  estimates: {
    id: 'category_estimates',
    label: 'Расчёты',
    labelKey: 'common:menu.estimates',
    Icon: IconCalculator,
    order: 20,
  },
  templates: {
    id: 'category_templates',
    label: 'Типовые проекты',
    labelKey: 'common:menu.templates',
    Icon: IconTemplate,
    order: 30,
  },
  stock: {
    id: 'category_stock',
    label: 'Склад',
    labelKey: 'common:menu.stock',
    Icon: IconGridScan,
    order: 40,
  },
  files: {
    id: 'category_files',
    label: 'Файлы',
    labelKey: 'common:menu.files',
    Icon: IconFiles,
    order: 70,
  },
  settings: {
    id: 'category_settings',
    label: 'Настройки',
    labelKey: 'common:menu.settings',
    Icon: IconSettings,
    order: 90,
  },
} as const;

export type MenuGroup = (typeof MenuGroups)[keyof typeof MenuGroups];
