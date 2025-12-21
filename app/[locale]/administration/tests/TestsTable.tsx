'use client';

import { useMemo, useState } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Clipboard, MoreHorizontal } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Locale } from '@/i18n/routing';
import type { TestDto } from '@/lib/validation/tests';
import { cn } from '@/lib/utils/cn';

type TestsTableProps = {
  tests: TestDto[];
  locale: Locale;
};

type StatusValue = TestDto['status'];
type AudienceValue = TestDto['targetAudience'];

type FacetOption = {
  label: string;
  value: string;
};

const statusVariants: Record<StatusValue, 'secondary' | 'warning' | 'success' | 'destructive'> = {
  draft: 'secondary',
  in_review: 'warning',
  published: 'success',
  archived: 'destructive',
};

const audienceVariants: Record<AudienceValue, 'info' | 'secondary'> = {
  child: 'info',
  adult: 'secondary',
};

function formatDate(value: string, locale: Locale) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

function renderTagList(items: string[], label: string, moreLabel: (count: number) => string) {
  if (!items.length) {
    return <span className="text-muted-foreground">{label}</span>;
  }

  const visible = items.slice(0, 2);
  const remaining = items.length - visible.length;

  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((item) => (
        <Badge key={item} variant="outline" className="font-normal">
          {item}
        </Badge>
      ))}
      {remaining > 0 && (
        <Badge variant="secondary" className="font-normal">
          {moreLabel(remaining)}
        </Badge>
      )}
    </div>
  );
}

export default function TestsTable({ tests, locale }: TestsTableProps) {
  const t = useTranslations('AdminTests');
  const grid = useTranslations('AdminTests.grid');
  const [sorting, setSorting] = useState<SortingState>([{ id: 'updatedAt', desc: true }]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const statusOptions = useMemo<FacetOption[]>(
    () =>
      (['draft', 'in_review', 'published', 'archived'] as StatusValue[]).map((status) => ({
        value: status,
        label: grid(`status.${status}`),
      })),
    [grid],
  );

  const audienceOptions = useMemo<FacetOption[]>(
    () =>
      (['child', 'adult'] as AudienceValue[]).map((audience) => ({
        value: audience,
        label: grid(`audience.${audience}`),
      })),
    [grid],
  );

  const domainOptions = useMemo<FacetOption[]>(
    () =>
      Array.from(new Set(tests.flatMap((test) => test.domains)))
        .sort((a, b) => a.localeCompare(b))
        .map((domain) => ({ value: domain, label: domain })),
    [tests],
  );

  const columns = useMemo<ColumnDef<TestDto>[]>(() => {
    return [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={grid('columns.name')} />
        ),
        cell: ({ row }) => (
          <div className="grid gap-1">
            <span className="font-medium text-foreground">{row.original.name}</span>
            <span className="text-xs text-muted-foreground">{row.original.slug}</span>
          </div>
        ),
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={grid('columns.status')} />
        ),
        cell: ({ row }) => (
          <Badge variant={statusVariants[row.original.status]}>
            {grid(`status.${row.original.status}`)}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          const selected = value as string[] | undefined;
          if (!selected?.length) {
            return true;
          }
          return selected.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'targetAudience',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={grid('columns.audience')} />
        ),
        cell: ({ row }) => (
          <Badge variant={audienceVariants[row.original.targetAudience]}>
            {grid(`audience.${row.original.targetAudience}`)}
          </Badge>
        ),
        filterFn: (row, id, value) => {
          const selected = value as string[] | undefined;
          if (!selected?.length) {
            return true;
          }
          return selected.includes(row.getValue(id));
        },
      },
      {
        accessorKey: 'domains',
        header: grid('columns.domains'),
        cell: ({ row }) =>
          renderTagList(
            row.original.domains,
            grid('emptyLabel'),
            (count) => grid('more', { count }),
          ),
        enableSorting: false,
        filterFn: (row, id, value) => {
          const selected = value as string[] | undefined;
          if (!selected?.length) {
            return true;
          }
          const rowValues = row.getValue(id) as string[];
          return selected.some((option) => rowValues.includes(option));
        },
      },
      {
        accessorKey: 'themes',
        header: grid('columns.themes'),
        cell: ({ row }) =>
          renderTagList(
            row.original.themes,
            grid('emptyLabel'),
            (count) => grid('more', { count }),
          ),
        enableSorting: false,
      },
      {
        accessorKey: 'isStandardized',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={grid('columns.standardized')} />
        ),
        cell: ({ row }) => (
          <Badge variant={row.original.isStandardized ? 'success' : 'secondary'}>
            {row.original.isStandardized ? grid('standardized.yes') : grid('standardized.no')}
          </Badge>
        ),
      },
      {
        accessorKey: 'updatedAt',
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={grid('columns.updated')} />
        ),
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {formatDate(row.original.updatedAt, locale)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">{grid('columns.actions')}</span>,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <span className="sr-only">{grid('columns.actions')}</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    void navigator.clipboard.writeText(row.original.id);
                  }}
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  {grid('actions.copyId')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={(event) => {
                    event.preventDefault();
                    void navigator.clipboard.writeText(row.original.slug);
                  }}
                >
                  <Clipboard className="mr-2 h-4 w-4" />
                  {grid('actions.copySlug')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ),
      },
    ];
  }, [grid, locale]);

  const table = useReactTable({
    data: tests,
    columns,
    state: {
      sorting,
      columnFilters,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">{t('tableTitle')}</h2>
        <p className="text-sm text-muted-foreground">{t('tableLead')}</p>
      </div>

      <div className="rounded-2xl border bg-white/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 border-b px-4 py-3">
          <Input
            placeholder={grid('searchPlaceholder')}
            className="h-8 w-[240px]"
            value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
            onChange={(event) => table.getColumn('name')?.setFilterValue(event.target.value)}
          />
          <div className="flex flex-wrap gap-2">
            <DataTableFacetedFilter
              column={table.getColumn('status')}
              title={grid('filters.status')}
              options={statusOptions}
            />
            <DataTableFacetedFilter
              column={table.getColumn('targetAudience')}
              title={grid('filters.audience')}
              options={audienceOptions}
            />
            {domainOptions.length > 0 && (
              <DataTableFacetedFilter
                column={table.getColumn('domains')}
                title={grid('filters.domains')}
                options={domainOptions}
              />
            )}
          </div>
        </div>
        <div className="max-h-[70vh] overflow-auto">
          <Table>
            <TableHeader className="bg-muted/30">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className={cn(header.column.id === 'actions' && 'w-12')}>
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
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                    {grid('empty')}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <div className="border-t px-4 py-3">
          <DataTablePagination table={table} />
        </div>
      </div>
    </section>
  );
}
