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
      className={`group relative rounded-2xl border border-white/5 bg-surface-glass text-foreground shadow-sm backdrop-blur-xl transition-all duration-500 hover:bg-surface-glass-hover hover:border-white/10 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-1 ${spanClass} ${className || ''}`}
      {...props}
    >
      {/* Inner subtle gradient overlay for MNC aesthetic */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none rounded-2xl"></div>
      <div className="relative z-10 h-full">
        {props.children}
      </div>
    </div>
  )
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`flex flex-col space-y-1.5 p-md relative z-10 ${className}`}
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
    <div className={`p-md pt-0 relative z-10 h-full ${className}`} {...props} />
  )
}
