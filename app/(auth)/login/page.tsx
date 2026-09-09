import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { Alert } from "@/components/ui/alert";

export const metadata: Metadata = { title: "Entrar" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ cadastro?: string; session?: string }> }) {
  const query = await searchParams;
  return <div className="auth-card"><div className="mobile-auth-brand"><span>F</span>Finora</div><div className="auth-heading"><span className="eyebrow">BEM-VINDO DE VOLTA</span><h2>Acesse sua conta</h2><p>Entre com seus dados para continuar.</p></div>{query.cadastro === "sucesso" && <Alert type="success">Conta criada com sucesso. Agora é só entrar.</Alert>}{query.session === "expirada" && <Alert type="info">Sua sessão expirou. Entre novamente para continuar.</Alert>}<LoginForm/><p className="auth-switch">Ainda não tem uma conta? <Link href="/cadastro">Cadastre-se grátis</Link></p></div>;
}
