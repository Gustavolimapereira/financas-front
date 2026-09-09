"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api-client";
import { registerSchema, schemaErrors, type FieldErrors } from "@/lib/forms";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";

export function RegisterForm() {
  const router = useRouter();
  const [fields, setFields] = useState({ name: "", email: "", password: "", passwordConfirmation: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setRequestError("");
    const result = registerSchema.safeParse(fields);
    if (!result.success) return setErrors(schemaErrors(result.error));
    setErrors({}); setLoading(true);
    try {
      await apiRequest("/api/users", { method: "POST", body: JSON.stringify({ name: result.data.name, email: result.data.email, password: result.data.password }) });
      router.push("/login?cadastro=sucesso");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Não foi possível criar sua conta.");
    } finally { setLoading(false); }
  }

  const update = (name: keyof typeof fields) => (event: React.ChangeEvent<HTMLInputElement>) => setFields({ ...fields, [name]: event.target.value });
  return <form onSubmit={handleSubmit} noValidate className="auth-form">
    {requestError && <Alert>{requestError}</Alert>}
    <FormField label="Nome completo" name="name" autoComplete="name" placeholder="Como podemos chamar você?" required value={fields.name} error={errors.name} onChange={update("name")}/>
    <FormField label="E-mail" name="email" type="email" autoComplete="email" placeholder="voce@exemplo.com" required value={fields.email} error={errors.email} onChange={update("email")}/>
    <FormField label="Senha" name="password" type="password" autoComplete="new-password" placeholder="Mínimo de 8 caracteres" required value={fields.password} error={errors.password} onChange={update("password")}/>
    <FormField label="Confirme sua senha" name="passwordConfirmation" type="password" autoComplete="new-password" placeholder="Digite a senha novamente" required value={fields.passwordConfirmation} error={errors.passwordConfirmation} onChange={update("passwordConfirmation")}/>
    <button className="button button-primary button-full" disabled={loading}>{loading ? <><span className="spinner"/>Criando conta...</> : "Criar minha conta"}</button>
  </form>;
}
