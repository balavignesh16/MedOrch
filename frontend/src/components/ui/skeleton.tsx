import * as React from "react"
import { Card, CardContent, CardHeader } from "./card"

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-white/5 ${className}`}
      {...props}
    />
  )
}

export function KPISkeleton() {
  return (
    <Card widgetSize="sm" className="h-32 flex flex-col justify-between">
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-3/4 mb-2" />
        <Skeleton className="h-3 w-1/4" />
      </CardContent>
    </Card>
  )
}

export function ChartSkeleton() {
  return (
    <Card widgetSize="lg" className="h-96 flex flex-col">
      <CardHeader>
        <Skeleton className="h-5 w-1/3" />
      </CardHeader>
      <CardContent className="flex-1">
        <Skeleton className="h-full w-full" />
      </CardContent>
    </Card>
  )
}

export function InsightSkeleton() {
  return (
    <Card widgetSize="xl" className="h-24 flex items-center p-4 space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-3 w-3/4" />
      </div>
    </Card>
  )
}

export function AlertSkeleton() {
  return (
    <Card widgetSize="md" className="h-20 flex items-center p-4 space-x-4 border-l-4 border-l-white/10">
      <Skeleton className="h-8 w-8 rounded-md" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </Card>
  )
}

export function DrawerSkeleton() {
  return (
    <div className="h-full w-[400px] bg-surface-glass border-l border-border-glass p-6 space-y-6">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-32 w-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/6" />
      </div>
      <Skeleton className="h-40 w-full" />
    </div>
  )
}
