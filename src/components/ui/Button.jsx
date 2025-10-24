import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg hover:shadow-xl",
        destructive:
          "bg-gradient-to-r from-red-600 to-red-700 text-white hover:shadow-lg",
        outline:
          "border-2 border-purple-600 bg-transparent text-purple-600 hover:bg-purple-50 dark:border-purple-400 dark:text-purple-400 dark:hover:bg-purple-950",
        secondary:
          "bg-purple-100 text-purple-900 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:hover:bg-purple-800",
        ghost:
          "hover:bg-purple-100 hover:text-purple-900 dark:hover:bg-purple-900 dark:hover:text-purple-100",
        link: "text-purple-600 underline-offset-4 hover:underline dark:text-purple-400",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 px-4 py-2",
        lg: "h-13 px-8 py-4",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button, buttonVariants };
