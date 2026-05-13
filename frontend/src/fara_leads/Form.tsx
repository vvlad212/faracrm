import { Form } from '@/components/Form/Form';
import { Field } from '@/components/List/Field';
import { ViewFormProps } from '@/route/type';
import type {
  LeadRecord,
  LeadStageRecord,
  TeamCrmRecord,
} from '@/types/records';
import { FormSection, FormRow } from '@/components/Form/Layout';
import {
  IconUser,
  IconBuilding,
  IconTag,
  IconProgress,
  IconPalette,
  IconCalculator,
} from '@tabler/icons-react';
import { useParams, useLocation } from 'react-router-dom';
import { LeadStepper } from './LeadStepper';
import { LeadTimeline } from './LeadTimeline';

/**
 * Форма лида/возможности
 */
export function ViewFormLeads(props: ViewFormProps) {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const isCreate = props.isCreateForm || !id || pathname.includes('/create');

  return (
    <Form<LeadRecord>
      model="leads"
      {...props}
      header={!isCreate ? <LeadStepper /> : undefined}
      footer={!isCreate ? <LeadTimeline /> : undefined}
    >
      {/* Основная информация */}
      <FormSection title="Клиент" icon={<IconUser size={18} />}>
        <FormRow cols={2}>
          <Field name="name" label="Имя" />
          <Field name="phone" label="Телефон" />
        </FormRow>
        <FormRow cols={2}>
          <Field name="source" label="Источник" />
          <Field name="stage_id" label="Стадия" hidden={!isCreate} />
          {!isCreate && <Field name="user_id" label="Ответственный" />}
        </FormRow>
      </FormSection>

      {/* Участок */}
      <FormSection title="Участок" icon={<IconBuilding size={18} />}>
        <Field name="address" label="Адрес участка" />
      </FormSection>

      {/* Расчёты */}
      {!isCreate && (
        <Field
          name="estimate_ids"
          label="Расчёты"
          displayField="name"
          showCreate={true}
          showSelect={false}
          inline_create={false}
          inline_update={false}
        >
          <Field name="id" label="ID" />
          <Field name="name" label="Номер" />
          <Field name="status" label="Статус" />
          <Field name="source_template_id" label="Шаблон" />
          <Field name="date_created" label="Дата" />
        </Field>
      )}

      {/* Заметки */}
      <FormSection title="Заметки" icon={<IconTag size={18} />}>
        <Field name="notes" label="Заметки" />
      </FormSection>
    </Form>
  );
}

/**
 * Форма команды CRM
 */
export function ViewFormTeamCrm(props: ViewFormProps) {
  return (
    <Form<TeamCrmRecord> model="team_crm" {...props}>
      <FormSection title="Команда CRM" icon={<IconBuilding size={18} />}>
        <FormRow cols={2}>
          <Field name="name" label="Название" />
        </FormRow>
      </FormSection>
    </Form>
  );
}

/**
 * Форма стадии лида
 */
export function ViewFormLeadStage(props: ViewFormProps) {
  return (
    <Form<LeadStageRecord> model="lead_stage" {...props}>
      <FormSection title="Стадия" icon={<IconProgress size={18} />}>
        <FormRow cols={2}>
          <Field name="name" label="Название" />
          <Field name="sequence" label="Последовательность" />
        </FormRow>
      </FormSection>

      <FormSection title="Настройки" icon={<IconPalette size={18} />}>
        <FormRow cols={2}>
          <Field name="color" label="Цвет" widget="color" />
          <Field name="fold" label="Свёрнута в канбане" />
        </FormRow>
        <Field name="active" label="Активна" />
      </FormSection>
    </Form>
  );
}
