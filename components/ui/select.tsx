import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils/cn';

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ className, ...props }, ref) {
  return <select ref={ref} className={cn('ui-select', className)} {...props} />;
});
