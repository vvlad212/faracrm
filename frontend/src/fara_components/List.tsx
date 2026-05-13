import { Field } from '@/components/List/Field';
import { List } from '@/components/List/List';
import RelationCell from '@/components/ListCells/RelationCell';
import type { FaraRecord } from '@/services/api/crudTypes';

export function ViewListComponents() {
  return (
    <List<FaraRecord> model="component" order="asc" sort="category_id">
      <Field name="id" label="ID" />
      <Field name="name" label="Название" />
      <Field
        name="category_id"
        label="Категория"
        render={value => <RelationCell value={value} model="component_category" />}
      />
      <Field
        name="uom_id"
        label="Ед. изм."
        render={value => <RelationCell value={value} model="uom" />}
      />
      <Field name="cost_price" label="Себестоимость" />
      <Field name="list_price" label="Продажная цена" />
    </List>
  );
}

export function ViewListComponentCategories() {
  return (
    <List<FaraRecord> model="component_category" order="asc" sort="sequence">
      <Field name="id" label="ID" />
      <Field name="name" label="Название" />
      <Field name="sequence" label="Порядок" />
    </List>
  );
}
