import {
  Box,
  Group,
  Text,
  Button,
  ActionIcon,
  Tooltip,
  Paper,
  ScrollArea,
  Checkbox,
} from '@mantine/core';
import {
  IconTrash,
  IconTrashX,
  IconPackage,
} from '@tabler/icons-react';
import { useState, useEffect, useMemo } from 'react';
import {
  useSearchQuery,
  useDeleteBulkMutation,
  useClearEstimateLinesMutation,
} from '@/services/api/crudApi';
import {
  DataTable,
  DataTableSortStatus,
} from 'mantine-datatable';

interface EstimateLine {
  id: number;
  name: string;
  category_name?: string;
  uom_name?: string;
  quantity: number;
  cost_price: number;
  sale_price: number;
  is_included: boolean;
}

interface EstimateLinesProps {
  estimateId: number;
}

const PAGE_SIZES = [10, 20, 40, 100];

export function EstimateLines({ estimateId }: EstimateLinesProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[1]);
  const [selectedRecords, setSelectedRecords] = useState<EstimateLine[]>([]);
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<EstimateLine>>({
    columnAccessor: 'sequence',
    direction: 'asc',
  });

  const [deleteBulk, { isLoading: isDeleting }] = useDeleteBulkMutation();
  const [clearLines, { isLoading: isClearing }] = useClearEstimateLinesMutation();

  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [pageSize]);

  const { data, isFetching } = useSearchQuery({
    model: 'estimate_line',
    fields: [
      'id', 'name', 'category_name', 'uom_name',
      'quantity', 'cost_price', 'sale_price', 'is_included', 'sequence',
    ],
    filter: [['estimate_id', '=', estimateId]],
    sort: sortStatus.columnAccessor as string,
    order: sortStatus.direction,
    start: (page - 1) * pageSize,
    end: (page - 1) * pageSize + pageSize,
    limit: pageSize,
  });

  const records: EstimateLine[] = (data?.data as EstimateLine[]) || [];
  const total = data?.total || 0;

  const handleDeleteSelected = async () => {
    const ids = selectedRecords.map(r => r.id);
    if (!ids.length) return;
    await deleteBulk({ model: 'estimate_line', ids });
    setSelectedRecords([]);
    window.location.reload();
  };

  const handleClearAll = async () => {
    await clearLines({ estimateId });
    setSelectedRecords([]);
    window.location.reload();
  };

  const columns = useMemo(() => [
    {
      accessor: 'name',
      title: 'Название',
      sortable: true,
    },
    {
      accessor: 'category_name',
      title: 'Категория',
      sortable: true,
    },
    {
      accessor: 'uom_name',
      title: 'Ед.изм.',
      width: 80,
    },
    {
      accessor: 'quantity',
      title: 'Кол-во',
      width: 80,
      sortable: true,
      render: (r: EstimateLine) => r.quantity,
    },
    {
      accessor: 'cost_price',
      title: 'Себест.',
      width: 100,
      sortable: true,
      render: (r: EstimateLine) =>
        r.cost_price?.toLocaleString('ru-RU') + ' ₽',
    },
    {
      accessor: 'sale_price',
      title: 'Цена',
      width: 100,
      sortable: true,
      render: (r: EstimateLine) =>
        r.sale_price?.toLocaleString('ru-RU') + ' ₽',
    },
    {
      accessor: 'is_included',
      title: 'Вкл.',
      width: 60,
      render: (r: EstimateLine) => (
        <Checkbox checked={r.is_included} readOnly size="xs" />
      ),
    },
  ], []);

  return (
    <Box mx="md" mb="md">
      <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
        {/* Header */}
        <Group justify="space-between" p="xs" bg="gray.0">
          <Group gap="xs">
            <IconPackage size={16} />
            <Text size="sm" fw={600}>Позиции расчёта</Text>
            {total > 0 && (
              <Text size="xs" c="dimmed">({total})</Text>
            )}
          </Group>
          <Group gap="xs">
            {selectedRecords.length > 0 && (
              <Button
                size="xs"
                variant="light"
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={handleDeleteSelected}
                loading={isDeleting}
              >
                Удалить ({selectedRecords.length})
              </Button>
            )}
            {total > 0 && (
              <Tooltip label="Удалить все позиции">
                <ActionIcon
                  size="sm"
                  variant="subtle"
                  color="red"
                  onClick={handleClearAll}
                  loading={isClearing}
                >
                  <IconTrashX size={16} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>
        </Group>

        {/* Table */}
        {total === 0 && !isFetching ? (
          <Box p="xl" style={{ textAlign: 'center' }}>
            <Text size="sm" c="dimmed">Нет позиций</Text>
          </Box>
        ) : (
          <DataTable
            minHeight={100}
            withTableBorder={false}
            borderRadius={0}
            highlightOnHover
            fetching={isFetching}
            records={records}
            columns={columns}
            selectedRecords={selectedRecords}
            onSelectedRecordsChange={setSelectedRecords}
            totalRecords={total}
            recordsPerPage={pageSize}
            page={page}
            onPageChange={setPage}
            recordsPerPageOptions={PAGE_SIZES}
            onRecordsPerPageChange={setPageSize}
            paginationText={({ from, to, totalRecords }) =>
              `${from}–${to} из ${totalRecords}`
            }
            sortStatus={sortStatus}
            onSortStatusChange={setSortStatus}
            styles={{
              header: {
                backgroundColor: 'var(--mantine-color-gray-0)',
              },
            }}
          />
        )}
      </Paper>
    </Box>
  );
}
