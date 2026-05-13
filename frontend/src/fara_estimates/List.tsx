import { Field } from '@/components/List/Field';
import { List } from '@/components/List/List';
import RelationCell from '@/components/ListCells/RelationCell';
import DateTimeCell from '@/components/ListCells/DateTimeCell';
import type { FaraRecord } from '@/services/api/crudTypes';

export function ViewListEstimates() {
  return (
    <List<FaraRecord> model="estimate" order="desc" sort="id">
      <Field name="id" label="ID" />
      <Field name="name" label="Номер" />
      <Field
        name="lead_id"
        label="Лид"
        render={value => <RelationCell value={value} model="leads" />}
      />
      <Field
        name="source_template_id"
        label="Шаблон"
        render={value => <RelationCell value={value} model="project_template" />}
      />
      <Field name="status" label="Статус" />
      <Field
        name="date_created"
        label="Дата"
        render={value => <DateTimeCell value={value} format="compact" />}
      />
    </List>
  );
}
