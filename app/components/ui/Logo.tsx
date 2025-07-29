/**
 * Logo Component
 * 
 * Reusable logo component with different variants and sizes
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'default' | 'loading' | 'badge';
  className?: string;
  showBrand?: boolean;
  badge?: React.ReactNode;
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12', 
  lg: 'w-16 h-16',
  xl: 'w-24 h-24'
};

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md',
  variant = 'default',
  className,
  showBrand = false,
  badge
}) => {
  const logoElement = (
    <div className={cn(
      sizeMap[size],
      'rounded-2xl overflow-hidden shadow-2xl ring-4 ring-amber-200/50 dark:ring-amber-800/50 relative',
      variant === 'loading' && 'animate-pulse',
      className
    )}>
      <img 
        src="/logo.png" 
        alt="Like2Win Logo" 
        className="w-full h-full object-contain bg-white"
      />
      
      {/* Loading animation overlay */}
      {variant === 'loading' && (
        <div className="absolute inset-0 rounded-2xl border-4 border-transparent border-t-amber-500 border-r-yellow-500 animate-spin"></div>
      )}
      
      {/* Badge overlay */}
      {badge && (
        <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
          {badge}
        </div>
      )}
    </div>
  );

  if (showBrand) {
    return (
      <div className="flex flex-col items-center space-y-3">
        {logoElement}
        <h1 className="text-2xl font-bold">
          <span className="bg-gradient-to-r from-amber-600 via-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Like2Win
          </span>
        </h1>
      </div>
    );
  }

  return logoElement;
};