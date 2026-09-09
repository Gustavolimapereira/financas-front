import Link from "next/link";
import { PlusIcon, WalletIcon } from "./icons";

export function EmptyState() {
  return (
    <div className="empty-state">
      <div className="empty-icon"><WalletIcon /></div>
      <h3>Nenhum lançamento neste mês</h3>
      <p>Cadastre uma conta ou importe um arquivo CSV para começar a acompanhar seus gastos e indicadores.</p>
      <Link href="/contas/nova" className="button button-secondary"><PlusIcon />Adicionar uma conta</Link>
    </div>
  );
}
