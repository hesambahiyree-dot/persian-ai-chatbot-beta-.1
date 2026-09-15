import { forwardRef, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={cn(
          "w-full resize-none rounded-lg border border-border bg-surface px-3 py-3 text-base text-fg placeholder:text-subtle outline-none transition-shadow duration-150 focus:ring-2 focus:ring-ring/40",
          className,
        )}
        {...props}
      />
    );
  },
);
