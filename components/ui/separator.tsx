import type React from 'react';
import { cn } from '@/lib/utils/cn';

type SeparatorProps = React.HTMLAttributes<HTMLDivElement>;

export function Separator({ className, ...props }: SeparatorProps) {
  return <div className={cn('ui-separator', className)} role="separator" {...props} />;
}
