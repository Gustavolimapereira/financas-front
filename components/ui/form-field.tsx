import { forwardRef, type InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, hint, id, className = "", ...props },
  ref,
) {
  const fieldId = id || props.name;
  const describedBy = error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined;
  return (
    <div className="field">
      <label htmlFor={fieldId}>{label}{props.required && <span aria-hidden="true"> *</span>}</label>
      <input ref={ref} id={fieldId} className={`${error ? "input-error" : ""} ${className}`} aria-invalid={Boolean(error)} aria-describedby={describedBy} {...props} />
      {error ? <span className="field-error" id={`${fieldId}-error`} role="alert">{error}</span> : hint ? <span className="field-hint" id={`${fieldId}-hint`}>{hint}</span> : null}
    </div>
  );
});
