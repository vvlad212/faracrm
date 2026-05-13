import { Field } from '@/components/List/Field';
import { List } from '@/components/List/List';
import type { FaraRecord } from '@/services/api/crudTypes';

export function ViewListProjectTemplates() {
  return (
    <List<FaraRecord> model="project_template" order="asc" sort="id">
      <Field name="id" label="ID" />
      <Field name="name" label="Название" />
      <Field name="dimensions" label="Габариты" />
      <Field name="description" label="Описание" />
    </List>
  );
}
