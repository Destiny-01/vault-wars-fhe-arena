import * as React from "react"
import { cn } from "@/lib/utils"

export interface CyberInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const CyberInput = React.forwardRef<HTMLInputElement, CyberInputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "input-cyber flex h-12 w-full rounded-md px-3 py-1 text-base file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm font-mono",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
CyberInput.displayName = "CyberInput"

export { CyberInput }