import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
  action?: React.ReactNode
}

export default function Card({ children, className, title, subtitle, action }: CardProps) {
  return (
    <div className={cn('bg-white rounded-lg shadow-md border-2 border-gray-300', className)}>
      {(title || subtitle || action) && (
        <div className="px-4 py-3 border-b-2 border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-xs text-gray-600 mt-0.5">{subtitle}</p>}
            </div>
            {action && <div>{action}</div>}
          </div>
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}
