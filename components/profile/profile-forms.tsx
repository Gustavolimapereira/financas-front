"use client";

import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import type { User } from "@/types/api";

export function ProfileForms() {
  const { user, setUser } = useAuth();
  const [profile, setProfile] = useState({ name: user.name, email: user.email });
  const [passwords, setPasswords] = useState({ password: "", confirmation: "" });
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState<"profile" | "password" | null>(null);

  async function saveProfile(event: FormEvent) {
    event.preventDefault(); setProfileMessage(null);
    if (profile.name.trim().length < 3) return setProfileMessage({ type: "error", text: "O nome deve ter pelo menos 3 caracteres." });
    if (!/^\S+@\S+\.\S+$/.test(profile.email)) return setProfileMessage({ type: "error", text: "Informe um e-mail válido." });
    setLoading("profile");
    try {
      const updated = await apiRequest<User | undefined>("/api/me", { method: "PATCH", body: JSON.stringify(profile) });
      setUser(updated ?? await apiRequest<User>("/api/me"));
      setProfileMessage({ type: "success", text: "Dados pessoais atualizados com sucesso." });
    }
    catch (error) { setProfileMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível atualizar o perfil." }); }
    finally { setLoading(null); }
  }

  async function savePassword(event: FormEvent) {
    event.preventDefault(); setPasswordMessage(null);
    if (passwords.password.length < 8) return setPasswordMessage({ type: "error", text: "A nova senha deve ter pelo menos 8 caracteres." });
    if (passwords.password !== passwords.confirmation) return setPasswordMessage({ type: "error", text: "As senhas não coincidem." });
    setLoading("password");
    try { await apiRequest<User | undefined>("/api/me", { method: "PATCH", body: JSON.stringify({ password: passwords.password }) }); setPasswords({ password: "", confirmation: "" }); setPasswordMessage({ type: "success", text: "Senha alterada com sucesso." }); }
    catch (error) { setPasswordMessage({ type: "error", text: error instanceof Error ? error.message : "Não foi possível alterar a senha." }); }
    finally { setLoading(null); }
  }

  return <div className="profile-stack"><section className="profile-card"><div className="profile-title"><h2>Dados pessoais</h2><p>Atualize suas informações de identificação.</p></div><form onSubmit={saveProfile}><div className="form-body">{profileMessage && <Alert type={profileMessage.type}>{profileMessage.text}</Alert>}<div className="two-columns"><FormField id="profile-name" name="name" label="Nome completo" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })}/><FormField id="profile-email" name="email" label="E-mail" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })}/></div></div><div className="form-footer"><button className="button button-primary" disabled={loading === "profile"}>{loading === "profile" ? "Salvando..." : "Salvar alterações"}</button></div></form></section><section className="profile-card"><div className="profile-title"><h2>Alterar senha</h2><p>Use pelo menos 8 caracteres para manter sua conta segura.</p></div><form onSubmit={savePassword}><div className="form-body">{passwordMessage && <Alert type={passwordMessage.type}>{passwordMessage.text}</Alert>}<div className="two-columns"><FormField id="new-password" name="password" label="Nova senha" type="password" autoComplete="new-password" value={passwords.password} onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}/><FormField id="password-confirmation" name="confirmation" label="Confirme a nova senha" type="password" autoComplete="new-password" value={passwords.confirmation} onChange={(e) => setPasswords({ ...passwords, confirmation: e.target.value })}/></div></div><div className="form-footer"><button className="button button-primary" disabled={loading === "password"}>{loading === "password" ? "Alterando..." : "Alterar senha"}</button></div></form></section></div>;
}
