'use client';

import {
  type Dispatch,
  type KeyboardEvent,
  type SetStateAction,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import {
  type ColumnDef,
  type SortingState,
  type Table as TableInstance,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Filter, MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { type Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  testInputSchema,
  updateTestInputSchema,
  validationStatusSchema,
  type TaxonomyResponse,
  type TestDto,
} from '@/lib/validation/tests';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    label?: string;
  }
}

type EditingColumnId = 'name' | 'status' | 'tags' | 'domainTheme';

type EditingCell = { rowId: string; columnId: EditingColumnId } | null;

type DraftDomainTheme = {
  domains: string;
  themes: string;
};

type TestDataGridProps = {
  locale: Locale;
};

type TestsApiResponse = { tests: TestDto[] };

type UpdateOverrides = Partial<
  Pick<TestDto, 'name' | 'status' | 'tags' | 'domains' | 'themes'>
>;

type ColumnBuilderParams = {
  locale: Locale;
  t: ReturnType<typeof useTranslations>;
  statusT: ReturnType<typeof useTranslations>;
  onBeginEdit: (test: TestDto, columnId: EditingColumnId) => void;
  onSaveEdit: (test: TestDto, columnId: EditingColumnId) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    test: TestDto,
    columnId: EditingColumnId,
  ) => void;
  draftValue: string;
  draftDomainTheme: DraftDomainTheme;
  setDraftValue: (value: string) => void;
  setDraftDomainTheme: Dispatch<SetStateAction<DraftDomainTheme>>;
  editingCell: EditingCell;
  statusOptions: TestDto['status'][];
  onDuplicate: (test: TestDto) => void;
  onDelete: (test: TestDto) => void;
};

const pageSizeOptions = [20, 50];
const statusOptions = validationStatusSchema.options;
const statusBadgeVariants = {
  draft: 'secondary',
  in_review: 'warning',
  published: 'success',
  archived: 'outline',
} as const;

function buildCsv(values: string[]) {
  return values.join(', ');
}

function parseCsv(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed right-4 top-4 z-50 animate-in slide-in-from-top-2 rounded-xl border border-emerald-400/40 bg-slate-950 px-4 py-3 text-emerald-100 shadow-lg shadow-black/40 fade-in duration-300">
      <div className="flex items-center gap-2">
        <span className="text-xl">✓</span>
        <p className="text-sm font-semibold">{message}</p>
      </div>
    </div>
  );
}

