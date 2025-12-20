import type { Column } from '@tanstack/react-table';
import { Check, PlusCircle } from 'lucide-react';
import type { ComponentType } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

type FacetedFilterOption = {
  label: string;
  value: string;
  icon?: ComponentType<{ className?: string }>;
};

type DataTableFacetedFilterProps<TData, TValue> = {
  column?: Column<TData, TValue>;
  title: string;
  options: FacetedFilterOption[];
};

export function DataTableFacetedFilter<TData, TValue>({
  column,
  title,
  options,
}: DataTableFacetedFilterProps<TData, TValue>) {
  const selectedValues = new Set((column?.getFilterValue() as string[]) ?? []);

  const toggleValue = (value: string) => {
    if (!column) {
      return;
    }
    if (selectedValues.has(value)) {
      selectedValues.delete(value);
    } else {
      selectedValues.add(value);
    }
    const next = Array.from(selectedValues);
    column.setFilterValue(next.length ? next : undefined);
  };

  if (!column) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="h-4 w-4" />
          <span className="ml-2">{title}</span>
          {selectedValues.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge variant="secondary" className="rounded-sm px-1 font-normal">
                {selectedValues.size}
              </Badge>
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px]">
        {options.map((option) => {
          const isSelected = selectedValues.has(option.value);
          return (
            <DropdownMenuCheckboxItem
              key={option.value}
              checked={isSelected}
              onCheckedChange={() => toggleValue(option.value)}
              className="gap-2"
            >
              <span className="flex h-4 w-4 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
              </span>
              {option.icon && <option.icon className="h-4 w-4" />}
              <span>{option.label}</span>
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
