import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-sm text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-presi-cyan disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-presi-gold text-presi-bg hover:bg-presi-gold/90",
        secondary: "bg-presi-cyan text-presi-bg hover:bg-presi-cyan/90",
        outline:
          "border border-presi-cyan/30 bg-transparent text-white hover:bg-presi-cyan/10",
        ghost: "text-white/80 hover:bg-white/10 hover:text-presi-cyan",
        destructive: "bg-presi-red text-white hover:bg-presi-red/90",
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
