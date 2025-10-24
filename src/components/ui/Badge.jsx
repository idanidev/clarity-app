import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-purple-600 text-white hover:bg-purple-700",
        secondary:
          "border-transparent bg-purple-100 text-purple-900 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-100 dark:hover:bg-purple-800",
        destructive:
          "border-transparent bg-red-500 text-white hover:bg-red-600",
        outline: 
          "text-purple-900 dark:text-gray-100 border-purple-200 dark:border-gray-700",
        success:
          "border-transparent bg-green-500 text-white hover:bg-green-600",
        warning:
          "border-transparent bg-orange-500 text-white hover:bg-orange-600",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({ className, variant, ...props }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
