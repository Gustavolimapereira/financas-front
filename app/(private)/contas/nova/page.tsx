import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon } from "@/components/ui/icons";
import { ManualEntryForm } from "@/components/entries/manual-entry-form";

export const metadata: Metadata = { title: "Novo lançamento" };

export default function NewEntryPage() {
  return <><nav className="breadcrumbs" aria-label="Navegação estrutural"><Link href="/dashboard">Visão geral</Link><ChevronIcon/><span>Novo lançamento</span></nav><div className="page-heading compact"><div><span className="eyebrow">NOVO LANÇAMENTO</span><h1>Adicionar lançamento</h1><p>Registre uma entrada ou saída de forma rápida e simples.</p></div></div><div className="content-narrow"><ManualEntryForm/></div></>;
}
