import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'
import { Card } from './card'

interface InlineErrorProps {
  message: string
  onRetry?: () => void
  compact?: boolean
}

export function InlineError({ message, onRetry, compact = false }: InlineErrorProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
        <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
        <span className="text-sm text-red-700 flex-1">{message}</span>
        {onRetry && (
          <Button variant="ghost" size="sm" onClick={onRetry} className="h-6 px-2">
            <RefreshCw className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className="p-6 border-red-200 bg-red-50">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <h3 className="font-barlow font-semibold text-red-800 mb-1">
            Wystąpił błąd
          </h3>
          <p className="text-sm text-red-700 mb-3">{message}</p>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100">
              <RefreshCw className="h-4 w-4 mr-2" />
              Spróbuj ponownie
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}