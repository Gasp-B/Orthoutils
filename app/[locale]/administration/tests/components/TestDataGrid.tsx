'use client';

import {
  type KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useTranslations } from 'next-intl';
import {
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { type Locale } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
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
  type TestDto,
} from '@/lib/validation/tests';
import { buildColumns, type DraftDomainTheme, type EditingCell, type EditingColumnId } from './columns';
import { DataTableToolbar } from './data-table-toolbar';

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
    <div className="fixed right-4 top-4 z-50 animate-in slide-in-from-top-2 rounded-xl border border-emerald-400/40 bg-slate-950 px-4 py-3 text-emerald-100 shadow-lg shadow-black/40 fade-in duration-300">
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
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const testsResponse = await fetch(`/api/tests?locale=${locale}`, {
        credentials: 'include',
      });

      if (!testsResponse.ok) {
        throw new Error(toastT('loadError'));
      }

      const testsJson = (await testsResponse.json()) as TestsApiResponse;

      setTests(testsJson.tests ?? []);
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
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
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

  return (
    <section className="mt-10 space-y-4 text-slate-100">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-100">{t('title')}</h2>
          <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
        </div>
      </div>

      <DataTableToolbar table={table} t={t} statusT={statusT} />

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

      <div className="rounded-md border border-white/10 bg-slate-950/60">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b border-white/10">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="h-9 px-3 text-xs">
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
                  className="px-3 py-6 text-sm text-muted-foreground"
                  colSpan={table.getVisibleLeafColumns().length}
                >
                  {t('loading')}
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  className="px-3 py-6 text-sm text-muted-foreground"
                  colSpan={table.getVisibleLeafColumns().length}
                >
                  {t('emptyState')}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className="border-t border-white/5 hover:bg-white/5"
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-3 py-2 align-top">
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
