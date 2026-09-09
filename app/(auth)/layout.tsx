import Link from "next/link";
import { ShieldIcon, WalletIcon } from "@/components/ui/icons";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <main className="auth-layout">
    <section className="auth-visual">
      <Link href="/" className="auth-brand"><span className="brand-mark"><WalletIcon /></span>Finora</Link>
      <div className="auth-pitch"><span className="eyebrow">FINANÇAS SEM COMPLICAÇÃO</span><h1>Clareza para cuidar do que é seu.</h1><p>Organize suas contas, acompanhe seus lançamentos e tome decisões com mais tranquilidade.</p><div className="security-note"><ShieldIcon /><span><strong>Seus dados protegidos</strong><small>Sessão segura, sem tokens expostos no navegador.</small></span></div></div>
      <small className="auth-copyright">© 2026 Finora. Controle financeiro simples.</small>
    </section>
    <section className="auth-panel">{children}</section>
  </main>;
}
