import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "group/badge inline-flex h-5 w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent px-2 py-0.5 text-[0.625rem] font-medium whitespace-nowrap transition-all focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-2.5!",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary/80",
        secondary:
          "bg-secondary text-secondary-foreground [a]:hover:bg-secondary/80",
        destructive:
          "bg-destructive/10 text-destructive focus-visible:ring-destructive/20 dark:bg-destructive/20 dark:focus-visible:ring-destructive/40 [a]:hover:bg-destructive/20",
        outline:
          "border-border bg-input/20 text-foreground dark:bg-input/30 [a]:hover:bg-muted [a]:hover:text-muted-foreground",
        ghost:
          "hover:bg-muted hover:text-muted-foreground dark:hover:bg-muted/50",
        link: "text-primary underline-offset-4 hover:underline",
        neutral: "bg-cream/10 text-cream border-cream/15",
        chili: "bg-chili/10 text-chili border-chili/25",
        turmeric: "bg-turmeric/10 text-turmeric border-turmeric/25",
        pandan: "bg-pandan/10 text-pandan border-pandan/25",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

interface BadgeProps
  extends React.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  asChild?: boolean
  tone?: string
  icon?: React.ReactNode
}

const toneToVariant: Record<string, string> = {
  neutral: "neutral",
  chili: "chili",
  turmeric: "turmeric",
  pandan: "pandan",
}

function Badge({
  className,
  variant,
  tone,
  icon,
  asChild = false,
  children,
  ...props
}: BadgeProps) {
  const resolvedVariant = (variant ?? (tone ? (toneToVariant[tone] ?? "neutral") : "default")) as NonNullable<VariantProps<typeof badgeVariants>["variant"]>
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={resolvedVariant}
      className={cn(badgeVariants({ variant: resolvedVariant }), className)}
      {...props}
    >
      {icon ? <span aria-hidden>{icon}</span> : null}
      {children}
    </Comp>
  )
}

export { Badge, badgeVariants, type BadgeProps }