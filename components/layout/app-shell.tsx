"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import { CloseIcon, GridIcon, LogoutIcon, MenuIcon, PlusIcon, ReceiptIcon, UploadIcon, UserIcon, WalletIcon } from "@/components/ui/icons";

const links = [
  { href: "/dashboard", label: "Visão geral", icon: GridIcon },
  { href: "/contas", label: "Contas", icon: ReceiptIcon },
  { href: "/contas/nova", label: "Novo lançamento", icon: PlusIcon },
  { href: "/contas/importar", label: "Importar CSV", icon: UploadIcon },
  { href: "/perfil", label: "Meu perfil", icon: UserIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function logout() {
    setLoggingOut(true);
    try { await apiRequest<void>("/api/auth/logout", { method: "POST" }); }
    finally { router.replace("/login"); router.refresh(); }
  }

  return <div className="app-shell">
    {menuOpen && <button className="sidebar-backdrop" aria-label="Fechar menu" onClick={() => setMenuOpen(false)}/>} 
    <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
      <div className="brand"><span className="brand-mark"><WalletIcon /></span><span>Finora</span><button className="sidebar-close" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><CloseIcon /></button></div>
      <p className="nav-label">MENU PRINCIPAL</p>
      <nav>{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={pathname === href || (href === "/contas" && pathname.startsWith("/contas/") && !links.some((link) => link.href === pathname)) ? "active" : ""}><Icon />{label}</Link>)}</nav>
      <div className="sidebar-foot"><div className="sidebar-user"><span>{user.name.charAt(0).toUpperCase()}</span><div><strong>{user.name}</strong><small>{user.email}</small></div></div><button onClick={() => setLogoutOpen(true)} aria-label="Sair"><LogoutIcon /></button></div>
    </aside>
    <div className="main-column">
      <header className="topbar"><button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><MenuIcon /></button><div><span className="mobile-brand">Finora</span></div><Link href="/perfil" className="avatar" aria-label="Abrir perfil">{user.name.charAt(0).toUpperCase()}</Link></header>
      <main className="page-content">{children}</main>
    </div>
    {logoutOpen && <div className="modal-backdrop" role="presentation" onMouseDown={() => setLogoutOpen(false)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="logout-title" onMouseDown={(e) => e.stopPropagation()}><div className="modal-icon"><LogoutIcon /></div><h2 id="logout-title">Deseja sair da sua conta?</h2><p>Você precisará informar suas credenciais novamente para acessar o Finora.</p><div className="modal-actions"><button className="button button-ghost" onClick={() => setLogoutOpen(false)}>Cancelar</button><button className="button button-danger" onClick={logout} disabled={loggingOut}>{loggingOut ? "Saindo..." : "Sim, sair"}</button></div></div></div>}
  </div>;
}
