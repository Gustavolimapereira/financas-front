"use client";

import { useAuth } from "@/components/auth/auth-provider";
import { formatDate } from "@/lib/format";
import { ProfileForms } from "@/components/profile/profile-forms";

export default function ProfilePage() {
  const { user } = useAuth();
  return <><div className="page-heading compact"><div><span className="eyebrow">MINHA CONTA</span><h1>Perfil</h1><p>Gerencie seus dados pessoais e sua segurança.</p></div></div><div className="profile-header"><span className="profile-avatar">{user.name.charAt(0).toUpperCase()}</span><div><h2>{user.name}</h2><p>{user.email}</p><small>Membro desde {formatDate(user.createdAt)}</small></div><span className="role-badge">{user.role === "ADMIN" ? "Administrador" : "Usuário"}</span></div><ProfileForms/></>;
}
