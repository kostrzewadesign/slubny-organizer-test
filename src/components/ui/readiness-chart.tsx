import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface ReadinessChartProps {
  progress: number
  className?: string
}

const ReadinessChart = React.forwardRef<HTMLDivElement, ReadinessChartProps>(
  ({ progress, className }, ref) => {
    const [animatedProgress, setAnimatedProgress] = React.useState(0)
    
    React.useEffect(() => {
      const timer = setTimeout(() => {
        setAnimatedProgress(progress)
      }, 300)
      return () => clearTimeout(timer)
    }, [progress])

    const radius = 90
    const strokeWidth = 12
    const normalizedRadius = radius - strokeWidth * 2
    const circumference = normalizedRadius * 2 * Math.PI
    const strokeDasharray = `${circumference} ${circumference}`
    const strokeDashoffset = circumference - (animatedProgress / 100) * circumference

    return (
      <div ref={ref} className={cn("", className)}>
        <div className="flex flex-col items-center space-y-6">
          <div className="relative">
            <svg
              height={radius * 2}
              width={radius * 2}
              className="transform -rotate-90"
              aria-label={`Gotowość ślubna: ${Math.round(progress)}%`}
            >
              {/* Background circle */}
              <circle
                stroke="hsla(73, 51%, 94%, 1)"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                style={{ strokeDashoffset: 0 }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeLinecap="round"
              />
              {/* Progress circle */}
              <circle
                stroke="#A3B368"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                style={{
                  strokeDashoffset: strokeDashoffset,
                  transition: 'stroke-dashoffset 1000ms ease-out'
                }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                strokeLinecap="round"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-cormorant font-bold text-neutral">
                {Math.round(animatedProgress)}%
              </div>
              <div className="text-sm font-barlow text-neutral/70 mt-1">
                gotowi
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span className="text-sm font-barlow text-neutral/70">Gotowe</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'hsla(73, 51%, 94%, 1)' }}></div>
              <span className="text-sm font-barlow text-neutral/70">Do zrobienia</span>
            </div>
          </div>
        </div>
      </div>
    )
  }
)
ReadinessChart.displayName = "ReadinessChart"

export { ReadinessChart }