"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { loginSchema, schemaErrors, type FieldErrors } from "@/lib/forms";
import type { AuthUser } from "@/types/api";
import { Alert } from "@/components/ui/alert";
import { EyeIcon, EyeOffIcon } from "@/components/ui/icons";
import { FormField } from "@/components/ui/form-field";

export function LoginForm() {
  const router = useRouter();
  const [fields, setFields] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setRequestError("");
    const result = loginSchema.safeParse(fields);
    if (!result.success) return setErrors(schemaErrors(result.error));
    setErrors({});
    setLoading(true);
    try {
      await apiRequest<{ user: AuthUser }>("/api/auth/login", { method: "POST", body: JSON.stringify(result.data) });
      router.replace("/dashboard");
      router.refresh();
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "E-mail ou senha inválidos.");
    } finally {
      setLoading(false);
    }
  }

  return <form onSubmit={handleSubmit} noValidate className="auth-form">
    {requestError && <Alert>{requestError}</Alert>}
    <FormField label="E-mail" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required value={fields.email} error={errors.email} onChange={(e) => setFields({ ...fields, email: e.target.value })}/>
    <div className="password-wrap"><FormField label="Senha" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Sua senha" required value={fields.password} error={errors.password} onChange={(e) => setFields({ ...fields, password: e.target.value })}/><button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}>{showPassword ? <EyeOffIcon /> : <EyeIcon />}</button></div>
    <button className="button button-primary button-full" disabled={loading}>{loading ? <><span className="spinner"/>Entrando...</> : "Entrar"}</button>
  </form>;
}
