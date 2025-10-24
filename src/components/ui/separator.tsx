
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
  ) => {
    if (children) {
      return (
        <div className={cn("flex items-center", className)}>
          <SeparatorPrimitive.Root
            ref={ref}
            decorative={decorative}
            orientation={orientation}
            className="shrink-0 bg-border flex-1"
            style={orientation === 'horizontal' ? { height: '1px' } : { width: '1px' }}
          />
          <span className="mx-4 text-xs uppercase text-muted-foreground">{children}</span>
          <SeparatorPrimitive.Root
            decorative={decorative}
            orientation={orientation}
            className="shrink-0 bg-border flex-1"
            style={orientation === 'horizontal' ? { height: '1px' } : { width: '1px' }}
          />
        </div>
      );
    }
  
    return (
      <SeparatorPrimitive.Root
        ref={ref}
        decorative={decorative}
        orientation={orientation}
        className={cn(
          "shrink-0 bg-border",
          orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]",
          className
        )}
        {...props}
      />
    );
  }
);
Separator.displayName = SeparatorPrimitive.Root.displayName

export { Separator }
