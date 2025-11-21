import type React from 'react';
import { cn } from '@/lib/utils/cn';

type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className, ...props }: LabelProps) {
  return <label className={cn('ui-label', className)} {...props} />;
}
