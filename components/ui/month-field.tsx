import type { InputHTMLAttributes } from "react";
import { CalendarIcon } from "./icons";

interface MonthFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: string;
  error?: string;
  optional?: boolean;
  hint?: string;
}

export function MonthField({ label, error, optional, hint, id = "mesReferencia", ...props }: MonthFieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return <div className="field"><label htmlFor={id}>{label}{optional && <span className="optional">Opcional</span>}</label><div className="input-icon-wrap"><input id={id} type="month" aria-invalid={Boolean(error)} aria-describedby={describedBy} className={error ? "input-error" : ""} {...props}/><CalendarIcon /></div>{error ? <span className="field-error" id={`${id}-error`} role="alert">{error}</span> : hint ? <span className="field-hint" id={`${id}-hint`}>{hint}</span> : null}</div>;
}
