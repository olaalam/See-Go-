"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"
import { cn } from "@/lib/utils"

const Switch = React.forwardRef(({ 
  className,
  label,
  checked,
  onCheckedChange,
  ...props 
}, ref) => (
  <div className="flex items-center gap-5">
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-400 focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "data-[state=checked]:bg-bg-primary" : "data-[state=checked]:bg-gray-900",
        "data-[state=unchecked]:bg-gray-200",
        "dark:data-[state=checked]:bg-bg-primary dark:data-[state=unchecked]:bg-gray-700",
        className
      )}
      checked={checked}
      onCheckedChange={onCheckedChange}
      {...props}
      ref={ref}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg",
          "ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0",
          "dark:bg-gray-900"
        )}
      />
    </SwitchPrimitives.Root>
    {label && (
      <label 
        className={cn(
          "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
          checked ? "text-bg-primary dark:text-bg-primary" : "text-foreground"
        )}
        htmlFor={props.id}
      >
        {label}
      </label>
    )}
  </div>
))

Switch.displayName = "Switch"

export { Switch }