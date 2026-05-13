import { Form } from '@/components/Form/Form';
import { Field } from '@/components/List/Field';
import { ViewFormProps } from '@/route/type';
import { FormSection, FormRow } from '@/components/Form/Layout';
import { IconPackage } from '@tabler/icons-react';
import type { FaraRecord } from '@/services/api/crudTypes';

export function ViewFormProjectTemplateLine(props: ViewFormProps) {
  return (
    <Form<FaraRecord> model="project_template_line" {...props}>
      <FormSection title="Позиция шаблона" icon={<IconPackage size={18} />}>
        <Field name="component_id" label="Компонент" />
        <FormRow cols={2}>
          <Field name="quantity" label="Количество" />
          <Field name="sequence" label="Порядок" />
        </FormRow>
      </FormSection>
    </Form>
  );
}
