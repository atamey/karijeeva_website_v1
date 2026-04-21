import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva } from "class-variance-authority";

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-body font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-brand-parchment disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /* shadcn legacy variants — kept so other components that import Button still render */
        default:
          "bg-primary text-primary-foreground shadow hover:bg-primary/90 rounded-md",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 rounded-md",
        outline:
          "border border-input shadow-sm hover:bg-accent hover:text-accent-foreground rounded-md",
        link: "text-primary underline-offset-4 hover:underline",

        /* Karijeeva brand variants */
        primary:
          "bg-brand-gold text-brand-parchment rounded-pill shadow-soft hover:bg-brand-gold hover:-translate-y-0.5 hover:shadow-card tracking-widest uppercase",
        secondary:
          "bg-transparent text-brand-gold border border-brand-gold rounded-pill hover:bg-brand-gold hover:text-brand-parchment tracking-widest uppercase",
        ghost:
          "bg-transparent text-brand-obsidian hover:bg-brand-parchment-soft rounded-pill tracking-wide",
        dark:
          "bg-brand-obsidian text-brand-gold rounded-pill shadow-soft hover:bg-brand-obsidian-soft hover:-translate-y-0.5 hover:shadow-card tracking-widest uppercase",
      },
      size: {
        sm:  "h-9 px-4 text-xs  [&_svg]:size-4",
        md:  "h-11 px-6 text-sm [&_svg]:size-4",
        lg:  "h-14 px-10 text-sm [&_svg]:size-5",
        icon:"h-10 w-10 rounded-pill [&_svg]:size-4",
        /* legacy */
        default: "h-9 px-4 py-2 text-sm [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
)

const Button = React.forwardRef(({ className, variant, size, asChild = false, loading = false, children, ...props }, ref) => {
  const Comp = asChild ? Slot : "button"
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      data-loading={loading ? "true" : undefined}
      {...props}>
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden />
          <span>{children}</span>
        </span>
      ) : children}
    </Comp>
  );
})
Button.displayName = "Button"

export { Button, buttonVariants }
