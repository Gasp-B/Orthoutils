import type { useTranslations } from 'next-intl';
import { MoreHorizontal } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { type TestDto } from '@/lib/validation/tests';

type DataTableRowActionsProps = {
  test: TestDto;
  onDuplicate: (test: TestDto) => void;
  onDelete: (test: TestDto) => void;
  t: ReturnType<typeof useTranslations>;
};

export function DataTableRowActions({
  test,
  onDuplicate,
  onDelete,
  t,
}: DataTableRowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0" aria-label={t('columns.actions')}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{t('columns.actions')}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link
            href={{
              pathname: '/administration/tests/edit/[id]',
              params: { id: test.id },
            }}
          >
            {t('actions.edit')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDuplicate(test)}>{t('actions.duplicate')}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-red-400 focus:text-red-400"
          onSelect={() => onDelete(test)}
        >
          {t('actions.delete')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
