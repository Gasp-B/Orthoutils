import type React from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline' | 'secondary';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'ui-badge',
        variant === 'outline' && 'ui-badge-outline',
        variant === 'secondary' && 'ui-badge-secondary',
        className
      )}
      {...props}
    />
  );
}
