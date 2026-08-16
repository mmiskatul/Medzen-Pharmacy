import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-55 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-brand-800 text-white hover:bg-brand-900 active:bg-brand-900",
        // WhatsApp is the pharmacy's counter, so it gets its own weight —
        // filled green, never competing with the neutral secondary.
        whatsapp:
          "bg-brand-600 text-white hover:bg-brand-700 active:bg-brand-700",
        secondary:
          "border border-line-strong bg-white text-ink hover:bg-wash hover:border-brand-200",
        ghost: "text-ink-soft hover:bg-wash hover:text-ink",
        subtle: "bg-brand-50 text-brand-800 hover:bg-brand-100",
        danger: "bg-danger text-white hover:bg-red-800",
        link: "text-brand-700 underline-offset-4 hover:underline p-0 h-auto",
      },
      size: {
        sm: "h-9 px-3.5",
        md: "h-11 px-5",
        lg: "h-13 px-7 text-[0.9375rem]",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" aria-hidden />
            <span>Working…</span>
          </>
        ) : (
          children
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
