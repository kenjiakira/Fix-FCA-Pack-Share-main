import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SmartLayoutProps {
  children: ReactNode
  className?: string
  variant?: 'compact' | 'comfortable' | 'spacious'
  maxWidth?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full'
}

export function SmartLayout({
  children,
  className,
  variant = 'comfortable',
  maxWidth = 'full'
}: SmartLayoutProps) {
  const variantClasses = {
    compact: 'p-2 sm:p-3',
    comfortable: 'p-4 sm:p-6 lg:p-8',
    spacious: 'p-6 sm:p-8 lg:p-12'
  }

  const maxWidthClasses = {
    none: '',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn(
      "mx-auto w-full",
      maxWidthClasses[maxWidth],
      variantClasses[variant],
      className
    )}>
      {children}
    </div>
  )
}
