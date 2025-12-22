'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ColumnDef, ColumnFiltersState, SortingState, VisibilityState } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
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
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Link } from '@/i18n/navigation';
import type { TaxonomyResponse, TestDto } from '@/lib/validation/tests';
import styles from './tests-table.module.css';

type TestsTableProps = {
  tests: TestDto[];
};

type AdminTestRow = {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  status: TestDto['status'];
  targetAudience: TestDto['targetAudience'];
  isStandardized: boolean;
  domains: string[];
  themes: string[];
  tags: string[];
  updatedAt: string;
};

type EditableField = 'status' | 'targetAudience' | 'domains' | 'themes' | 'tags';

type InlineEditTarget = {
  id: string;
  field: EditableField;
};

type InlineEditState = InlineEditTarget | null;

const toAdminRow = (test: TestDto): AdminTestRow => ({
  id: test.id,
  name: test.name,
  slug: test.slug,
  shortDescription: test.shortDescription,
  status: test.status,
  targetAudience: test.targetAudience,
  isStandardized: test.isStandardized,
  domains: test.domains,
  themes: test.themes,
  tags: test.tags,
  updatedAt: test.updatedAt,
});

function DataTableViewOptions({ table }: { table: ReturnType<typeof useReactTable<AdminTestRow>> }) {
  const t = useTranslations('AdminTests.grid');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className={styles.viewButton}>
          <SlidersHorizontal className="h-4 w-4" />
          <span>{t('filters.view')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {table
          .getAllColumns()
          .filter((column) => column.getCanHide())
          .map((column) => (
            <DropdownMenuCheckboxItem
              key={column.id}
              checked={column.getIsVisible()}
              onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
              onSelect={(event) => event.preventDefault()}
            >
              {t(`columns.${column.id}`)}
            </DropdownMenuCheckboxItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function TestsTable({ tests }: TestsTableProps) {
  const t = useTranslations('AdminTests.grid');
  const pageT = useTranslations('AdminTests');
  const locale = useLocale();

  const [tableData, setTableData] = useState<AdminTestRow[]>(() => tests.map(toAdminRow));
  const [inlineEdit, setInlineEdit] = useState<InlineEditState>(null);
  const [savingCell, setSavingCell] = useState<InlineEditState>(null);
  const [taxonomy, setTaxonomy] = useState<TaxonomyResponse | null>(null);

  useEffect(() => {
    setTableData(tests.map(toAdminRow));
  }, [tests]);

  useEffect(() => {
    let isMounted = true;
    const loadTaxonomy = async () => {
      const response = await fetch(`/api/tests/taxonomy?locale=${locale}`, { credentials: 'include' });
      if (!response.ok) return;
      const data = (await response.json()) as TaxonomyResponse;
      if (isMounted) setTaxonomy(data);
    };

    void loadTaxonomy();

    return () => {
      isMounted = false;
    };
  }, [locale]);

  const statusOptions = useMemo(
    () => [
      { label: t('status.draft'), value: 'draft' },
      { label: t('status.in_review'), value: 'in_review' },
      { label: t('status.published'), value: 'published' },
      { label: t('status.archived'), value: 'archived' },
    ],
    [t],
  );

  const audienceOptions = useMemo(
    () => [
      { label: t('audience.child'), value: 'child' },
      { label: t('audience.adult'), value: 'adult' },
    ],
    [t],
  );

  const standardizationOptions = useMemo(
    () => [
      { label: t('standardized.yes'), value: 'standardized' },
      { label: t('standardized.no'), value: 'non_standardized' },
    ],
    [t],
  );

  const domainOptions = useMemo(
    () => taxonomy?.domains.map((domain) => ({ label: domain.label, value: domain.label })) ?? [],
    [taxonomy],
  );

  const themeOptions = useMemo(
    () => taxonomy?.themes.map((theme) => ({ label: theme.label, value: theme.label })) ?? [],
    [taxonomy],
  );

  const tagOptions = useMemo(
    () => taxonomy?.tags.map((tag) => ({ label: tag.label, value: tag.label })) ?? [],
    [taxonomy],
  );

  const updateTest = async (
    target: InlineEditTarget,
    updates: Partial<Pick<AdminTestRow, 'status' | 'targetAudience' | 'domains' | 'themes' | 'tags'>>,
    closeOnSuccess = true,
  ) => {
    setSavingCell(target);
    try {
      const response = await fetch('/api/tests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: target.id,
          locale,
          ...updates,
        }),
      });

      if (!response.ok) {
        throw new Error('updateError');
      }

      const json = (await response.json()) as { test: TestDto };
      setTableData((prev) => prev.map((row) => (row.id === target.id ? toAdminRow(json.test) : row)));
      if (closeOnSuccess) {
        setInlineEdit(null);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingCell(null);
    }
  };

  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'updatedAt',
      desc: true,
    },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({
    isStandardized: false,
  });

  const data = tableData;

  const columns = useMemo<ColumnDef<AdminTestRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.name')} />,
        cell: ({ row }) => {
          const description = row.original.shortDescription ?? t('emptyDescription');
          return (
            <div className={styles.nameCell}>
              <Link
                href={{ pathname: '/administration/tests/edit/[id]', params: { id: row.original.id } }}
                className={styles.nameLink}
                aria-label={t('actions.editTest', { name: row.original.name })}
              >
                <span className={styles.nameTitle}>{row.getValue('name')}</span>
              </Link>
              <span className={styles.descriptionText}>{description}</span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.status')} />,
        cell: ({ row }) => {
          const status = row.getValue('status') as AdminTestRow['status'];
          const variant =
            status === 'published'
              ? 'success'
              : status === 'in_review'
                ? 'warning'
                : status === 'archived'
                  ? 'outline'
                  : 'secondary';
          const isEditing = inlineEdit?.id === row.original.id && inlineEdit.field === 'status';
          const isSaving = savingCell?.id === row.original.id && savingCell.field === 'status';

          if (isEditing) {
            return (
              <DropdownMenu
                open
                onOpenChange={(open) => {
                  if (!open) {
                    setInlineEdit(null);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button type="button" className={styles.inlineEditTrigger} disabled={isSaving}>
                    <Badge variant={variant} className={styles.pill}>
                      {t(`status.${status}`)}
                    </Badge>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={styles.inlineEditMenu}>
                  <DropdownMenuRadioGroup
                    value={status}
                    onValueChange={(value) =>
                      updateTest(
                        { id: row.original.id, field: 'status' },
                        { status: value as AdminTestRow['status'] },
                      )
                    }
                  >
                    {statusOptions.map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <div
              className={styles.inlineEditCell}
              onDoubleClick={() => setInlineEdit({ id: row.original.id, field: 'status' })}
            >
              <Badge variant={variant} className={styles.pill}>
                {t(`status.${status}`)}
              </Badge>
            </div>
          );
        },
        filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      },
      {
        id: 'domains',
        accessorFn: (row) => row.domains.join(', '),
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.domains')} />,
        cell: ({ row }) => {
          const domains = row.original.domains;
          const visibleDomains = domains.slice(0, 2);
          const remaining = domains.length - visibleDomains.length;
          const isEditing = inlineEdit?.id === row.original.id && inlineEdit.field === 'domains';
          const selectedValues = new Set(domains);

          if (isEditing) {
            return (
              <DropdownMenu
                open
                onOpenChange={(open) => {
                  if (!open) {
                    setInlineEdit(null);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button type="button" className={styles.inlineEditTrigger}>
                    <div className={styles.themeCell}>
                      {visibleDomains.map((domain) => (
                        <Badge key={domain} variant="outline" className={styles.pill}>
                          {domain}
                        </Badge>
                      ))}
                      {remaining > 0 && (
                        <span className={styles.mutedText}>{t('domains.more', { count: remaining })}</span>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={styles.inlineEditMenu}>
                  {domainOptions.length === 0 && (
                    <DropdownMenuItem disabled>{t('inlineEdit.loading')}</DropdownMenuItem>
                  )}
                  {domainOptions.map((option) => {
                    const isSelected = selectedValues.has(option.value);
                    return (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={isSelected}
                        onCheckedChange={() => {
                          const nextValues = isSelected
                            ? domains.filter((value) => value !== option.value)
                            : [...domains, option.value];
                          void updateTest(
                            { id: row.original.id, field: 'domains' },
                            { domains: nextValues },
                            false,
                          );
                        }}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <div
              className={styles.themeCell}
              onDoubleClick={() => setInlineEdit({ id: row.original.id, field: 'domains' })}
            >
              {visibleDomains.map((domain) => (
                <Badge key={domain} variant="outline" className={styles.pill}>
                  {domain}
                </Badge>
              ))}
              {remaining > 0 && (
                <span className={styles.mutedText}>{t('domains.more', { count: remaining })}</span>
              )}
            </div>
          );
        },
      },
      {
        id: 'themes',
        accessorFn: (row) => row.themes.join(', '),
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.themes')} />,
        cell: ({ row }) => {
          const themes = row.original.themes;
          const visibleThemes = themes.slice(0, 2);
          const remaining = themes.length - visibleThemes.length;
          const isEditing = inlineEdit?.id === row.original.id && inlineEdit.field === 'themes';
          const selectedValues = new Set(themes);

          if (isEditing) {
            return (
              <DropdownMenu
                open
                onOpenChange={(open) => {
                  if (!open) {
                    setInlineEdit(null);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button type="button" className={styles.inlineEditTrigger}>
                    <div className={styles.themeCell}>
                      {visibleThemes.map((theme) => (
                        <Badge key={theme} variant="outline" className={styles.pill}>
                          {theme}
                        </Badge>
                      ))}
                      {remaining > 0 && (
                        <span className={styles.mutedText}>{t('themes.more', { count: remaining })}</span>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={styles.inlineEditMenu}>
                  {themeOptions.length === 0 && (
                    <DropdownMenuItem disabled>{t('inlineEdit.loading')}</DropdownMenuItem>
                  )}
                  {themeOptions.map((option) => {
                    const isSelected = selectedValues.has(option.value);
                    return (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={isSelected}
                        onCheckedChange={() => {
                          const nextValues = isSelected
                            ? themes.filter((value) => value !== option.value)
                            : [...themes, option.value];
                          void updateTest(
                            { id: row.original.id, field: 'themes' },
                            { themes: nextValues },
                            false,
                          );
                        }}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <div
              className={styles.themeCell}
              onDoubleClick={() => setInlineEdit({ id: row.original.id, field: 'themes' })}
            >
              {visibleThemes.map((theme) => (
                <Badge key={theme} variant="outline" className={styles.pill}>
                  {theme}
                </Badge>
              ))}
              {remaining > 0 && <span className={styles.mutedText}>{t('themes.more', { count: remaining })}</span>}
            </div>
          );
        },
      },
      {
        id: 'tags',
        accessorFn: (row) => row.tags.join(', '),
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.tags')} />,
        cell: ({ row }) => {
          const tags = row.original.tags;
          const visibleTags = tags.slice(0, 2);
          const remaining = tags.length - visibleTags.length;
          const isEditing = inlineEdit?.id === row.original.id && inlineEdit.field === 'tags';
          const selectedValues = new Set(tags);

          if (isEditing) {
            return (
              <DropdownMenu
                open
                onOpenChange={(open) => {
                  if (!open) {
                    setInlineEdit(null);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button type="button" className={styles.inlineEditTrigger}>
                    <div className={styles.themeCell}>
                      {visibleTags.map((tag) => (
                        <Badge key={tag} variant="outline" className={styles.pill}>
                          {tag}
                        </Badge>
                      ))}
                      {remaining > 0 && (
                        <span className={styles.mutedText}>{t('tags.more', { count: remaining })}</span>
                      )}
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={styles.inlineEditMenu}>
                  {tagOptions.length === 0 && (
                    <DropdownMenuItem disabled>{t('inlineEdit.loading')}</DropdownMenuItem>
                  )}
                  {tagOptions.map((option) => {
                    const isSelected = selectedValues.has(option.value);
                    return (
                      <DropdownMenuCheckboxItem
                        key={option.value}
                        checked={isSelected}
                        onCheckedChange={() => {
                          const nextValues = isSelected
                            ? tags.filter((value) => value !== option.value)
                            : [...tags, option.value];
                          void updateTest(
                            { id: row.original.id, field: 'tags' },
                            { tags: nextValues },
                            false,
                          );
                        }}
                        onSelect={(event) => event.preventDefault()}
                      >
                        {option.label}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <div
              className={styles.themeCell}
              onDoubleClick={() => setInlineEdit({ id: row.original.id, field: 'tags' })}
            >
              {visibleTags.map((tag) => (
                <Badge key={tag} variant="outline" className={styles.pill}>
                  {tag}
                </Badge>
              ))}
              {remaining > 0 && <span className={styles.mutedText}>{t('tags.more', { count: remaining })}</span>}
            </div>
          );
        },
      },
      {
        accessorKey: 'targetAudience',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.targetAudience')} />
        ),
        cell: ({ row }) => {
          const audience = row.getValue('targetAudience') as AdminTestRow['targetAudience'];
          const isEditing = inlineEdit?.id === row.original.id && inlineEdit.field === 'targetAudience';
          const isSaving = savingCell?.id === row.original.id && savingCell.field === 'targetAudience';

          if (isEditing) {
            return (
              <DropdownMenu
                open
                onOpenChange={(open) => {
                  if (!open) {
                    setInlineEdit(null);
                  }
                }}
              >
                <DropdownMenuTrigger asChild>
                  <button type="button" className={styles.inlineEditTrigger} disabled={isSaving}>
                    <Badge variant="secondary" className={styles.pill}>
                      {t(`audience.${audience}`)}
                    </Badge>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className={styles.inlineEditMenu}>
                  <DropdownMenuRadioGroup
                    value={audience}
                    onValueChange={(value) =>
                      updateTest(
                        { id: row.original.id, field: 'targetAudience' },
                        { targetAudience: value as AdminTestRow['targetAudience'] },
                      )
                    }
                  >
                    {audienceOptions.map((option) => (
                      <DropdownMenuRadioItem key={option.value} value={option.value}>
                        {option.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            );
          }

          return (
            <div
              className={styles.inlineEditCell}
              onDoubleClick={() => setInlineEdit({ id: row.original.id, field: 'targetAudience' })}
            >
              <Badge variant="secondary" className={styles.pill}>
                {t(`audience.${audience}`)}
              </Badge>
            </div>
          );
        },
        filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
      },
      {
        accessorKey: 'isStandardized',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('columns.isStandardized')} />
        ),
        cell: ({ row }) => {
          const standardized = row.getValue('isStandardized') as boolean;
          return (
            <Badge variant={standardized ? 'info' : 'outline'} className={styles.pill}>
              {standardized ? t('standardized.yes') : t('standardized.no')}
            </Badge>
          );
        },
        filterFn: (row, id, value: string[]) => {
          const standardizedValue = row.getValue(id) ? 'standardized' : 'non_standardized';
          return value.includes(standardizedValue);
        },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.updatedAt')} />,
        cell: ({ row }) => {
          const updatedAt = row.getValue('updatedAt') as string;
          const formatted = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
            new Date(updatedAt),
          );
          return <span className={styles.mutedText}>{formatted}</span>;
        },
      },
      {
        id: 'actions',
        enableSorting: false,
        header: () => <span className="sr-only">{t('columns.actions')}</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className={styles.actionButton} aria-label={t('actions.label')}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(row.original.id)}>
                {t('actions.copyId')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigator.clipboard.writeText(row.original.slug)}>
                {t('actions.copySlug')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>{t('actions.quickEdit')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    [
      audienceOptions,
      domainOptions,
      inlineEdit,
      locale,
      savingCell,
      statusOptions,
      t,
      tagOptions,
      themeOptions,
      updateTest,
    ],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <section className={styles.tableShell}>
      <div className={styles.toolbar}>
        <div className={styles.toolbarFilters}>
          <Input
            placeholder={t('filters.searchPlaceholder')}
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className={styles.searchInput}
          />
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title={t('filters.statusLabel')}
            options={statusOptions}
          />
          <DataTableFacetedFilter
            column={table.getColumn('targetAudience')}
            title={t('filters.audienceLabel')}
            options={audienceOptions}
          />
          <DataTableFacetedFilter
            column={table.getColumn('isStandardized')}
            title={t('filters.standardizationLabel')}
            options={standardizationOptions}
          />
          {isFiltered && (
            <Button
              variant="ghost"
              size="sm"
              className={styles.resetButton}
              onClick={() => table.resetColumnFilters()}
            >
              {t('filters.reset')}
            </Button>
          )}
        </div>
        <div className={styles.toolbarActions}>
          <DataTableViewOptions table={table} />
          <Link href="/administration/tests/create" className="ui-button ui-button-sm">
            {pageT('actions.create')}
          </Link>
        </div>
      </div>

      <div className={styles.tablePanel}>
        <Table className={styles.table}>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={styles.tableHead}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className={styles.tableRow}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={styles.tableCell}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className={styles.emptyCell}>
                  {t('table.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </section>
  );
}
