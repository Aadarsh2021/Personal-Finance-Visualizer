import * as React from "react"
import { cn } from "@/lib/utils"

interface LoadingProps {
  size?: "sm" | "default" | "lg" | "xl"
  variant?: "spinner" | "dots" | "pulse"
  className?: string
  text?: string
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ size = "default", variant = "spinner", className, text, ...props }, ref) => {
    const sizeClasses = {
      sm: "w-4 h-4",
      default: "w-6 h-6",
      lg: "w-8 h-8",
      xl: "w-12 h-12"
    }

    const Spinner = () => (
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-muted border-t-primary",
          sizeClasses[size]
        )}
      />
    )

    const Dots = () => (
      <div className="flex space-x-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className={cn(
              "bg-primary rounded-full animate-pulse",
              size === "sm" ? "w-1 h-1" :
              size === "default" ? "w-2 h-2" :
              size === "lg" ? "w-3 h-3" : "w-4 h-4"
            )}
            style={{
              animationDelay: `${i * 0.2}s`,
              animationDuration: "1s"
            }}
          />
        ))}
      </div>
    )

    const Pulse = () => (
      <div
        className={cn(
          "bg-primary rounded-full animate-pulse",
          sizeClasses[size]
        )}
      />
    )

    const variants = {
      spinner: Spinner,
      dots: Dots,
      pulse: Pulse
    }

    const VariantComponent = variants[variant]

    return (
      <div
        ref={ref}
        className={cn("flex flex-col items-center justify-center space-y-2", className)}
        {...props}
      >
        <VariantComponent />
        {text && (
          <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
        )}
      </div>
    )
  }
)

Loading.displayName = "Loading"

export { Loading } 