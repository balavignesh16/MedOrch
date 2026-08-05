import * as React from "react"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  widgetSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Card({ className, widgetSize, ...props }: CardProps) {
  const sizeClasses = {
    sm: 'col-span-1',
    md: 'col-span-1 sm:col-span-2',
    lg: 'col-span-1 sm:col-span-2 md:col-span-4',
    xl: 'col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-7',
  };

  const spanClass = widgetSize ? sizeClasses[widgetSize] : '';

  return (
    <div
      className={`rounded-lg border border-border-glass bg-surface-glass text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-surface-glass-hover ${spanClass} ${className || ''}`}
      {...props}
    />
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-md ${className}`}
      {...props}
    />
  )
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={`font-semibold leading-none tracking-tight text-brand-teal ${className}`}
      {...props}
    />
  )
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`p-md pt-0 ${className}`} {...props} />
  )
}
