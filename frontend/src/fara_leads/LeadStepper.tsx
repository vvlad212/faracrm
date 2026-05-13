import { useMemo, useState } from 'react';
import { Stepper, Box } from '@mantine/core';
import {
  IconCheck,
  IconCircleDot,
  IconCircle,
} from '@tabler/icons-react';
import { useSearchQuery, useUpdateMutation } from '@/services/api/crudApi';
import { FaraRecord, GetListParams, GetListResult } from '@/services/api/crudTypes';
import { useParams } from 'react-router-dom';
import {
  BaseQueryFn,
  TypedUseQueryHookResult,
} from '@reduxjs/toolkit/query/react';

export function LeadStepper() {
  const { id } = useParams<{ id: string }>();
  const [updateRecord] = useUpdateMutation();
  const [optimisticStageId, setOptimisticStageId] = useState<number | null>(null);

  // Загружаем все активные стадии
  const { data: stagesData } = useSearchQuery({
    model: 'lead_stage',
    fields: ['id', 'name', 'sequence', 'color', 'fold'],
    limit: 100,
    order: 'asc',
    sort: 'sequence',
    filter: [['active', '=', true]],
  }) as TypedUseQueryHookResult<GetListResult<FaraRecord>, GetListParams, BaseQueryFn>;

  // Читаем stage_id лида через search (работает надёжно)
  const { data: leadData } = useSearchQuery(
    {
      model: 'leads',
      fields: ['id', 'stage_id'],
      filter: [['id', '=', Number(id)]],
      limit: 1,
    },
    { skip: !id },
  ) as TypedUseQueryHookResult<GetListResult<FaraRecord>, GetListParams, BaseQueryFn>;

  const stages = stagesData?.data || [];
  const leadRecord = leadData?.data?.[0];
  const serverStageId = leadRecord?.stage_id && typeof leadRecord.stage_id === 'object'
    ? (leadRecord.stage_id as any).id
    : leadRecord?.stage_id;
  const currentStageId = optimisticStageId || serverStageId;

  const activeStepIndex = useMemo(() => {
    if (!currentStageId || !stages.length) return -1;
    return stages.findIndex(s => s.id === currentStageId);
  }, [currentStageId, stages]);

  const handleStepClick = async (stepIndex: number) => {
    const targetStage = stages[stepIndex];
    if (!targetStage || !id || targetStage.id === currentStageId) return;

    setOptimisticStageId(Number(targetStage.id));

    await updateRecord({
      model: 'leads',
      id: Number(id),
      values: { stage_id: Number(targetStage.id) },
    });

    setOptimisticStageId(null);
  };

  if (!stages.length) return null;

  return (
    <Box px="md" py="sm">
      <Stepper
        active={activeStepIndex}
        onStepClick={handleStepClick}
        size="sm"
        styles={{
          step: { cursor: 'pointer' },
          stepIcon: { cursor: 'pointer' },
          stepLabel: { cursor: 'pointer', fontSize: 'var(--mantine-font-size-xs)' },
        }}
      >
        {stages.map((stage, index) => {
          const isCurrent = index === activeStepIndex;
          const color = (stage.color as string) || '#3498db';

          return (
            <Stepper.Step
              key={stage.id}
              label={stage.name as string}
              color={color}
              completedIcon={<IconCheck size={14} />}
              icon={isCurrent ? <IconCircleDot size={14} /> : <IconCircle size={14} />}
              allowStepSelect
            />
          );
        })}
      </Stepper>
    </Box>
  );
}