function buildColumns({
  locale,
  t,
  statusT,
  onBeginEdit,
  onSaveEdit,
  onKeyDown,
  draftValue,
  draftDomainTheme,
  setDraftValue,
  setDraftDomainTheme,
  editingCell,
  statusOptions,
  onDuplicate,
  onDelete,
}: ColumnBuilderParams): ColumnDef<TestDto>[] {
  return [
    {
      id: 'select',
      enableHiding: false,
      header: ({ table }) => (
        <Input
          aria-label={t('columns.select')}
          type="checkbox"
          className="h-4 w-4 rounded border border-white/10 bg-transparent text-emerald-400 accent-emerald-400"
          checked={table.getIsAllPageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
        />
      ),
      cell: ({ row }) => (
        <Input
          aria-label={t('columns.selectRow')}
          type="checkbox"
          className="h-4 w-4 rounded border border-white/10 bg-transparent text-emerald-400 accent-emerald-400"
          checked={row.getIsSelected()}
          disabled={!row.getCanSelect()}
          onChange={row.getToggleSelectedHandler()}
        />
      ),
    },
    {
      accessorKey: 'name',
      enableSorting: true,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.title')} />,
      meta: { label: t('columns.title') },
      enableGlobalFilter: true,
      cell: ({ row }) => {
        const test = row.original;
        const isEditing = editingCell?.rowId === test.id && editingCell.columnId === 'name';

        if (isEditing) {
          return (
            <Input
              autoFocus
              className="h-8 w-full"
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onBlur={() => onSaveEdit(test, 'name')}
              onKeyDown={(event) => onKeyDown(event, test, 'name')}
            />
          );
        }

        return (
          <div
            className="flex flex-col gap-1"
            onClick={() => onBeginEdit(test, 'name')}
            onDoubleClick={() => onBeginEdit(test, 'name')}
          >
            <Link
              className="text-sm font-medium text-slate-100 hover:underline"
              href={{ pathname: '/administration/tests/edit/[id]', params: { id: test.id } }}
            >
              {test.name}
            </Link>
            <span className="text-xs font-mono text-muted-foreground">{test.slug}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.status')} />,
      meta: { label: t('columns.status') },
      filterFn: (row, columnId, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) {
          return true;
        }
        const value = row.getValue(columnId) as string | undefined;
        return value ? filterValue.includes(value) : false;
      },
      enableGlobalFilter: true,
      cell: ({ row }) => {
        const test = row.original;
        const isEditing = editingCell?.rowId === test.id && editingCell.columnId === 'status';

        if (isEditing) {
          return (
            <Select
              autoFocus
              className="h-8 w-full"
              value={draftValue}
              onChange={(event) => setDraftValue(event.target.value)}
              onBlur={() => onSaveEdit(test, 'status')}
              onKeyDown={(event) => onKeyDown(event, test, 'status')}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusT(status)}
                </option>
              ))}
            </Select>
          );
        }

        return (
          <button
            type="button"
            className="inline-flex items-center"
            onClick={() => onBeginEdit(test, 'status')}
            onDoubleClick={() => onBeginEdit(test, 'status')}
          >
            <Badge variant={statusBadgeVariants[test.status]}>{statusT(test.status)}</Badge>
          </button>
        );
      },
    },
    {
      accessorFn: (row) => [...row.domains, ...row.themes],
      id: 'domainTheme',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('columns.domainTheme')} />
      ),
      meta: { label: t('columns.domainTheme') },
      filterFn: (row, columnId, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) {
          return true;
        }
        const raw = row.getValue(columnId) as string[] | undefined;
        return (raw ?? []).some((value) => filterValue.includes(value));
      },
      enableGlobalFilter: true,
      cell: ({ row }) => {
        const test = row.original;
        const isEditing = editingCell?.rowId === test.id && editingCell.columnId === 'domainTheme';

        if (isEditing) {
          return (
            <div
              className="flex flex-col gap-2"
              onBlur={(event) => {
                const nextTarget = event.relatedTarget as Node | null;
                if (nextTarget && event.currentTarget.contains(nextTarget)) {
                  return;
                }
                onSaveEdit(test, 'domainTheme');
              }}
            >
              <Input
                autoFocus
                className="h-8"
                value={draftDomainTheme.domains}
                placeholder={t('placeholders.domains')}
                onChange={(event) =>
                  setDraftDomainTheme((prev) => ({ ...prev, domains: event.target.value }))
                }
                onKeyDown={(event) => onKeyDown(event, test, 'domainTheme')}
              />
              <Input
                className="h-8"
                value={draftDomainTheme.themes}
                placeholder={t('placeholders.themes')}
                onChange={(event) =>
                  setDraftDomainTheme((prev) => ({ ...prev, themes: event.target.value }))
                }
                onKeyDown={(event) => onKeyDown(event, test, 'domainTheme')}
              />
            </div>
          );
        }

        return (
          <div
            className="text-sm"
            onClick={() => onBeginEdit(test, 'domainTheme')}
            onDoubleClick={() => onBeginEdit(test, 'domainTheme')}
          >
            <div className="text-muted-foreground">
              <span className="font-medium text-slate-200">{t('labels.domains')}:</span>{' '}
              {test.domains.length > 0 ? test.domains.join(', ') : t('empty')}
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-slate-200">{t('labels.themes')}:</span>{' '}
              {test.themes.length > 0 ? test.themes.join(', ') : t('empty')}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'tags',
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.tags')} />,
      meta: { label: t('columns.tags') },
      filterFn: (row, columnId, filterValue) => {
        if (!Array.isArray(filterValue) || filterValue.length === 0) {
          return true;
        }
        const raw = row.getValue(columnId) as string[] | undefined;
        return (raw ?? []).some((value) => filterValue.includes(value));
      },
      enableGlobalFilter: true,
      cell: ({ row }) => {
        const test = row.original;
        const isEditing = editingCell?.rowId === test.id && editingCell.columnId === 'tags';

        if (isEditing) {
          return (
            <Input
              autoFocus
              className="h-8 w-full"
              value={draftValue}
              placeholder={t('placeholders.tags')}
              onChange={(event) => setDraftValue(event.target.value)}
              onBlur={() => onSaveEdit(test, 'tags')}
              onKeyDown={(event) => onKeyDown(event, test, 'tags')}
            />
          );
        }

        return (
          <div
            className="flex flex-wrap gap-1"
            onClick={() => onBeginEdit(test, 'tags')}
            onDoubleClick={() => onBeginEdit(test, 'tags')}
          >
            {test.tags.length > 0 ? (
              test.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs font-medium">
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">{t('empty')}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'updatedAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('columns.updatedAt')} />
      ),
      meta: { label: t('columns.updatedAt') },
      cell: ({ row }) => {
        const date = new Date(row.original.updatedAt);
        return (
          <span className="text-sm font-mono text-muted-foreground tabular-nums">
            {Number.isNaN(date.getTime())
              ? t('dateFallback')
              : new Intl.DateTimeFormat(locale, {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }).format(date)}
          </span>
        );
      },
    },
    {
      id: 'actions',
      enableHiding: false,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.actions')} />,
      cell: ({ row }) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              aria-label={t('columns.actions')}
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('columns.actions')}</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link
                href={{
                  pathname: '/administration/tests/edit/[id]',
                  params: { id: row.original.id },
                }}
              >
                {t('actions.edit')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(row.original)}>
              {t('actions.duplicate')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-400 focus:text-red-400"
              onSelect={() => onDelete(row.original)}
            >
              {t('actions.delete')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];
}

function DataTableToolbar({
  table,
  t,
  statusT,
  themesFilterOptions,
}: {
  table: TableInstance<TestDto>;
  t: ReturnType<typeof useTranslations>;
  statusT: ReturnType<typeof useTranslations>;
  themesFilterOptions: string[];
}) {
  const [filtersOpen, setFiltersOpen] = useState(true);
  const statusOptionsWithLabels = statusOptions.map((status) => ({
    label: statusT(status),
    value: status,
  }));

  const themeOptionsWithLabels = themesFilterOptions.map((theme) => ({
    label: theme,
    value: theme,
  }));

  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            className="h-8 w-[150px] lg:w-[250px]"
            placeholder={t('filters.searchPlaceholder')}
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 gap-2"
            onClick={() => setFiltersOpen((prev) => !prev)}
          >
            <Filter className="h-4 w-4" />
            {t('filters.filterButton')}
          </Button>
          {filtersOpen && (
            <>
              <DataTableFacetedFilter
                column={table.getColumn('status')}
                title={t('filters.status')}
                options={statusOptionsWithLabels}
              />
              <DataTableFacetedFilter
                column={table.getColumn('domainTheme')}
                title={t('labels.themes')}
                options={themeOptionsWithLabels}
              />
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                {t('actions.viewOptions')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('actions.viewOptions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllColumns()
                .filter((column) => column.getCanHide())
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  >
                    {column.columnDef.meta?.label ?? column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href="/administration/tests/create" className="ui-button ui-button-sm">
            {t('actions.newTest')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function TestDataGrid({ locale }: TestDataGridProps) {
  const t = useTranslations('AdminTests.grid');
  const statusT = useTranslations('AdminTests.status');
  const bulkT = useTranslations('AdminTests.bulk');
  const toastT = useTranslations('AdminTests.toast');

  const [tests, setTests] = useState<TestDto[]>([]);
  const [taxonomy, setTaxonomy] = useState<TaxonomyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<EditingCell>(null);
  const [draftValue, setDraftValue] = useState('');
  const [draftDomainTheme, setDraftDomainTheme] = useState<DraftDomainTheme>({
    domains: '',
    themes: '',
  });
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [testsResponse, taxonomyResponse] = await Promise.all([
        fetch(`/api/tests?locale=${locale}`, { credentials: 'include' }),
        fetch(`/api/tests/taxonomy?locale=${locale}`, { credentials: 'include' }),
      ]);

      if (!testsResponse.ok) {
        throw new Error(toastT('loadError'));
      }

      if (!taxonomyResponse.ok) {
        throw new Error(toastT('loadError'));
      }

      const testsJson = (await testsResponse.json()) as TestsApiResponse;
      const taxonomyJson = (await taxonomyResponse.json()) as TaxonomyResponse;

      setTests(testsJson.tests ?? []);
      setTaxonomy(taxonomyJson);
    } catch (error) {
      const message = error instanceof Error ? error.message : toastT('loadError');
      setToastMsg(message);
    } finally {
      setLoading(false);
    }
  }, [locale, toastT]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const updateTest = useCallback(
    async (test: TestDto, overrides: UpdateOverrides) => {
      const payload = updateTestInputSchema.parse({
        id: test.id,
        locale,
        name: overrides.name ?? test.name,
        targetAudience: test.targetAudience,
        status: overrides.status ?? test.status,
        shortDescription: test.shortDescription,
        objective: test.objective,
        ageMinMonths: test.ageMinMonths,
        ageMaxMonths: test.ageMaxMonths,
        population: test.population,
        durationMinutes: test.durationMinutes,
        materials: test.materials,
        isStandardized: test.isStandardized,
        publisher: test.publisher,
        priceRange: test.priceRange,
        buyLink: test.buyLink,
        notes: test.notes,
        domains: overrides.domains ?? test.domains,
        tags: overrides.tags ?? test.tags,
        themes: overrides.themes ?? test.themes,
        bibliography: test.bibliography,
      });

      const response = await fetch('/api/tests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string; test?: TestDto };

      if (!response.ok || !json.test) {
        throw new Error(json.error || toastT('updateError'));
      }

      return json.test;
    },
    [locale, toastT],
  );

  const duplicateTest = useCallback(
    async (test: TestDto) => {
      try {
        const payload = testInputSchema.parse({
          locale,
          name: t('actions.duplicateName', { name: test.name }),
          targetAudience: test.targetAudience,
          status: test.status,
          shortDescription: test.shortDescription,
          objective: test.objective,
          ageMinMonths: test.ageMinMonths,
          ageMaxMonths: test.ageMaxMonths,
          population: test.population,
          durationMinutes: test.durationMinutes,
          materials: test.materials,
          isStandardized: test.isStandardized,
          publisher: test.publisher,
          priceRange: test.priceRange,
          buyLink: test.buyLink,
          notes: test.notes,
          domains: test.domains,
          tags: test.tags,
          themes: test.themes,
          bibliography: test.bibliography,
        });

        const response = await fetch('/api/tests', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const json = (await response.json().catch(() => ({}))) as {
          error?: string;
          test?: TestDto;
        };

        if (!response.ok || !json.test) {
          throw new Error(json.error || toastT('duplicateError'));
        }

        const createdTest = json.test;
        setTests((prev) => [createdTest, ...prev]);
        setToastMsg(toastT('duplicateSuccess', { name: createdTest.name }));
      } catch (error) {
        const message = error instanceof Error ? error.message : toastT('duplicateError');
        setToastMsg(message);
      }
    },
    [locale, t, toastT],
  );

  const deleteTest = useCallback(
    async (test: TestDto) => {
      if (!window.confirm(bulkT('deleteConfirm', { count: 1 }))) {
        return;
      }

      try {
        const response = await fetch('/api/tests', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ ids: [test.id] }),
        });

        const json = (await response.json().catch(() => ({}))) as { error?: string };

        if (!response.ok) {
          throw new Error(json.error || toastT('deleteError'));
        }

        setTests((prev) => prev.filter((item) => item.id !== test.id));
        setToastMsg(toastT('deleteSuccess', { count: 1 }));
      } catch (error) {
        const message = error instanceof Error ? error.message : toastT('deleteError');
        setToastMsg(message);
      }
    },
    [bulkT, toastT],
  );

  const beginEdit = (test: TestDto, columnId: EditingColumnId) => {
    if (columnId === 'domainTheme') {
      setDraftDomainTheme({
        domains: buildCsv(test.domains),
        themes: buildCsv(test.themes),
      });
    } else if (columnId === 'tags') {
      setDraftValue(buildCsv(test.tags));
    } else if (columnId === 'status') {
      setDraftValue(test.status);
    } else {
      setDraftValue(test.name);
    }
    setEditingCell({ rowId: test.id, columnId });
  };

  const resetEditing = () => {
    setEditingCell(null);
    setDraftValue('');
    setDraftDomainTheme({ domains: '', themes: '' });
  };

  const saveEditing = useCallback(
    async (test: TestDto, columnId: EditingColumnId) => {
      let overrides: UpdateOverrides = {};

      if (columnId === 'name') {
        const nextName = draftValue.trim();
        if (!nextName) {
          setToastMsg(toastT('nameRequired'));
          return;
        }
        overrides = { name: nextName };
      }

      if (columnId === 'status') {
        overrides = { status: draftValue as TestDto['status'] };
      }

      if (columnId === 'tags') {
        overrides = { tags: parseCsv(draftValue) };
      }

      if (columnId === 'domainTheme') {
        overrides = {
          domains: parseCsv(draftDomainTheme.domains),
          themes: parseCsv(draftDomainTheme.themes),
        };
      }

      try {
        if (
          (overrides.name && overrides.name === test.name) ||
          (overrides.status && overrides.status === test.status) ||
          (overrides.tags && overrides.tags.join('|') === test.tags.join('|')) ||
          (overrides.domains && overrides.domains.join('|') === test.domains.join('|')) ||
          (overrides.themes && overrides.themes.join('|') === test.themes.join('|'))
        ) {
          resetEditing();
          return;
        }

        const updated = await updateTest(test, overrides);
        setTests((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        setToastMsg(toastT('updateSuccess'));
      } catch (error) {
        const message = error instanceof Error ? error.message : toastT('updateError');
        setToastMsg(message);
      } finally {
        resetEditing();
      }
    },
    [draftDomainTheme, draftValue, toastT, updateTest],
  );

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    test: TestDto,
    columnId: EditingColumnId,
  ) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      resetEditing();
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      void saveEditing(test, columnId);
    }
  };

  const columns = useMemo(
    () =>
      buildColumns({
        locale,
        t,
        statusT,
        onBeginEdit: beginEdit,
        onSaveEdit: (test, columnId) => void saveEditing(test, columnId),
        onKeyDown: handleCellKeyDown,
        draftValue,
        draftDomainTheme,
        setDraftValue,
        setDraftDomainTheme,
        editingCell,
        statusOptions,
        onDuplicate: (test) => void duplicateTest(test),
        onDelete: (test) => void deleteTest(test),
      }),
    [
      draftDomainTheme,
      draftValue,
      duplicateTest,
      deleteTest,
      editingCell,
      locale,
      saveEditing,
      statusT,
      t,
    ],
  );

  const table = useReactTable({
    data: tests,
    columns,
    state: {
      rowSelection,
      sorting,
      columnVisibility,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: pageSizeOptions[0],
      },
    },
    globalFilterFn: (row, columnId, filterValue) => {
      if (!filterValue || typeof filterValue !== 'string') {
        return true;
      }
      const raw = row.getValue(columnId) as string | string[] | undefined;
      const normalized = Array.isArray(raw) ? raw.join(' ') : raw ?? '';
      return normalized.toLowerCase().includes(filterValue.toLowerCase());
    },
  });

  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);

  const updateRows = async (rows: TestDto[], overrides: UpdateOverrides) => {
    try {
      const updated = await Promise.all(rows.map((row) => updateTest(row, overrides)));
      setTests((prev) =>
        prev.map((item) => updated.find((next) => next.id === item.id) ?? item),
      );
      setToastMsg(toastT('bulkUpdateSuccess', { count: updated.length }));
      setRowSelection({});
    } catch (error) {
      const message = error instanceof Error ? error.message : toastT('bulkUpdateError');
      setToastMsg(message);
    }
  };

  const handleBulkTags = async () => {
    const input = window.prompt(bulkT('tagsPrompt'));
    if (input === null) {
      return;
    }
    const tags = parseCsv(input);
    if (tags.length === 0) {
      setToastMsg(toastT('tagsEmpty'));
      return;
    }
    await updateRows(selectedRows, { tags });
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(bulkT('deleteConfirm', { count: selectedRows.length }))) {
      return;
    }
    try {
      const response = await fetch('/api/tests', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ids: selectedRows.map((row) => row.id) }),
      });

      const json = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        throw new Error(json.error || toastT('deleteError'));
      }

      setTests((prev) => prev.filter((item) => !selectedRows.some((row) => row.id === item.id)));
      setToastMsg(toastT('deleteSuccess', { count: selectedRows.length }));
      setRowSelection({});
    } catch (error) {
      const message = error instanceof Error ? error.message : toastT('deleteError');
      setToastMsg(message);
    }
  };

  const themesFilterOptions = useMemo(() => {
    if (!taxonomy) {
      return [] as string[];
    }
    return taxonomy.themes.map((theme) => theme.label).sort((a, b) => a.localeCompare(b, locale));
  }, [locale, taxonomy]);

  return (
    <section className="mt-10 space-y-6 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <DataTableToolbar
        table={table}
        t={t}
        statusT={statusT}
        themesFilterOptions={themesFilterOptions}
      />

      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3">
          <span className="text-sm font-semibold text-emerald-100">
            {bulkT('selected', { count: selectedRows.length })}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              variant="outline"
              className="h-8 border-emerald-400/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
              onClick={() => void updateRows(selectedRows, { status: 'published' })}
            >
              {bulkT('publish')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 border-emerald-400/40 bg-emerald-500/10 text-emerald-100 hover:bg-emerald-500/20"
              onClick={() => void updateRows(selectedRows, { status: 'draft' })}
            >
              {bulkT('unpublish')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 border-white/10 bg-white/5 text-slate-100 hover:bg-white/10"
              onClick={() => void handleBulkTags()}
            >
              {bulkT('tags')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-8 border-red-400/40 bg-red-500/10 text-red-200 hover:bg-red-500/20"
              onClick={() => void handleBulkDelete()}
            >
              {bulkT('delete')}
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-md border border-slate-300 bg-white/95 shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-8 px-4 text-xs">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  className="px-4 py-6 text-sm text-muted-foreground"
                  colSpan={table.getVisibleLeafColumns().length}
                >
                  {t('loading')}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="px-4 py-6 text-sm text-muted-foreground"
                  colSpan={table.getVisibleLeafColumns().length}
                >
                  {t('emptyState')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-t border-white/10 hover:bg-white/5"
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} pageSizeOptions={pageSizeOptions} />

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </section>
  );
}
