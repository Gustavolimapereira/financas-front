import type { Metadata } from "next";
import Link from "next/link";
import { ChevronIcon } from "@/components/ui/icons";
import { CsvUpload } from "@/components/entries/csv-upload";

export const metadata: Metadata = { title: "Importar CSV" };

export default function ImportPage() {
  return <><nav className="breadcrumbs" aria-label="Navegação estrutural"><Link href="/dashboard">Visão geral</Link><ChevronIcon/><span>Importar CSV</span></nav><div className="page-heading compact"><div><span className="eyebrow">IMPORTAÇÃO EM LOTE</span><h1>Importar arquivo CSV</h1><p>Adicione vários lançamentos de uma só vez.</p></div></div><div className="content-narrow"><CsvUpload/></div></>;
}
