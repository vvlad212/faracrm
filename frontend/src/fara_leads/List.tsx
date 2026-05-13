import { Field } from '@/components/List/Field';
import { List } from '@/components/List/List';
import ColorCell from '@/components/ListCells/ColorCell';
import RelationCell from '@/components/ListCells/RelationCell';

import type {
  LeadRecord,
  LeadStageRecord,
  TeamCrmRecord,
} from '@/types/records';
import { useTranslation } from 'react-i18next';

export function ViewListLeads() {
  return (
    <List<LeadRecord> model="leads" order="desc" sort="id">
      <Field name="id" label="ID" />
      <Field name="name" label="Имя" />
      <Field name="phone" label="Телефон" />
      <Field name="source" label="Источник" />
      <Field
        name="stage_id"
        label="Стадия"
        render={value => <RelationCell value={value} model="lead_stage" />}
      />
      <Field
        name="user_id"
        label="Ответственный"
        render={value => <RelationCell value={value} model="users" />}
      />
    </List>
  );
}

export function ViewListTeamCrm() {
  const { t } = useTranslation('leads');
  return (
    <List<TeamCrmRecord> model="team_crm" order="desc" sort="id">
      <Field name="id" label={t('team_crm.id')} />
      <Field name="name" label={t('team_crm.name')} />
    </List>
  );
}

export function ViewListLeadStage() {
  const { t } = useTranslation('leads');
  return (
    <List<LeadStageRecord> model="lead_stage" order="asc" sort="sequence">
      <Field name="id" label={t('lead_stage.id')} />
      <Field name="name" label={t('lead_stage.name')} />
      <Field name="sequence" label={t('lead_stage.sequence')} />
      <Field
        name="color"
        label={t('lead_stage.color')}
        render={value => <ColorCell value={value} />}
      />
      <Field name="fold" label={t('lead_stage.fold')} />
    </List>
  );
}
