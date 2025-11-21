import type React from 'react';
import { cn } from '@/lib/utils/cn';

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: 'default' | 'outline';
};

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return <span className={cn('ui-badge', variant === 'outline' && 'ui-badge-outline', className)} {...props} />;
}
