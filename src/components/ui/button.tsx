import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-presi-gold disabled:pointer-events-none disabled:opacity-50 min-h-[44px]",
  {
    variants: {
      variant: {
        default: "bg-presi-gold text-presi-bg hover:bg-presi-gold/90",
        cta: "bg-gradient-to-r from-presi-gold to-presi-coral text-presi-bg hover:from-presi-gold/90 hover:to-presi-coral/90 shadow-lg shadow-presi-gold/25",
        secondary:
          "bg-gradient-to-r from-presi-gold to-presi-coral text-presi-bg hover:from-presi-gold/90 hover:to-presi-coral/90",
        gem: "bg-presi-violet/20 border border-presi-violet/45 text-presi-gold hover:bg-presi-violet/30",
        outline:
          "border border-presi-sand/30 bg-transparent text-presi-sand hover:bg-presi-sand/10 hover:text-white",
        ghost: "text-presi-sand/80 hover:bg-presi-sand/10 hover:text-presi-gold min-h-[44px]",
        destructive: "bg-presi-coral text-white hover:bg-presi-coral/90",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-sm px-3 text-xs",
        lg: "h-12 rounded-sm px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
