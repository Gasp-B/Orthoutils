'use client';

import {
  type ColumnDef,
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
import { MoreHorizontal, SlidersHorizontal } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils/cn';
import type { TestDto } from '@/lib/validation/tests';

type TestsManagementTableProps = {
  tests: TestDto[];
  errorMessage: string | null;
};

type TestRow = Pick<
  TestDto,
  'id' | 'name' | 'slug' | 'status' | 'targetAudience' | 'updatedAt' | 'durationMinutes'
>;

const statusVariantMap: Record<TestDto['status'], 'warning' | 'info' | 'success' | 'secondary'> = {
  draft: 'warning',
  in_review: 'info',
  published: 'success',
  archived: 'secondary',
};

export default function TestsManagementTable({ tests, errorMessage }: TestsManagementTableProps) {
  const t = useTranslations('AdminTests');
  const locale = useLocale();

  const data = useMemo<TestRow[]>(
    () =>
      tests.map((test) => ({
        id: test.id,
        name: test.name,
        slug: test.slug,
        status: test.status,
        targetAudience: test.targetAudience,
        updatedAt: test.updatedAt,
        durationMinutes: test.durationMinutes,
      })),
    [tests],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        dateStyle: 'medium',
      }),
    [locale],
  );

  const statusOptions = useMemo(
    () =>
      (['draft', 'in_review', 'published', 'archived'] as const).map((status) => ({
        label: t(`statuses.${status}`),
        value: status,
      })),
    [t],
  );

  const audienceOptions = useMemo(
    () =>
      (['child', 'adult'] as const).map((audience) => ({
        label: t(`audiences.${audience}`),
        value: audience,
      })),
    [t],
  );

  const columns = useMemo<ColumnDef<TestRow>[]>(
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
            aria-label={t('grid.columns.select')}
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(Boolean(value))}
            aria-label={t('grid.columns.selectRow')}
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.name')} />
        ),
        cell: ({ row }) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-slate-100">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.slug}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.status')} />
        ),
        cell: ({ row }) => (
          <Badge variant={statusVariantMap[row.original.status]}>
            {t(`statuses.${row.original.status}`)}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          const filters = value as string[] | undefined;
          if (!filters?.length) {
            return true;
          }
          return filters.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'targetAudience',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.audience')} />
        ),
        cell: ({ row }) => (
          <Badge variant="secondary">{t(`audiences.${row.original.targetAudience}`)}</Badge>
        ),
        filterFn: (row, id, value) => {
          const filters = value as string[] | undefined;
          if (!filters?.length) {
            return true;
          }
          return filters.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'durationMinutes',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.duration')} />
        ),
        cell: ({ row }) => {
          const minutes = row.original.durationMinutes;
          return (
            <span className="text-sm text-muted-foreground">
              {minutes ? t('grid.duration.value', { minutes }) : t('grid.duration.variable')}
            </span>
          );
        },
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={t('grid.columns.updated')} />
        ),
        cell: ({ row }) => (
          <span className="text-sm text-muted-foreground">
            {dateFormatter.format(new Date(row.original.updatedAt))}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{t('grid.columns.actions')}</span>,
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">{t('grid.actions.open')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('grid.actions.title')}</DropdownMenuLabel>
              <DropdownMenuItem
                onSelect={() => {
                  void navigator.clipboard.writeText(row.original.id);
                }}
              >
                {t('grid.actions.copyId')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={{ pathname: '/catalogue/[slug]', params: { slug: row.original.slug } }}>
                  {t('grid.actions.viewSheet')}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    [dateFormatter, t],
  );

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = useState({});

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    enableRowSelection: true,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const nameColumn = table.getColumn('name');

  return (
    <section className="flex flex-col gap-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-1 flex-wrap items-center gap-3">
          <Input
            placeholder={t('grid.filters.searchPlaceholder')}
            value={(nameColumn?.getFilterValue() as string) ?? ''}
            onChange={(event) => nameColumn?.setFilterValue(event.target.value)}
            className="h-9 w-full max-w-[260px]"
          />
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title={t('grid.filters.status')}
            options={statusOptions}
          />
          <DataTableFacetedFilter
            column={table.getColumn('targetAudience')}
            title={t('grid.filters.audience')}
            options={audienceOptions}
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-9 gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              {t('grid.toolbar.view')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>{t('grid.toolbar.view')}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => (
                <DropdownMenuCheckboxItem
                  key={column.id}
                  checked={column.getIsVisible()}
                  onCheckedChange={(value) => column.toggleVisibility(Boolean(value))}
                  className="capitalize"
                >
                  {t(`grid.columns.${column.id}`)}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {errorMessage}
        </div>
      )}

      <div className={cn('rounded-md border border-white/10', errorMessage && 'opacity-70')}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
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
                <TableRow key={row.id} data-state={row.getIsSelected() ? 'selected' : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-sm">
                  {errorMessage ? t('grid.emptyError') : t('grid.empty')}
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
