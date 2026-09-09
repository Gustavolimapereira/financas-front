import type { FinancialEntry } from "@/types/api";
import { formatCurrency, formatReferenceMonth } from "@/lib/format";
import { OriginBadge } from "@/components/ui/origin-badge";
import { TypeBadge } from "@/components/ui/type-badge";

export function ImportedEntriesTable({ entries }: { entries: FinancialEntry[] }) {
  if (!entries.length) return <p className="table-empty">O backend não retornou valores na importação.</p>;
  return <div className="table-wrap"><table><caption className="sr-only">Registros importados</caption><thead><tr><th>Descrição</th><th>Mês</th><th>Tipo</th><th>Origem</th><th className="align-right">Valor</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.id}><td><strong>{entry.lugar}</strong></td><td className="capitalize">{formatReferenceMonth(entry.mesReferencia)}</td><td><TypeBadge type={entry.tipo ?? "SAIDA"}/></td><td><OriginBadge origin={entry.origem}/></td><td className="align-right value-cell">{formatCurrency(entry.valor)}</td></tr>)}</tbody></table></div>;
}
