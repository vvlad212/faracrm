import {
  Modal,
  TextInput,
  NumberInput,
  Button,
  Group,
  Stack,
  Text,
  Paper,
  Tabs,
  ScrollArea,
  UnstyledButton,
  Highlight,
  Loader,
  Center,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
  IconSearch,
  IconPlus,
  IconPackage,
  IconPencilPlus,
} from '@tabler/icons-react';
import { useState, useMemo } from 'react';
import { useSearchQuery, useCreateMutation } from '@/services/api/crudApi';
import type { FaraRecord } from '@/services/api/crudTypes';

interface ComponentRecord extends FaraRecord {
  name: string;
  category_id?: { id: number; name: string } | null;
  uom_id?: { id: number; name: string } | null;
  cost_price: number;
  list_price: number;
}

interface AddLineModalProps {
  estimateId: number;
  onLineAdded: () => void;
}

export function AddLineModal({ estimateId, onLineAdded }: AddLineModalProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Button
        size="xs"
        variant="light"
        leftSection={<IconPlus size={14} />}
        onClick={open}
      >
        Добавить позицию
      </Button>
      <Modal
        opened={opened}
        onClose={close}
        title="Добавить позицию в расчёт"
        centered
        size="lg"
      >
        <AddLineContent
          estimateId={estimateId}
          onDone={() => {
            onLineAdded();
            close();
          }}
        />
      </Modal>
    </>
  );
}

function AddLineContent({
  estimateId,
  onDone,
}: {
  estimateId: number;
  onDone: () => void;
}) {
  const [tab, setTab] = useState<string | null>('search');

  return (
    <Tabs value={tab} onChange={setTab}>
      <Tabs.List mb="md">
        <Tabs.Tab value="search" leftSection={<IconSearch size={14} />}>
          Из склада
        </Tabs.Tab>
        <Tabs.Tab value="manual" leftSection={<IconPencilPlus size={14} />}>
          Новый компонент
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="search">
        <SearchTab estimateId={estimateId} onDone={onDone} />
      </Tabs.Panel>

      <Tabs.Panel value="manual">
        <ManualTab estimateId={estimateId} onDone={onDone} />
      </Tabs.Panel>
    </Tabs>
  );
}

