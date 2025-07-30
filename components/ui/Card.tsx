/**
 * Card Component
 * 
 * A flexible card component that provides a consistent container style
 * throughout the application. Supports multiple variants and sizes.
 * 
 * @module Components/UI/Card
 * @version 1.0.0
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Card component variants using class-variance-authority
 */
const cardVariants = cva(
  'rounded-lg border bg-card text-card-foreground shadow-sm',
  {
    variants: {
      variant: {
        default: 'bg-white border-gray-200',
        elevated: 'bg-white border-gray-200 shadow-md',
        outlined: 'bg-transparent border-2 border-gray-300',
        ghost: 'bg-transparent border-none shadow-none',
        gradient: 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200',
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
      },
      interactive: {
        true: 'transition-all duration-200 hover:shadow-md hover:scale-[1.02] cursor-pointer',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      interactive: false,
    },
  }
);

/**
 * Props for the Card component
 */
export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Whether the card should be interactive (hover effects) */
  interactive?: boolean;
  /** Custom className to apply to the card */
  className?: string;
  /** Child elements to render inside the card */
  children: React.ReactNode;
}

/**
 * Card component for creating consistent containers
 * 
 * @param props - Card component props
 * @returns JSX element
 * 
 * @example
 * ```tsx
 * <Card variant="elevated" size="lg">
 *   <CardHeader>
 *     <CardTitle>Raffle Status</CardTitle>
 *   </CardHeader>
 *   <CardContent>
 *     <p>Your current tickets: 5</p>
 *   </CardContent>
 * </Card>
 * ```
 */
export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, size, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, size, interactive, className }))}
      {...props}
    />
  )
);

Card.displayName = 'Card';

/**
 * Props for CardHeader component
 */
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

/**
 * Card header component for titles and actions
 * 
 * @param props - CardHeader component props
 * @returns JSX element
 */
export const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

/**
 * Props for CardTitle component
 */
export interface CardTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children: React.ReactNode;
  /** Heading level (h1-h6) */
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * Card title component for consistent heading styles
 * 
 * @param props - CardTitle component props
 * @returns JSX element
 */
export const CardTitle = React.forwardRef<HTMLDivElement, Omit<CardTitleProps, 'level'>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'text-2xl font-semibold leading-none tracking-tight',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

CardTitle.displayName = 'CardTitle';

/**
 * Props for CardDescription component
 */
export interface CardDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children: React.ReactNode;
}

/**
 * Card description component for subtitle text
 * 
 * @param props - CardDescription component props
 * @returns JSX element
 */
export const CardDescription = React.forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

/**
 * Props for CardContent component
 */
export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

/**
 * Card content component for main content area
 * 
 * @param props - CardContent component props
 * @returns JSX element
 */
export const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

/**
 * Props for CardFooter component
 */
export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  children: React.ReactNode;
}

/**
 * Card footer component for actions and additional content
 * 
 * @param props - CardFooter component props
 * @returns JSX element
 */
export const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';

/**
 * Stat card component for displaying metrics
 * 
 * @param props - StatCard component props
 * @returns JSX element
 */
export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    label: string;
    direction: 'up' | 'down' | 'neutral';
  };
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  icon,
  trend,
  className,
}) => {
  const getTrendColor = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getTrendIcon = (direction: 'up' | 'down' | 'neutral') => {
    switch (direction) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          {title}
        </CardTitle>
        {icon && <div className="h-4 w-4">{icon}</div>}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={cn('flex items-center text-xs', getTrendColor(trend.direction))}>
            <span className="mr-1">{getTrendIcon(trend.direction)}</span>
            <span>{trend.value}% {trend.label}</span>
          </div>
        )}
      </div>
    </Card>
  );
};