import * as React from "react";
import { cn } from "@/lib/utils"

const CyberCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-cyber rounded-xl text-card-foreground shadow", className)}
    {...props}
  />
))
CyberCard.displayName = "CyberCard"

const CyberCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CyberCardHeader.displayName = "CyberCardHeader"

const CyberCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("font-cyber text-2xl font-semibold leading-none tracking-tight text-primary", className)}
    {...props}
  />
))
CyberCardTitle.displayName = "CyberCardTitle"

const CyberCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
))
CyberCardDescription.displayName = "CyberCardDescription"

const CyberCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CyberCardContent.displayName = "CyberCardContent"

const CyberCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
))
CyberCardFooter.displayName = "CyberCardFooter"

export { CyberCard, CyberCardHeader, CyberCardFooter, CyberCardTitle, CyberCardDescription, CyberCardContent }