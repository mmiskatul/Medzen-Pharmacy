"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { AlertCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & {
    optional?: boolean;
  }
>(({ className, children, optional, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn("block text-sm font-medium text-ink", className)}
    {...props}
  >
    {children}
    {optional ? (
      <span className="ml-1.5 text-xs font-normal text-muted">Optional</span>
    ) : null}
  </LabelPrimitive.Root>
));
Label.displayName = "Label";

const controlClasses =
  "w-full rounded-xl border border-line-strong bg-white px-3.5 text-sm text-ink placeholder:text-muted/80 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 disabled:bg-wash disabled:text-muted aria-[invalid=true]:border-danger aria-[invalid=true]:focus:ring-danger/20";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(controlClasses, "h-11", className)} {...props} />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(controlClasses, "min-h-28 resize-y py-2.5", className)}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      controlClasses,
      "h-11 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%236b7a74%22 stroke-width=%222%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_0.75rem_center] bg-no-repeat pr-10",
      className,
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

export function FieldError({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return (
    <p className="flex items-start gap-1.5 text-sm text-danger" role="alert">
      <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>{children}</span>
    </p>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-muted">{children}</p>;
}

/** Label + control + message, wired for accessible error announcements. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  optional,
  children,
  className,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor} optional={optional}>
        {label}
      </Label>
      {children}
      {hint && !error ? <FieldHint>{hint}</FieldHint> : null}
      <FieldError>{error}</FieldError>
    </div>
  );
}
