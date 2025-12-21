'use client';

import { useMemo, useState } from 'react';
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { TestDto } from '@/lib/validation/tests';
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
  const locale = useLocale();

  const data = useMemo<AdminTestRow[]>(
    () =>
      tests.map((test) => ({
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
      })),
    [tests],
  );

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

  const columns = useMemo<ColumnDef<AdminTestRow>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.name')} />,
        cell: ({ row }) => {
          const description = row.original.shortDescription ?? t('emptyDescription');
          return (
            <div className={styles.nameCell}>
              <span className={styles.nameTitle}>{row.getValue('name')}</span>
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
          return (
            <Badge variant={variant} className={styles.pill}>
              {t(`status.${status}`)}
            </Badge>
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
          return (
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
          return (
            <div className={styles.themeCell}>
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
          return (
            <div className={styles.themeCell}>
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
          return (
            <Badge variant="secondary" className={styles.pill}>
              {t(`audience.${audience}`)}
            </Badge>
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
    [locale, t],
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
