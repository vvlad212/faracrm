/**
 * Дерево меню навигации. Единственный источник правды.
 *
 * Как пользоваться:
 *   { model: 'contact' }                        — ссылка на модель из modelsConfig
 *   { to: '/chat', id, labelKey, label? }       — произвольная ссылка
 *   { id, Icon, labelKey, submenus: [...] }     — подкатегория (вложенный список)
 *   { group: 'communication', submenus: [...] } — корневая группа (из MenuGroups)
 *
 * Чтобы добавить пункт — впишите в нужную группу/категорию.
 * Чтобы перенести — переставьте строку.
 * Чтобы скрыть — удалите строку.
 *
 * Вся инфраструктура (типы, резолверы, buildMenu, getVisibleMenuItems)
 * вынесена в menuHelpers.tsx — здесь только конфигурация.
 */

import {
  IconSettings,
  IconUsers,
} from '@tabler/icons-react';

import {
  buildMenu,
  getVisibleMenuItems as _getVisibleMenuItems,
  type GroupConfig,
  type MenuGroup,
  type MenuCategory,
  type MenuSimple,
} from '../components/NavbarMenu/menuHelpers';

import { RoleRecord } from '@/types/records';

// Реэкспорт типов и type-guards — чтобы существующие импорты из menuData
// продолжали работать без изменений.
export type { MenuGroup, MenuCategory, MenuSimple };
export {
  isMenuGroup,
  isMenuCategory,
  isMenuSimple,
} from '../components/NavbarMenu/menuHelpers';

/* ============================================================
 * ДЕРЕВО МЕНЮ
 * ============================================================ */

const menuTree: GroupConfig[] = [
  {
    group: 'crm',
    submenus: [
      { model: 'leads' },
    ],
  },

  {
    group: 'estimates',
    submenus: [
      { model: 'estimate' },
    ],
  },

  {
    group: 'templates',
    submenus: [
      { model: 'project_template' },
    ],
  },

  {
    group: 'stock',
    submenus: [
      { model: 'component' },
      {
        id: 'category_stock_settings',
        Icon: IconSettings,
        label: 'Справочники',
        labelKey: 'common:menu.settings',
        defaultCollapsed: true,
        submenus: [
          { model: 'component_category' },
          { model: 'uom' },
        ],
      },
    ],
  },

  {
    group: 'files',
    submenus: [
      { model: 'attachments' },
      { model: 'attachments_storage' },
    ],
  },

  {
    group: 'settings',
    submenus: [
      {
        id: 'category_users',
        Icon: IconUsers,
        label: 'Пользователи',
        labelKey: 'users:menu.users',
        submenus: [{ model: 'users' }, { model: 'company' }],
      },
      {
        id: 'category_other',
        Icon: IconSettings,
        label: 'Система',
        labelKey: 'security:menu.other',
        submenus: [
          { model: 'lead_stage' },
          { model: 'activity_type' },
          { model: 'report_template' },
          { model: 'system_settings' },
        ],
      },
    ],
  },
];

/* ============================================================
 * ЭКСПОРТЫ
 * ============================================================ */

export const items: MenuGroup[] = buildMenu(menuTree);

// Обёртка: сохраняем прежнюю сигнатуру (userRoles, isAdmin) для совместимости
// с существующими вызывающими компонентами.
export function getVisibleMenuItems(
  userRoles: RoleRecord[] = [],
  isAdmin: boolean = false,
): MenuGroup[] {
  return _getVisibleMenuItems(items, userRoles, isAdmin);
}