/** Вкладка: поиск и выбор из склада */
function SearchTab({
  estimateId,
  onDone,
}: {
  estimateId: number;
  onDone: () => void;
}) {
  const [search, setSearch] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [selected, setSelected] = useState<ComponentRecord | null>(null);
  const [createLine, { isLoading: isCreating }] = useCreateMutation();

  const filter = useMemo(() => {
    const f: any[] = [['active', '=', true]];
    if (search.trim()) {
      f.push(['name', 'ilike', `%${search.trim()}%`]);
    }
    return f;
  }, [search]);

  const { data, isFetching } = useSearchQuery({
    model: 'component',
    fields: [
      'id',
      'name',
      'category_id',
      'uom_id',
      'cost_price',
      'list_price',
    ],
    filter,
    sort: 'name',
    order: 'asc',
    limit: 50,
  });

  const components: ComponentRecord[] = (data?.data as ComponentRecord[]) || [];

  const handleAdd = async () => {
    if (!selected) return;

    const catName =
      selected.category_id && typeof selected.category_id === 'object'
        ? selected.category_id.name
        : null;
    const uomName =
      selected.uom_id && typeof selected.uom_id === 'object'
        ? selected.uom_id.name
        : null;

    await createLine({
      model: 'estimate_line',
      values: {
        estimate_id: estimateId,
        component_id:
          typeof selected.id === 'object'
            ? (selected.id as any).id
            : selected.id,
        name: selected.name,
        category_name: catName,
        uom_name: uomName,
        quantity,
        cost_price: selected.cost_price || 0,
        sale_price: selected.list_price || 0,
        is_included: true,
        is_manual: false,
      },
    });
    onDone();
  };

  return (
    <Stack gap="sm">
      <TextInput
        placeholder="Поиск по названию..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={e => setSearch(e.currentTarget.value)}
        autoFocus
      />

      <ScrollArea h={250} offsetScrollbars>
        {isFetching ? (
          <Center py="xl">
            <Loader size="sm" />
          </Center>
        ) : components.length === 0 ? (
          <Center py="xl">
            <Text size="sm" c="dimmed">
              {search ? 'Ничего не найдено' : 'Нет компонентов на складе'}
            </Text>
          </Center>
        ) : (
          <Stack gap={4}>
            {components.map(comp => {
              const isSelected = selected?.id === comp.id;
              const catName =
                comp.category_id && typeof comp.category_id === 'object'
                  ? comp.category_id.name
                  : '';
              const uomName =
                comp.uom_id && typeof comp.uom_id === 'object'
                  ? comp.uom_id.name
                  : '';

              return (
                <UnstyledButton
                  key={comp.id as number}
                  onClick={() => setSelected(comp)}
                >
                  <Paper
                    p="xs"
                    withBorder
                    style={{
                      borderColor: isSelected
                        ? 'var(--mantine-color-blue-5)'
                        : undefined,
                      backgroundColor: isSelected
                        ? 'var(--mantine-color-blue-0)'
                        : undefined,
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <div>
                        <Highlight highlight={search} size="sm" fw={500}>
                          {comp.name}
                        </Highlight>
                        <Text size="xs" c="dimmed">
                          {[catName, uomName].filter(Boolean).join(' · ')}
                        </Text>
                      </div>
                      <Text size="sm" fw={500} style={{ whiteSpace: 'nowrap' }}>
                        {comp.list_price?.toLocaleString('ru-RU')} ₽
                      </Text>
                    </Group>
                  </Paper>
                </UnstyledButton>
              );
            })}
          </Stack>
        )}
      </ScrollArea>

      {selected && (
        <Paper p="sm" withBorder bg="gray.0" radius="md">
          <Group justify="space-between" align="flex-end">
            <div>
              <Text size="xs" c="dimmed">
                Выбрано
              </Text>
              <Text size="sm" fw={600}>
                <IconPackage
                  size={14}
                  style={{ verticalAlign: 'middle', marginRight: 4 }}
                />
                {selected.name}
              </Text>
            </div>
            <NumberInput
              label="Кол-во"
              value={quantity}
              onChange={v => setQuantity(Number(v) || 1)}
              min={0.01}
              step={1}
              decimalScale={2}
              w={100}
              size="xs"
            />
          </Group>
        </Paper>
      )}

      <Group justify="flex-end">
        <Button
          onClick={handleAdd}
          disabled={!selected}
          loading={isCreating}
          leftSection={<IconPlus size={14} />}
        >
          Добавить
        </Button>
      </Group>
    </Stack>
  );
}

/** Вкладка: создать новый компонент и сразу добавить в расчёт */
function ManualTab({
  estimateId,
  onDone,
}: {
  estimateId: number;
  onDone: () => void;
}) {
  const [name, setName] = useState('');
  const [costPrice, setCostPrice] = useState<number>(0);
  const [salePrice, setSalePrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(1);
  const [uom, setUom] = useState('шт');

  const [createComponent] = useCreateMutation();
  const [createLine, { isLoading }] = useCreateMutation();

  const handleCreate = async () => {
    if (!name.trim()) return;

    // 1. Создаём компонент на складе
    const { data: compData } = await createComponent({
      model: 'component',
      values: {
        name: name.trim(),
        cost_price: costPrice,
        list_price: salePrice,
      },
    });

    if (!compData?.id) return;

    // 2. Создаём позицию расчёта
    await createLine({
      model: 'estimate_line',
      values: {
        estimate_id: estimateId,
        component_id: compData.id,
        name: name.trim(),
        uom_name: uom || null,
        quantity,
        cost_price: costPrice,
        sale_price: salePrice,
        is_included: true,
        is_manual: true,
      },
    });

    onDone();
  };

  return (
    <Stack gap="sm">
      <TextInput
        label="Название"
        placeholder="Название компонента"
        value={name}
        onChange={e => setName(e.currentTarget.value)}
        required
        autoFocus
      />
      <Group grow>
        <NumberInput
          label="Себестоимость"
          value={costPrice}
          onChange={v => setCostPrice(Number(v) || 0)}
          min={0}
          decimalScale={2}
          suffix=" ₽"
        />
        <NumberInput
          label="Цена продажи"
          value={salePrice}
          onChange={v => setSalePrice(Number(v) || 0)}
          min={0}
          decimalScale={2}
          suffix=" ₽"
        />
      </Group>
      <Group grow>
        <NumberInput
          label="Количество"
          value={quantity}
          onChange={v => setQuantity(Number(v) || 1)}
          min={0.01}
          step={1}
          decimalScale={2}
        />
        <TextInput
          label="Ед. измерения"
          placeholder="шт, м², м³..."
          value={uom}
          onChange={e => setUom(e.currentTarget.value)}
        />
      </Group>

      <Group justify="flex-end" mt="sm">
        <Button
          onClick={handleCreate}
          disabled={!name.trim()}
          loading={isLoading}
          leftSection={<IconPlus size={14} />}
        >
          Создать и добавить
        </Button>
      </Group>
    </Stack>
  );
}
