'use client';

import type { Table } from '@tanstack/react-table';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';

type DataTablePaginationProps<TData> = {
  table: Table<TData>;
  pageSizeOptions?: number[];
};

export function DataTablePagination<TData>({
  table,
  pageSizeOptions = [10, 20, 50],
}: DataTablePaginationProps<TData>) {
  const t = useTranslations('AdminTests.grid');
  const totalPages = Math.max(1, table.getPageCount());

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-2 text-sm text-muted-foreground">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{t('filters.pageSize')}</span>
        <Select
          className="h-8 w-[70px]"
          value={`${table.getState().pagination.pageSize}`}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {t('pagination.summary', {
            page: table.getState().pagination.pageIndex + 1,
            total: totalPages,
          })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {t('pagination.previous')}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {t('pagination.next')}
          </Button>
        </div>
      </div>
    </div>
  );
}
