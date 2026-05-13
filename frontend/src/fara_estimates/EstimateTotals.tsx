import { Paper, Group, Text, Stack, Divider } from '@mantine/core';
import { IconReceipt } from '@tabler/icons-react';
import { useSearchQuery } from '@/services/api/crudApi';
import { useParams } from 'react-router-dom';

interface EstimateLine {
  quantity?: number;
  cost_price?: number;
  sale_price?: number;
  is_included?: boolean;
}

export function EstimateTotals() {
  const { id } = useParams<{ id: string }>();
  const numericId = id ? Number(id) : 0;

  const { data } = useSearchQuery(
    {
      model: 'estimate_line',
      fields: ['id', 'quantity', 'cost_price', 'sale_price', 'is_included'],
      filter: [['estimate_id', '=', numericId]],
      limit: 1000,
    },
    { skip: !numericId },
  );

  const lines: EstimateLine[] = (data?.data as EstimateLine[]) || [];

  let totalCost = 0;
  let totalSale = 0;

  for (const line of lines) {
    if (!line.is_included) continue;
    const qty = line.quantity || 0;
    totalCost += qty * (line.cost_price || 0);
    totalSale += qty * (line.sale_price || 0);
  }

  const margin = totalSale - totalCost;
  const marginPercent = totalSale > 0 ? ((totalSale - totalCost) / totalSale) * 100 : 0;

  const fmt = (n: number) =>
    n.toLocaleString('ru-RU', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  if (!lines.length) return null;

  return (
    <Paper p="md" mx="md" mb="md" radius="md" withBorder>
      <Group gap="xs" mb="sm">
        <IconReceipt size={18} />
        <Text fw={600} size="sm">Итого</Text>
      </Group>
      <Group grow>
        <Stack gap={2} align="center">
          <Text size="xs" c="dimmed">Для клиента</Text>
          <Text fw={700} size="lg">{fmt(totalSale)} ₽</Text>
        </Stack>
        <Divider orientation="vertical" />
        <Stack gap={2} align="center">
          <Text size="xs" c="dimmed">Себестоимость</Text>
          <Text fw={600} size="md" c="dimmed">{fmt(totalCost)} ₽</Text>
        </Stack>
        <Divider orientation="vertical" />
        <Stack gap={2} align="center">
          <Text size="xs" c="dimmed">Маржа</Text>
          <Text
            fw={600}
            size="md"
            c={margin >= 0 ? 'teal' : 'red'}
          >
            {fmt(margin)} ₽ ({marginPercent.toFixed(1)}%)
          </Text>
        </Stack>
      </Group>
    </Paper>
  );
}
