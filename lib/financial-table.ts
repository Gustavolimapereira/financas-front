import type { FinancialEntry } from "@/types/api";

export type EntrySortKey = "lugar" | "tipo" | "origem" | "inseridoEm" | "valor";
export type SortDirection = "asc" | "desc";
export type PaginationItem = number | `ellipsis-${number}`;

function compareEntries(a: FinancialEntry, b: FinancialEntry, key: EntrySortKey): number {
  if (key === "valor") return Number(a.valor) - Number(b.valor);
  if (key === "inseridoEm") return new Date(a.inseridoEm).getTime() - new Date(b.inseridoEm).getTime();
  return a[key].localeCompare(b[key], "pt-BR", { sensitivity: "base", numeric: true });
}

export function sortFinancialEntries(entries: FinancialEntry[], key: EntrySortKey, direction: SortDirection): FinancialEntry[] {
  const multiplier = direction === "asc" ? 1 : -1;
  return entries
    .map((entry, index) => ({ entry, index }))
    .sort((a, b) => compareEntries(a.entry, b.entry, key) * multiplier || a.index - b.index)
    .map(({ entry }) => entry);
}

export function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = [...new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1])]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  return pages.flatMap((page, index) => {
    const previous = pages[index - 1];
    return previous && page - previous > 1 ? [`ellipsis-${page}` as const, page] : [page];
  });
}
