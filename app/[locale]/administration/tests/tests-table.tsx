'use client';

import { useMemo, useState } from 'react';
import type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import {
  Archive,
  CheckCircle2,
  CircleDashed,
  ClipboardCopy,
  MoreHorizontal,
  Send,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Locale } from '@/i18n/routing';
import type { TestDto } from '@/lib/validation/tests';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const STATUS_ICONS: Record<string, typeof CircleDashed> = {
  draft: CircleDashed,
  in_review: Send,
  published: CheckCircle2,
  archived: Archive,
};

type TestsTableProps = {
  locale: Locale;
  tests: TestDto[];
};

function formatDate(locale: Locale, value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export default function TestsTable({ locale, tests }: TestsTableProps) {
  const t = useTranslations('AdminTests');
  const tShared = useTranslations('Shared');
  const [rowSelection, setRowSelection] = useState({});
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'updatedAt', desc: true },
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});

  const statusOptions = useMemo(
    () =>
      Object.keys(STATUS_ICONS).map((value) => ({
        value,
        label: t(`statuses.${value}`),
        icon: STATUS_ICONS[value],
      })),
    [t],
  );

  const audienceOptions = useMemo(
    () => [
      { value: 'child', label: t('audience.child') },
      { value: 'adult', label: t('audience.adult') },
    ],
    [t],
  );

  const columns = useMemo<ColumnDef<TestDto>[]>(
    () => [
      {
        id: 'select',
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && 'indeterminate')
            }
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(Boolean(value))}
            aria-label={t('grid.selection.selectAll')}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label={t('grid.selection.selectRow')}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'slug',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.slug')} />
        ),
        cell: ({ row }) => (
          <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {row.original.slug || row.original.id.slice(0, 8)}
          </div>
        ),
        enableSorting: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.name')} />
        ),
        cell: ({ row }) => (
          <div className="flex min-w-[280px] flex-col gap-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-full">
                {row.original.isStandardized
                  ? tShared('statuses.standardized')
                  : tShared('statuses.nonStandardized')}
              </Badge>
              <span className="text-sm font-semibold text-white">{row.original.name}</span>
            </div>
            <span className="text-sm text-muted-foreground line-clamp-1">
              {row.original.shortDescription ?? t('grid.placeholders.shortDescription')}
            </span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.status')} />
        ),
        cell: ({ row }) => {
          const statusValue = row.getValue('status') as string;
          const Icon = STATUS_ICONS[statusValue] ?? CircleDashed;
          return (
            <div className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span>{t(`statuses.${statusValue}`)}</span>
            </div>
          );
        },
        filterFn: (row, id, value) => {
          const filterValues = value as string[];
          if (!filterValues?.length) {
            return true;
          }
          return filterValues.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'targetAudience',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.targetAudience')} />
        ),
        cell: ({ row }) => (
          <Badge variant="outline" className="rounded-full">
            {t(`audience.${row.getValue('targetAudience') as string}`)}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          const filterValues = value as string[];
          if (!filterValues?.length) {
            return true;
          }
          return filterValues.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.updatedAt')} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {formatDate(locale, row.getValue('updatedAt') as string)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('grid.columns.actions')}</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <span className="sr-only">{t('grid.columns.actions')}</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard?.writeText(row.original.id);
                }}
              >
                <ClipboardCopy className="mr-2 h-4 w-4" />
                {t('grid.actions.copyId')}
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard?.writeText(row.original.slug);
                }}
              >
                <ClipboardCopy className="mr-2 h-4 w-4" />
                {t('grid.actions.copySlug')}
              </DropdownMenuItem>
              {row.original.buyLink && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <a href={row.original.buyLink} rel="noreferrer" target="_blank">
                      <Send className="mr-2 h-4 w-4" />
                      {t('grid.actions.openBuyLink')}
                    </a>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [locale, t, tShared],
  );

  const table = useReactTable({
    data: tests,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            placeholder={t('grid.filters.searchPlaceholder')}
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
            className="h-9 w-full max-w-xs"
          />
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title={t('grid.filters.statusLabel')}
            options={statusOptions}
          />
          <DataTableFacetedFilter
            column={table.getColumn('targetAudience')}
            title={t('grid.filters.audienceLabel')}
            options={audienceOptions}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              {t('grid.viewOptions')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  className="capitalize"
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                >
                  {t(`grid.columns.${column.id}`)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {t('grid.empty')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
        <div>
          {t('grid.results', {
            filtered: table.getFilteredRowModel().rows.length,
            total: table.getRowModel().rows.length,
          })}
        </div>
        <DataTablePagination table={table} />
      </div>
    </div>
  );
}
