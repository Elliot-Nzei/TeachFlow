"use client"

import * as React from "react"
import * as SeparatorPrimitive from "@radix-ui/react-separator"

import { cn } from "@/lib/utils"

const Separator = React.forwardRef<
  React.ElementRef<typeof SeparatorPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SeparatorPrimitive.Root>
>(
  (
    { className, orientation = "horizontal", decorative = true, children, ...props },
    ref
  ) => (
    <div className={cn('flex items-center', className)}>
        {children && <div className="flex-1 border-t" />}
        {children && <span className="mx-4 text-xs uppercase text-muted-foreground">{children}</span>}
        <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
            "shrink-0 bg-border",
            children ? "flex-1 border-t" : (orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"),
        )}
        {...props}
        />
        {children && <div className="flex-1 border-t" />}
    </div>
  )
)
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
