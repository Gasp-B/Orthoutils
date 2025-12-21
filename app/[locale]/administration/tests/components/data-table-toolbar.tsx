'use client';

import type { useTranslations } from 'next-intl';
import type { Table } from '@tanstack/react-table';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DataTableFacetedFilter } from '@/components/ui/data-table-faceted-filter';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { type TestDto, validationStatusSchema } from '@/lib/validation/tests';

const statusOptions = validationStatusSchema.options;

type DataTableToolbarProps = {
  table: Table<TestDto>;
  t: ReturnType<typeof useTranslations>;
  statusT: ReturnType<typeof useTranslations>;
};

function DataTableViewOptions({
  table,
  t,
}: {
  table: Table<TestDto>;
  t: ReturnType<typeof useTranslations>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          {t('actions.viewOptions')}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[150px]">
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
  );
}

export function DataTableToolbar({ table, t, statusT }: DataTableToolbarProps) {
  const statusOptionsWithLabels = statusOptions.map((status) => ({
    label: statusT(status),
    value: status,
  }));

  const isFiltered =
    table.getState().columnFilters.length > 0 || Boolean(table.getState().globalFilter);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Input
            className="h-8 w-[150px] lg:w-[250px]"
            placeholder={t('filters.searchPlaceholder')}
            value={(table.getState().globalFilter as string) ?? ''}
            onChange={(event) => table.setGlobalFilter(event.target.value)}
          />
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title={t('filters.status')}
            options={statusOptionsWithLabels}
          />
          {isFiltered ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 lg:px-3"
              onClick={() => {
                table.resetColumnFilters();
                table.setGlobalFilter('');
              }}
            >
              <X className="mr-2 h-4 w-4" />
              {t('filters.clear')}
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <DataTableViewOptions table={table} t={t} />
          <Link href="/administration/tests/create" className="ui-button ui-button-sm">
            {t('actions.newTest')}
          </Link>
        </div>
      </div>
    </div>
  );
}
