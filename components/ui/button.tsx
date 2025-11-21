import { forwardRef } from 'react';
import type React from 'react';
import { cn } from '@/lib/utils/cn';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm';
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'default', size = 'default', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'ui-button',
        variant === 'outline' && 'ui-button-outline',
        variant === 'ghost' && 'ui-button-ghost',
        size === 'sm' && 'ui-button-sm',
        className,
      )}
      {...props}
    />
  );
});
