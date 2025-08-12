import { cn } from "@/lib/utils"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

export function LoadingSpinner({ size = "md", className, text }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "scale-50",
    md: "scale-100", 
    lg: "scale-150"
  }

  return (
    <div className={cn("flex flex-col items-center justify-center min-h-screen", className)}>
      <div className={cn("relative", sizeClasses[size])}>
        <div className="boxes">
          <div className="box">
            <div />
            <div />
            <div />
            <div />
          </div>
          <div className="box">
            <div />
            <div />
            <div />
            <div />
          </div>
          <div className="box">
            <div />
            <div />
            <div />
            <div />
          </div>
          <div className="box">
            <div />
            <div />
            <div />
            <div />
          </div>
        </div>
      </div>
      {text && (
        <p className="text-sm text-gray-500 mt-2">{text}</p>
      )}
    </div>
  )
}
