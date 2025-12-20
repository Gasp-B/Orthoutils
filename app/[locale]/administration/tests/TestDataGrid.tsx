'use client';

import { type KeyboardEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { type Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import {
  updateTestInputSchema,
  validationStatusSchema,
  type TaxonomyResponse,
  type TestDto,
} from '@/lib/validation/tests';

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

const pageSizeOptions = [20, 50];
const statusOptions = validationStatusSchema.options;

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
    <div className="fixed top-4 right-4 z-50 rounded-xl border border-emerald-200 bg-white px-4 py-3 text-emerald-800 shadow-lg animate-in slide-in-from-top-2 fade-in duration-300">
      <div className="flex items-center gap-2">
        <span className="text-xl">✓</span>
        <p className="text-sm font-semibold">{message}</p>
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

  const [rowSelection, setRowSelection] = useState({});

  const columns = useMemo<ColumnDef<TestDto>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <input
            aria-label={t('columns.select')}
            type="checkbox"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            aria-label={t('columns.selectRow')}
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        accessorKey: 'name',
        header: t('columns.title'),
        enableGlobalFilter: true,
        cell: ({ row }) => {
          const test = row.original;
          const isEditing = editingCell?.rowId === test.id && editingCell.columnId === 'name';

          if (isEditing) {
            return (
              <input
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                onBlur={() => void saveEditing(test, 'name')}
                onKeyDown={(event) => handleCellKeyDown(event, test, 'name')}
              />
            );
          }

          return (
            <div
              className="flex flex-col gap-1"
              onClick={() => beginEdit(test, 'name')}
              onDoubleClick={() => beginEdit(test, 'name')}
            >
              <Link
                className="text-sm font-semibold text-slate-900 hover:underline"
                href={{ pathname: '/administration/tests/edit/[id]', params: { id: test.id } }}
              >
                {test.name}
              </Link>
              <span className="text-xs text-slate-500">{test.slug}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: t('columns.status'),
        filterFn: 'equalsString',
        enableGlobalFilter: true,
        cell: ({ row }) => {
          const test = row.original;
          const isEditing = editingCell?.rowId === test.id && editingCell.columnId === 'status';

          if (isEditing) {
            return (
              <select
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                value={draftValue}
                onChange={(event) => setDraftValue(event.target.value)}
                onBlur={() => void saveEditing(test, 'status')}
                onKeyDown={(event) => handleCellKeyDown(event, test, 'status')}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {statusT(status)}
                  </option>
                ))}
              </select>
            );
          }

          return (
            <button
              type="button"
              className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
              onClick={() => beginEdit(test, 'status')}
              onDoubleClick={() => beginEdit(test, 'status')}
            >
              {statusT(test.status)}
            </button>
          );
        },
      },
      {
        accessorFn: (row) => [...row.domains, ...row.themes],
        id: 'domainTheme',
        header: t('columns.domainTheme'),
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
                  void saveEditing(test, 'domainTheme');
                }}
              >
                <input
                  autoFocus
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                  value={draftDomainTheme.domains}
                  placeholder={t('placeholders.domains')}
                  onChange={(event) =>
                    setDraftDomainTheme((prev) => ({ ...prev, domains: event.target.value }))
                  }
                  onKeyDown={(event) => handleCellKeyDown(event, test, 'domainTheme')}
                />
                <input
                  className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                  value={draftDomainTheme.themes}
                  placeholder={t('placeholders.themes')}
                  onChange={(event) =>
                    setDraftDomainTheme((prev) => ({ ...prev, themes: event.target.value }))
                  }
                  onKeyDown={(event) => handleCellKeyDown(event, test, 'domainTheme')}
                />
              </div>
            );
          }

          return (
            <div
              className="text-sm text-slate-700"
              onClick={() => beginEdit(test, 'domainTheme')}
              onDoubleClick={() => beginEdit(test, 'domainTheme')}
            >
              <div>
                <span className="font-semibold text-slate-600">{t('labels.domains')}:</span>{' '}
                {test.domains.length > 0 ? test.domains.join(', ') : t('empty')}
              </div>
              <div>
                <span className="font-semibold text-slate-600">{t('labels.themes')}:</span>{' '}
                {test.themes.length > 0 ? test.themes.join(', ') : t('empty')}
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'tags',
        header: t('columns.tags'),
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
              <input
                autoFocus
                className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
                value={draftValue}
                placeholder={t('placeholders.tags')}
                onChange={(event) => setDraftValue(event.target.value)}
                onBlur={() => void saveEditing(test, 'tags')}
                onKeyDown={(event) => handleCellKeyDown(event, test, 'tags')}
              />
            );
          }

          return (
            <div
              className="text-sm text-slate-700"
              onClick={() => beginEdit(test, 'tags')}
              onDoubleClick={() => beginEdit(test, 'tags')}
            >
              {test.tags.length > 0 ? test.tags.join(', ') : t('empty')}
            </div>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: t('columns.updatedAt'),
        cell: ({ row }) => {
          const date = new Date(row.original.updatedAt);
          return (
            <span className="text-sm text-slate-600">
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
        header: t('columns.actions'),
        cell: ({ row }) => (
          <Link
            className="text-sm font-semibold text-emerald-700 hover:text-emerald-900"
            href={{
              pathname: '/administration/tests/edit/[id]',
              params: { id: row.original.id },
            }}
          >
            {t('actions.edit')}
          </Link>
        ),
      },
    ],
    [
      draftDomainTheme.domains,
      draftDomainTheme.themes,
      draftValue,
      editingCell,
      locale,
      statusT,
      t,
    ],
  );

  const table = useReactTable({
    data: tests,
    columns,
    state: {
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
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

  const domainsFilterOptions = useMemo(() => {
    if (!taxonomy) {
      return [] as string[];
    }
    const labels = [...taxonomy.domains, ...taxonomy.themes].map((item) => item.label);
    return Array.from(new Set(labels)).sort((a, b) => a.localeCompare(b, locale));
  }, [locale, taxonomy]);

  const tagsFilterOptions = useMemo(() => {
    if (!taxonomy) {
      return [] as string[];
    }
    return taxonomy.tags.map((tag) => tag.label).sort((a, b) => a.localeCompare(b, locale));
  }, [locale, taxonomy]);

  const handleDomainFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    table.getColumn('domainTheme')?.setFilterValue(values);
  };

  const handleTagsFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    table.getColumn('tags')?.setFilterValue(values);
  };

  const currentDomainFilters = (table.getColumn('domainTheme')?.getFilterValue() as string[]) ?? [];
  const currentTagFilters = (table.getColumn('tags')?.getFilterValue() as string[]) ?? [];

  return (
    <section className="mt-10 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{t('title')}</h2>
          <p className="text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <Link
          className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
          href="/administration/tests/create"
        >
          {t('actions.newTest')}
        </Link>
      </div>

      <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-[2fr_1fr_1fr_1fr]">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {t('filters.search')}
            <input
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              placeholder={t('filters.searchPlaceholder')}
              value={(table.getState().globalFilter as string) ?? ''}
              onChange={(event) => table.setGlobalFilter(event.target.value)}
            />
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {t('filters.status')}
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={(table.getColumn('status')?.getFilterValue() as string) ?? ''}
              onChange={(event) =>
                table.getColumn('status')?.setFilterValue(event.target.value || undefined)
              }
            >
              <option value="">{t('filters.statusAll')}</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusT(status)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {t('filters.domainTheme')}
            <select
              multiple
              className="min-h-[120px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={currentDomainFilters}
              onChange={handleDomainFilterChange}
            >
              {domainsFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            {t('filters.tags')}
            <select
              multiple
              className="min-h-[120px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              value={currentTagFilters}
              onChange={handleTagsFilterChange}
            >
              {tagsFilterOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            className="text-sm font-semibold text-emerald-700"
            onClick={() => {
              table.setGlobalFilter('');
              table.getColumn('status')?.setFilterValue(undefined);
              table.getColumn('domainTheme')?.setFilterValue([]);
              table.getColumn('tags')?.setFilterValue([]);
            }}
          >
            {t('filters.clear')}
          </button>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            {t('filters.pageSize')}
            <select
              className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm"
              value={table.getState().pagination.pageSize}
              onChange={(event) => table.setPageSize(Number(event.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {selectedRows.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
          <span className="text-sm font-semibold text-emerald-900">
            {bulkT('selected', { count: selectedRows.length })}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-800"
              onClick={() => void updateRows(selectedRows, { status: 'published' })}
            >
              {bulkT('publish')}
            </button>
            <button
              type="button"
              className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-800"
              onClick={() => void updateRows(selectedRows, { status: 'draft' })}
            >
              {bulkT('unpublish')}
            </button>
            <button
              type="button"
              className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-semibold text-emerald-800"
              onClick={() => void handleBulkTags()}
            >
              {bulkT('tags')}
            </button>
            <button
              type="button"
              className="rounded-full border border-red-200 bg-white px-3 py-1 text-sm font-semibold text-red-700"
              onClick={() => void handleBulkDelete()}
            >
              {bulkT('delete')}
            </button>
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-md">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="hover:bg-gray-50">
                {headerGroup.headers.map((header) => (
                  <th key={header.id} className="px-4 py-3">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {loading ? (
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={columns.length}>
                  {t('loading')}
                </td>
              </tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr className="hover:bg-gray-50">
                <td className="px-4 py-6 text-sm text-slate-500" colSpan={columns.length}>
                  {t('emptyState')}
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-t border-slate-100 hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 align-top">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
        <span>
          {t('pagination.summary', {
            page: table.getState().pagination.pageIndex + 1,
            total: table.getPageCount(),
          })}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t('pagination.previous')}
          </button>
          <button
            type="button"
            className="rounded-full border border-slate-200 px-3 py-1 text-sm font-semibold text-slate-700 disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t('pagination.next')}
          </button>
        </div>
      </div>

      {toastMsg && <Toast message={toastMsg} onClose={() => setToastMsg(null)} />}
    </section>
  );
}
