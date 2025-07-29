/**
 * Badge Component - Reusable badge component with variants
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
  {
    variants: {
      variant: {
        default: 'bg-gray-50 text-gray-700 ring-gray-600/20',
        primary: 'bg-blue-50 text-blue-700 ring-blue-700/10',
        secondary: 'bg-gray-50 text-gray-600 ring-gray-500/10',
        success: 'bg-green-50 text-green-700 ring-green-600/20',
        warning: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20',
        error: 'bg-red-50 text-red-700 ring-red-600/10',
        info: 'bg-blue-50 text-blue-700 ring-blue-700/10',
        outline: 'text-gray-900 ring-gray-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };