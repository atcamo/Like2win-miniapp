/**
 * Button Component
 * 
 * A flexible button component with multiple variants, sizes, and states.
 * Supports loading states, disabled states, and custom icons.
 * 
 * @module Components/UI/Button
 * @version 1.0.0
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Button component variants using class-variance-authority
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        primary: 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
        success: 'bg-green-600 text-white hover:bg-green-700 active:bg-green-800',
        warning: 'bg-yellow-600 text-white hover:bg-yellow-700 active:bg-yellow-800',
        danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
        gradient: 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white hover:from-yellow-500 hover:to-orange-600',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
        xs: 'h-8 rounded px-2 text-xs',
        xl: 'h-12 rounded-lg px-10 text-base',
      },
      fullWidth: {
        true: 'w-full',
        false: 'w-auto',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
);

/**
 * Props for the Button component
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Whether the button should take full width */
  fullWidth?: boolean;
  /** Loading state - shows spinner and disables button */
  loading?: boolean;
  /** Icon to display before the button text */
  leftIcon?: React.ReactNode;
  /** Icon to display after the button text */
  rightIcon?: React.ReactNode;
  /** Custom className to apply to the button */
  className?: string;
  /** Button content */
  children?: React.ReactNode;
  /** Ref forwarding */
  ref?: React.Ref<HTMLButtonElement>;
}

/**
 * Loading spinner component
 */
const LoadingSpinner: React.FC<{ size?: 'sm' | 'default' | 'lg' }> = ({ size = 'default' }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    default: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  return (
    <svg
      className={cn('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

/**
 * Button component for user interactions
 * 
 * @param props - Button component props
 * @returns JSX element
 * 
 * @example
 * ```tsx
 * <Button 
 *   variant="primary" 
 *   size="lg" 
 *   loading={isSubmitting}
 *   leftIcon={<TicketIcon />}
 *   onClick={handleParticipate}
 * >
 *   Participate in Raffle
 * </Button>
 * ```
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth, 
    loading = false,
    leftIcon,
    rightIcon,
    disabled,
    children,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading;
    
    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {loading && (
          <LoadingSpinner 
            size={size === 'sm' || size === 'xs' ? 'sm' : size === 'lg' || size === 'xl' ? 'lg' : 'default'} 
          />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Icon button component for icon-only buttons
 * 
 * @param props - IconButton component props
 * @returns JSX element
 */
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  icon: React.ReactNode;
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, className, size = 'icon', ...props }, ref) => (
    <Button
      ref={ref}
      size={size}
      className={className}
      {...props}
    >
      {icon}
    </Button>
  )
);

IconButton.displayName = 'IconButton';

/**
 * Button group component for related actions
 * 
 * @param props - ButtonGroup component props
 * @returns JSX element
 */
export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'none' | 'sm' | 'default' | 'lg';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
  spacing = 'default',
  ...props
}) => {
  const spacingClasses = {
    none: '',
    sm: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
    default: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
    lg: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
  };

  const orientationClasses = orientation === 'horizontal' ? 'flex' : 'flex flex-col';

  return (
    <div
      className={cn(
        orientationClasses,
        spacingClasses[spacing],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Floating Action Button component
 * 
 * @param props - FAB component props
 * @returns JSX element
 */
export interface FABProps extends Omit<ButtonProps, 'variant' | 'size'> {
  icon: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'default' | 'lg';
}

export const FAB: React.FC<FABProps> = ({
  icon,
  position = 'bottom-right',
  size = 'default',
  className,
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  };

  const sizeClasses = {
    default: 'h-12 w-12',
    lg: 'h-16 w-16',
  };

  return (
    <Button
      variant="primary"
      className={cn(
        positionClasses[position],
        sizeClasses[size],
        'rounded-full shadow-lg hover:shadow-xl transition-shadow z-50',
        className
      )}
      {...props}
    >
      {icon}
    </Button>
  );
};

/**
 * Social login button component
 * 
 * @param props - SocialButton component props
 * @returns JSX element
 */
export interface SocialButtonProps extends Omit<ButtonProps, 'variant'> {
  provider: 'farcaster' | 'wallet' | 'twitter' | 'discord';
  providerName?: string;
}

export const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  providerName,
  children,
  className,
  leftIcon,
  ...props
}) => {
  const providerConfig = {
    farcaster: {
      className: 'bg-purple-600 hover:bg-purple-700 text-white',
      icon: '🟣',
      name: 'Farcaster',
    },
    wallet: {
      className: 'bg-blue-600 hover:bg-blue-700 text-white',
      icon: '👛',
      name: 'Wallet',
    },
    twitter: {
      className: 'bg-sky-500 hover:bg-sky-600 text-white',
      icon: '🐦',
      name: 'Twitter',
    },
    discord: {
      className: 'bg-indigo-600 hover:bg-indigo-700 text-white',
      icon: '🎮',
      name: 'Discord',
    },
  };

  const config = providerConfig[provider];
  const displayName = providerName || config.name;

  return (
    <Button
      variant="outline"
      className={cn(config.className, className)}
      leftIcon={leftIcon || config.icon}
      fullWidth
      {...props}
    >
      {children || `Continue with ${displayName}`}
    </Button>
  );
};