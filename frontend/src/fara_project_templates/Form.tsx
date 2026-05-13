import { Form } from '@/components/Form/Form';
import { Field } from '@/components/List/Field';
import { ViewFormProps } from '@/route/type';
import { FormSection, FormRow } from '@/components/Form/Layout';
import { IconTemplate } from '@tabler/icons-react';
import type { FaraRecord } from '@/services/api/crudTypes';

export function ViewFormProjectTemplate(props: ViewFormProps) {
  return (
    <Form<FaraRecord> model="project_template" {...props}>
      <FormSection title="Типовой проект" icon={<IconTemplate size={18} />}>
        <FormRow cols={2}>
          <Field name="name" label="Название" />
          <Field name="dimensions" label="Габариты" />
        </FormRow>
        <Field name="description" label="Описание" />
      </FormSection>

      {/* Позиции шаблона */}
      <Field
        name="line_ids"
        label="Позиции"
        displayField="component_id"
        showCreate={true}
        showSelect={false}
        inline_create={false}
        inline_update={false}
      >
        <Field name="id" label="ID" />
        <Field name="component_id" label="Компонент" />
        <Field name="quantity" label="Количество" />
        <Field name="sequence" label="Порядок" />
      </Field>
    </Form>
  );
}
