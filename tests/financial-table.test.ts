import { describe, expect, it } from "vitest";
import { getPaginationItems, sortFinancialEntries } from "@/lib/financial-table";
import type { FinancialEntry } from "@/types/api";

function entry(id: string, lugar: string, valor: string, insertedAt: string): FinancialEntry {
  return { id, lugar, valor, origem: "MANUAL", tipo: "SAIDA", nomeArquivo: null, mesReferencia: "2026-08", inseridoEm: insertedAt };
}

describe("ordenação da tabela financeira", () => {
  const entries = [
    entry("1", "Posto 10", "80", "2026-08-19T10:00:00.000Z"),
    entry("2", "Mercado", "150", "2026-08-20T10:00:00.000Z"),
    entry("3", "Posto 2", "20", "2026-08-18T10:00:00.000Z"),
  ];

  it("ordena valores numericamente", () => {
    expect(sortFinancialEntries(entries, "valor", "asc").map(({ id }) => id)).toEqual(["3", "1", "2"]);
  });

  it("ordena datas da mais recente para a mais antiga", () => {
    expect(sortFinancialEntries(entries, "inseridoEm", "desc").map(({ id }) => id)).toEqual(["2", "1", "3"]);
  });

  it("ordena descrições usando regras numéricas em português", () => {
    expect(sortFinancialEntries(entries, "lugar", "asc").map(({ id }) => id)).toEqual(["2", "3", "1"]);
  });
});

describe("paginação da tabela financeira", () => {
  it("mostra todas as páginas quando existem até sete", () => {
    expect(getPaginationItems(2, 4)).toEqual([1, 2, 3, 4]);
  });

  it("insere reticências em listas longas", () => {
    expect(getPaginationItems(5, 10)).toEqual([1, "ellipsis-4", 4, 5, 6, "ellipsis-10", 10]);
  });
});
