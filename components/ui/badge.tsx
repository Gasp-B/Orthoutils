import type React from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeVariant =
  | 'default'
  | 'outline'
  | 'secondary'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'ui-badge',
        variant === 'outline' && 'ui-badge-outline',
        variant === 'secondary' && 'ui-badge-secondary',
        variant === 'destructive' && 'ui-badge-destructive',
        variant === 'success' && 'ui-badge-success',
        variant === 'warning' && 'ui-badge-warning',
        variant === 'info' && 'ui-badge-info',
        className
      )}
      {...props}
    />
  );
}
