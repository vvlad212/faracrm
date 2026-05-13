import { Form } from '@/components/Form/Form';
import { Field } from '@/components/List/Field';
import { ViewFormProps } from '@/route/type';
import { FormSection, FormRow } from '@/components/Form/Layout';
import { IconCalculator } from '@tabler/icons-react';
import type { FaraRecord } from '@/services/api/crudTypes';
import { useParams, useLocation } from 'react-router-dom';
import { useCallback } from 'react';
import { EstimateTotals } from './EstimateTotals';
import { EstimateLines } from './EstimateLines';
import { AddLineModal } from './AddLineModal';

export function ViewFormEstimate(props: ViewFormProps) {
  const { id } = useParams<{ id: string }>();
  const { pathname } = useLocation();
  const isCreate = props.isCreateForm || !id || pathname.includes('/create');
  const numericId = id ? Number(id) : 0;

  const handleLineAdded = useCallback(() => {
    window.location.reload();
  }, []);

  const estimateActions = !isCreate && numericId ? (
    <AddLineModal
      estimateId={numericId}
      onLineAdded={handleLineAdded}
    />
  ) : undefined;

  return (
    <Form<FaraRecord>
      model="estimate"
      {...props}
      footer={
        !isCreate && numericId ? (
          <>
            <EstimateLines estimateId={numericId} />
            <EstimateTotals />
          </>
        ) : undefined
      }
      actions={estimateActions}
    >
      <FormSection title="Расчёт" icon={<IconCalculator size={18} />}>
        <FormRow cols={2}>
          <Field name="name" label="Номер" />
          <Field name="status" label="Статус" />
        </FormRow>
        <FormRow cols={2}>
          <Field name="lead_id" label="Лид" />
          <Field name="source_template_id" label="Типовой проект" />
        </FormRow>
        <Field name="date_created" label="Дата создания" />
      </FormSection>

      <Field name="notes" label="Заметки" />
    </Form>
  );
}
