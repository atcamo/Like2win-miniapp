/**
 * Badge Component
 * 
 * A flexible badge component for displaying labels, status indicators,
 * and counts. Supports multiple variants and sizes.
 * 
 * @module Components/UI/Badge
 * @version 1.0.0
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Badge component variants using class-variance-authority
 */
const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground hover:bg-primary/80',
        secondary: 'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive: 'border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80',
        outline: 'text-foreground border-gray-200',
        success: 'border-transparent bg-green-100 text-green-800 hover:bg-green-200',
        warning: 'border-transparent bg-yellow-100 text-yellow-800 hover:bg-yellow-200',
        error: 'border-transparent bg-red-100 text-red-800 hover:bg-red-200',
        info: 'border-transparent bg-blue-100 text-blue-800 hover:bg-blue-200',
        purple: 'border-transparent bg-purple-100 text-purple-800 hover:bg-purple-200',
        orange: 'border-transparent bg-orange-100 text-orange-800 hover:bg-orange-200',
        gradient: 'border-transparent bg-gradient-to-r from-yellow-400 to-orange-500 text-white',
      },
      size: {
        xs: 'px-1.5 py-0.5 text-xs',
        sm: 'px-2 py-0.5 text-xs',
        default: 'px-2.5 py-0.5 text-xs',
        lg: 'px-3 py-1 text-sm',
      },
      shape: {
        default: 'rounded-full',
        rounded: 'rounded-md',
        square: 'rounded-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      shape: 'default',
    },
  }
);

/**
 * Props for the Badge component
 */
export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Custom className to apply to the badge */
  className?: string;
  /** Badge content */
  children: React.ReactNode;
  /** Icon to display before the badge text */
  icon?: React.ReactNode;
  /** Whether the badge is removable (shows close button) */
  removable?: boolean;
  /** Callback when remove button is clicked */
  onRemove?: () => void;
}

/**
 * Badge component for labels and status indicators
 * 
 * @param props - Badge component props
 * @returns JSX element
 * 
 * @example
 * ```tsx
 * <Badge variant="success" icon="✓">
 *   Following
 * </Badge>
 * 
 * <Badge variant="warning" removable onRemove={handleRemove}>
 *   Pending Verification
 * </Badge>
 * ```
 */
export const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, size, shape, icon, removable, onRemove, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(badgeVariants({ variant, size, shape }), className)}
      {...props}
    >
      {icon && <span className="mr-1">{icon}</span>}
      {children}
      {removable && onRemove && (
        <button
          type="button"
          className="ml-1 h-3 w-3 rounded-full hover:bg-black/10 focus:outline-none focus:ring-1 focus:ring-black/20"
          onClick={onRemove}
          aria-label="Remove badge"
        >
          <span className="sr-only">Remove badge</span>
          <svg className="h-2 w-2" viewBox="0 0 8 8" fill="currentColor">
            <path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  )
);

Badge.displayName = 'Badge';

/**
 * Status badge component for common status indicators
 * 
 * @param props - StatusBadge component props
 * @returns JSX element
 */
export interface StatusBadgeProps extends Omit<BadgeProps, 'variant' | 'icon'> {
  status: 'active' | 'inactive' | 'pending' | 'completed' | 'error' | 'success' | 'warning';
  showIcon?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  children,
  ...props
}) => {
  const statusConfig = {
    active: {
      variant: 'success' as const,
      icon: '🟢',
      label: 'Active',
    },
    inactive: {
      variant: 'secondary' as const,
      icon: '⚫',
      label: 'Inactive',
    },
    pending: {
      variant: 'warning' as const,
      icon: '🟡',
      label: 'Pending',
    },
    completed: {
      variant: 'success' as const,
      icon: '✅',
      label: 'Completed',
    },
    error: {
      variant: 'error' as const,
      icon: '❌',
      label: 'Error',
    },
    success: {
      variant: 'success' as const,
      icon: '✅',
      label: 'Success',
    },
    warning: {
      variant: 'warning' as const,
      icon: '⚠️',
      label: 'Warning',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      icon={showIcon ? config.icon : undefined}
      {...props}
    >
      {children || config.label}
    </Badge>
  );
};

/**
 * Count badge component for displaying numbers
 * 
 * @param props - CountBadge component props
 * @returns JSX element
 */
export interface CountBadgeProps extends Omit<BadgeProps, 'children'> {
  count: number;
  max?: number;
  showZero?: boolean;
}

export const CountBadge: React.FC<CountBadgeProps> = ({
  count,
  max = 99,
  showZero = false,
  className,
  ...props
}) => {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge
      className={cn('min-w-[1.25rem] justify-center px-1', className)}
      {...props}
    >
      {displayCount}
    </Badge>
  );
};

