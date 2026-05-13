import { useState } from 'react';
import {
  Timeline,
  Text,
  Badge,
  Group,
  Stack,
  Button,
  Box,
  Loader,
} from '@mantine/core';
import {
  IconPlus,
  IconArrowRight,
  IconCalendar,
  IconUser,
  IconNote,
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useSearchQuery } from '@/services/api/crudApi';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectCurrentSession } from '@/slices/authSlice';
import { CreateActivityForm } from '@/components/Form/Panels/ActivityPanel';

const STATE_COLORS: Record<string, string> = {
  planned: 'blue',
  today: 'orange',
  overdue: 'red',
  done: 'green',
  cancelled: 'gray',
};

const PAGE_SIZE = 50;

export function LeadTimeline() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(['activity', 'common']);
  const session = useSelector(selectCurrentSession);
  const currentUserId = session?.user_id?.id;
  const resId = Number(id);

  const [showCreate, setShowCreate] = useState(false);
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Загружаем ВСЕ активности (включая done/inactive) для полной истории
  const { data: activitiesData, isLoading } = useSearchQuery(
    {
      model: 'activity',
      fields: [
        'id',
        'summary',
        'note',
        'activity_type_id',
        'user_id',
        'date_deadline',
        'state',
        'done',
        'create_datetime',
      ],
      filter: [
        ['res_model', '=', 'leads'],
        ['res_id', '=', resId],
      ],
      sort: 'create_datetime',
      order: 'desc',
      limit,
    },
    { skip: !resId },
  );

  const activities = activitiesData?.data || [];
  const total = activitiesData?.total || 0;
  const hasMore = total > activities.length;

  if (!resId) return null;

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: undefined,
    }) + ' ' + date.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isStageChange = (activity: any) => {
    const typeName = activity.activity_type_id?.name || '';
    return typeName === 'Смена стадии' || typeName === 'Stage Change';
  };

  return (
    <Box px="md" py="sm">
      <Group justify="space-between" mb="sm">
        <Text size="sm" fw={600} c="dimmed">
          История
        </Text>
        {!showCreate && (
          <Button
            variant="light"
            size="compact-xs"
            leftSection={<IconPlus size={12} />}
            onClick={() => setShowCreate(true)}
          >
            Добавить событие
          </Button>
        )}
      </Group>

      {showCreate && (
        <Box mb="sm">
          <CreateActivityForm
            resModel="leads"
            resId={resId}
            currentUserId={currentUserId}
            onClose={() => setShowCreate(false)}
          />
        </Box>
      )}

      {isLoading && activities.length === 0 && (
        <Stack align="center" py="md">
          <Loader size="sm" />
        </Stack>
      )}

      {!isLoading && activities.length === 0 && !showCreate && (
        <Text size="sm" c="dimmed" ta="center" py="md">
          Нет событий
        </Text>
      )}

      {activities.length > 0 && (
        <Timeline active={-1} bulletSize={24} lineWidth={2}>
          {activities.map((activity: any) => {
            const stageChange = isStageChange(activity);
            const stateColor = STATE_COLORS[activity.state] || 'gray';
            const typeName = activity.activity_type_id?.name || '';
            const userName = activity.user_id?.name || '';
            const dateStr = activity.create_datetime || activity.date_deadline || '';

            return (
              <Timeline.Item
                key={activity.id}
                bullet={
                  stageChange ? (
                    <IconArrowRight size={12} />
                  ) : (
                    <IconNote size={12} />
                  )
                }
                color={stageChange ? 'blue' : stateColor}
              >
                <Group gap="xs" wrap="nowrap">
                  <Text size="xs" c="dimmed">
                    {formatDate(dateStr)}
                  </Text>
                  {!stageChange && typeName && (
                    <Badge size="xs" color={stateColor} variant="light">
                      {typeName}
                    </Badge>
                  )}
                </Group>

                {activity.summary && (
                  <Text size="sm" fw={stageChange ? 600 : 400} mt={2}>
                    {stageChange ? `Стадия: ${activity.summary}` : activity.summary}
                  </Text>
                )}

                {userName && (
                  <Group gap={4} mt={2}>
                    <IconUser size={11} color="var(--mantine-color-dimmed)" />
                    <Text size="xs" c="dimmed">
                      {userName}
                    </Text>
                  </Group>
                )}
              </Timeline.Item>
            );
          })}
        </Timeline>
      )}

      {hasMore && (
        <Button
          variant="subtle"
          size="compact-xs"
          onClick={() => setLimit(prev => prev + PAGE_SIZE)}
          loading={isLoading}
          fullWidth
          mt="xs"
        >
          Загрузить ещё ({total - activities.length})
        </Button>
      )}
    </Box>
  );
}
