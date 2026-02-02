import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  showPercentage?: boolean
  size?: "sm" | "md" | "lg"
  variant?: "default" | "success" | "warning" | "destructive"
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, showPercentage = true, size = "md", variant = "default", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
    
    const sizeClasses = {
      sm: "h-1.5",
      md: "h-2", 
      lg: "h-3"
    }
    
    const variantClasses = {
      default: "bg-primary",
      success: "bg-success",
      warning: "bg-warning", 
      destructive: "bg-destructive"
    }

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {showPercentage && (
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
        )}
        <div className={cn(
          "w-full bg-secondary rounded-full overflow-hidden",
          sizeClasses[size]
        )}>
          <div
            className={cn(
              "h-full transition-all duration-1000 ease-out rounded-full",
              variantClasses[variant]
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"

export { ProgressBar }