/**
 * Ticket badge component specifically for displaying raffle tickets
 * 
 * @param props - TicketBadge component props
 * @returns JSX element
 */
export interface TicketBadgeProps extends Omit<BadgeProps, 'variant' | 'icon' | 'children'> {
  tickets: number;
  showIcon?: boolean;
  label?: string;
}

export const TicketBadge: React.FC<TicketBadgeProps> = ({
  tickets,
  showIcon = true,
  label,
  className,
  ...props
}) => {
  return (
    <Badge
      variant="gradient"
      icon={showIcon ? '🎫' : undefined}
      className={cn('font-bold', className)}
      {...props}
    >
      {tickets} {label || (tickets === 1 ? 'ticket' : 'tickets')}
    </Badge>
  );
};

/**
 * Raffle status badge component
 * 
 * @param props - RaffleStatusBadge component props
 * @returns JSX element
 */
export interface RaffleStatusBadgeProps extends Omit<BadgeProps, 'variant' | 'icon' | 'children'> {
  status: 'upcoming' | 'active' | 'ended' | 'completed';
  showIcon?: boolean;
}

export const RaffleStatusBadge: React.FC<RaffleStatusBadgeProps> = ({
  status,
  showIcon = true,
  ...props
}) => {
  const statusConfig = {
    upcoming: {
      variant: 'info' as const,
      icon: '⏰',
      label: 'Upcoming',
    },
    active: {
      variant: 'success' as const,
      icon: '🎯',
      label: 'Active',
    },
    ended: {
      variant: 'warning' as const,
      icon: '⏱️',
      label: 'Ended',
    },
    completed: {
      variant: 'secondary' as const,
      icon: '🏁',
      label: 'Completed',
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      icon={showIcon ? config.icon : undefined}
      {...props}
    >
      {config.label}
    </Badge>
  );
};

/**
 * Following status badge component
 * 
 * @param props - FollowingBadge component props
 * @returns JSX element
 */
export interface FollowingBadgeProps extends Omit<BadgeProps, 'variant' | 'icon' | 'children'> {
  isFollowing: boolean;
  showIcon?: boolean;
}

export const FollowingBadge: React.FC<FollowingBadgeProps> = ({
  isFollowing,
  showIcon = true,
  ...props
}) => {
  return (
    <Badge
      variant={isFollowing ? 'success' : 'error'}
      icon={showIcon ? (isFollowing ? '✅' : '❌') : undefined}
      {...props}
    >
      {isFollowing ? 'Following @Like2Win' : 'Not Following'}
    </Badge>
  );
};

/**
 * Tip allowance badge component
 * 
 * @param props - TipAllowanceBadge component props
 * @returns JSX element
 */
export interface TipAllowanceBadgeProps extends Omit<BadgeProps, 'variant' | 'icon' | 'children'> {
  hasTipAllowance: boolean;
  showIcon?: boolean;
}

export const TipAllowanceBadge: React.FC<TipAllowanceBadgeProps> = ({
  hasTipAllowance,
  showIcon = true,
  ...props
}) => {
  return (
    <Badge
      variant={hasTipAllowance ? 'purple' : 'secondary'}
      icon={showIcon ? (hasTipAllowance ? '💜' : '🔒') : undefined}
      {...props}
    >
      {hasTipAllowance ? 'Tip Allowance Enabled' : 'Standard Requirements'}
    </Badge>
  );
};