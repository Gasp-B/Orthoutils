import type { Dispatch, KeyboardEvent, SetStateAction } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { CheckCircle2, Clock3, FileArchive } from 'lucide-react';
import { type Locale } from '@/i18n/routing';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { DataTableColumnHeader } from '@/components/ui/data-table-column-header';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { DataTableRowActions } from './data-table-row-actions';
import { type TestDto } from '@/lib/validation/tests';

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    label?: string;
  }
}

export type EditingColumnId = 'name' | 'status' | 'tags' | 'domainTheme';

export type EditingCell = { rowId: string; columnId: EditingColumnId } | null;

export type DraftDomainTheme = {
  domains: string;
  themes: string;
};

type ColumnBuilderParams = {
  locale: Locale;
  t: (key: string, values?: Record<string, unknown>) => string;
  statusT: (key: string) => string;
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

const statusIcons: Partial<Record<TestDto['status'], typeof CheckCircle2>> = {
  draft: Clock3,
  in_review: Clock3,
  published: CheckCircle2,
  archived: FileArchive,
};

export function buildColumns({
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
      size: 40,
      minSize: 40,
      maxSize: 40,
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
      accessorKey: 'slug',
      enableSorting: true,
      size: 80,
      minSize: 80,
      maxSize: 80,
      header: ({ column }) => <DataTableColumnHeader column={column} title={t('columns.slug')} />,
      meta: { label: t('columns.slug') },
      enableGlobalFilter: true,
      cell: ({ row }) => (
        <span className="block truncate font-mono text-xs text-muted-foreground">
          {row.original.slug}
        </span>
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
            className="max-w-[500px]"
            onClick={() => onBeginEdit(test, 'name')}
            onDoubleClick={() => onBeginEdit(test, 'name')}
          >
            <Link
              className="block truncate text-sm font-medium text-slate-100 hover:underline"
              href={{ pathname: '/administration/tests/edit/[id]', params: { id: test.id } }}
            >
              {test.name}
            </Link>
          </div>
        );
      },
    },
    {
      accessorKey: 'status',
      enableSorting: true,
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
        const StatusIcon = statusIcons[test.status];

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
            <Badge variant="outline" className="gap-1 font-normal">
              {StatusIcon ? <StatusIcon className="h-3 w-3" /> : null}
              {statusT(test.status)}
            </Badge>
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
      enableSorting: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('columns.updatedAt')} />
      ),
      meta: { label: t('columns.updatedAt') },
      cell: ({ row }) => {
        const date = new Date(row.original.updatedAt);
        return (
          <span className="text-xs font-mono text-muted-foreground tabular-nums">
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
      size: 50,
      minSize: 50,
      maxSize: 50,
      header: () => null,
      cell: ({ row }) => (
        <DataTableRowActions
          test={row.original}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          t={t}
        />
      ),
    },
  ];
}
