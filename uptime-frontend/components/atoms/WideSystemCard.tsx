import { Card, CardContent } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WideSystemCardProps {
  title: string
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}

export function WideSystemCard({
  title,
  icon: Icon,
  children,
  className
}: WideSystemCardProps) {
  return (
    <Card className={cn("h-full", className)}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-3 mb-4">
          <Icon className="h-5 w-5 text-slate-600 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <div className="space-y-3">
          {children}
        </div>
      </CardContent>
    </Card>
  )
}
