/**
 * RTL-aware Form wrapper component that handles direction-based form layouts
 */

import React from "react";
import { cn } from "../../lib/utils";
import { useRTLForm } from "../../hooks/useRTL";

interface RTLFormProps {
  children: React.ReactNode;
  className?: string;
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void;
  layout?: "vertical" | "horizontal" | "inline";
  gap?: "sm" | "md" | "lg";
  labelPosition?: "auto" | "start" | "end" | "top";
  dir?: "ltr" | "rtl" | "auto";
  noValidate?: boolean;
}

const layoutClasses = {
  vertical: "flex flex-col",
  horizontal: "grid grid-cols-12 items-center",
  inline: "flex flex-wrap items-center",
};

const gapClasses = {
  sm: "gap-2",
  md: "gap-4",
  lg: "gap-6",
};

export const RTLForm: React.FC<RTLFormProps> = ({
  children,
  className,
  onSubmit,
  layout = "vertical",
  gap = "md",
  labelPosition = "auto",
  dir = "auto",
  noValidate = false,
}) => {
  const { form, isRTL } = useRTLForm();

  const formDir = dir === "auto" ? (isRTL ? "rtl" : "ltr") : dir;

  const formClasses = cn(
    "rtl-form",
    layoutClasses[layout],
    gapClasses[gap],
    className,
  );

  // Create context value for form fields
  const formContext = React.useMemo(
    () => ({
      isRTL,
      layout,
      labelPosition:
        labelPosition === "auto" ? form.labelPosition : labelPosition,
      inputDirection: form.inputDirection,
    }),
    [isRTL, layout, labelPosition, form.labelPosition, form.inputDirection],
  );

  return (
    <RTLFormProvider value={formContext}>
      <form
        className={formClasses}
        onSubmit={onSubmit}
        dir={formDir}
        noValidate={noValidate}
        data-rtl={isRTL}
        data-layout={layout}
      >
        {children}
      </form>
    </RTLFormProvider>
  );
};

// Form context for sharing form configuration with child components
const RTLFormContext = React.createContext<{
  isRTL: boolean;
  layout: "vertical" | "horizontal" | "inline";
  labelPosition: string;
  inputDirection: string;
} | null>(null);

const RTLFormProvider = RTLFormContext.Provider;

export const useRTLFormContext = () => {
  const context = React.useContext(RTLFormContext);
  if (!context) {
    throw new Error("useRTLFormContext must be used within an RTLForm");
  }
  return context;
};

// RTL-aware form field component
interface RTLFormFieldProps {
  children: React.ReactNode;
  label?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  errorClassName?: string;
}

export const RTLFormField: React.FC<RTLFormFieldProps> = ({
  children,
  label,
  error,
  required,
  className,
  labelClassName,
  inputClassName,
  errorClassName,
}) => {
  const { isRTL, layout, labelPosition, inputDirection } = useRTLFormContext();
  const { text } = useRTLForm();

  const fieldClasses = cn(
    "rtl-form-field",
    layout === "horizontal" &&
      "col-span-12 grid grid-cols-12 gap-4 items-center",
    layout === "inline" && "flex items-center gap-2",
    className,
  );

  const labelClasses = cn(
    "rtl-form-label",
    layout === "horizontal" && "col-span-3",
    layout === "vertical" && "block mb-1",
    "font-medium text-sm",
    text.alignClass(
      labelPosition === "start" || labelPosition === "end"
        ? (labelPosition as "start" | "end")
        : "start",
    ),
    labelClassName,
  );

  const inputWrapperClasses = cn(
    "rtl-form-input-wrapper",
    layout === "horizontal" && "col-span-9",
    inputClassName,
  );

  const errorClasses = cn(
    "rtl-form-error",
    "text-sm text-red-500 mt-1",
    text.alignClass("start"),
    errorClassName,
  );

  return (
    <div className={fieldClasses} data-rtl={isRTL}>
      {label && (
        <label className={labelClasses} dir={inputDirection}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className={inputWrapperClasses}>
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child) && child.type === "input") {
            return React.cloneElement(child, {
              dir: inputDirection,
              ...child.props,
            });
          }
          return child;
        })}
        {error && (
          <div className={errorClasses} dir={inputDirection}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};
