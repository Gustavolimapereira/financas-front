import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = { title: "Criar conta" };

export default function RegisterPage() {
  return <div className="auth-card register-card"><div className="mobile-auth-brand"><span>F</span>Finora</div><div className="auth-heading"><span className="eyebrow">COMECE AGORA</span><h2>Crie sua conta</h2><p>Leva menos de um minuto.</p></div><RegisterForm/><p className="auth-switch">Já tem uma conta? <Link href="/login">Entrar</Link></p></div>;
}
