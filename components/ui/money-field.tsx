import { useState, type InputHTMLAttributes } from "react";

interface MoneyFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> {
  label: string;
  error?: string;
  value: string;
  onChange: (value: string) => void;
}

export function MoneyField({ label, error, value, onChange, id = "valor", ...props }: MoneyFieldProps) {
  const [focused, setFocused] = useState(false);
  return <div className="field"><label htmlFor={id}>{label}</label><div className={`money-input ${focused ? "focused" : ""} ${error ? "input-error" : ""}`}><span>R$</span><input id={id} type="text" inputMode="decimal" placeholder="0,00" value={value} onChange={(event) => onChange(event.target.value)} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...props}/></div>{error && <span className="field-error" id={`${id}-error`} role="alert">{error}</span>}</div>;
}
