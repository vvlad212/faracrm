import { Form } from '@/components/Form/Form';
import { Field } from '@/components/List/Field';
import { ViewFormProps } from '@/route/type';
import { FormSection, FormRow } from '@/components/Form/Layout';
import {
  IconPackage,
  IconCurrencyRubel,
} from '@tabler/icons-react';
import type { FaraRecord } from '@/services/api/crudTypes';

export function ViewFormComponent(props: ViewFormProps) {
  return (
    <Form<FaraRecord> model="component" {...props}>
      <FormSection title="Компонент" icon={<IconPackage size={18} />}>
        <FormRow cols={2}>
          <Field name="name" label="Название" />
          <Field name="category_id" label="Категория" />
        </FormRow>
        <Field name="uom_id" label="Единица измерения" />
      </FormSection>

      <FormSection title="Цены" icon={<IconCurrencyRubel size={18} />}>
        <FormRow cols={2}>
          <Field name="cost_price" label="Себестоимость" />
          <Field name="list_price" label="Продажная цена" />
        </FormRow>
      </FormSection>

      <Field name="description" label="Заметка / поставщик" />
    </Form>
  );
}

export function ViewFormComponentCategory(props: ViewFormProps) {
  return (
    <Form<FaraRecord> model="component_category" {...props}>
      <FormSection title="Категория">
        <FormRow cols={2}>
          <Field name="name" label="Название" />
          <Field name="sequence" label="Порядок сортировки" />
        </FormRow>
        <Field name="active" label="Активна" hidden />
      </FormSection>
    </Form>
  );
}
