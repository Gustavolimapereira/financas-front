import { describe, expect, it } from "vitest";
import { calculateFinancialMetrics, calculateFinancialSummary, normalizeFinancialEntriesPage, normalizeFinancialSummary, previousReferenceMonth } from "@/lib/financial-metrics";
import type { FinancialEntry } from "@/types/api";

function entry(id: string, lugar: string, valor: string, tipo: "ENTRADA" | "SAIDA" = "SAIDA"): FinancialEntry {
  return { id, lugar, valor, origem: "FILE", nomeArquivo: "fatura.csv", mesReferencia: "2026-07", inseridoEm: "2026-08-01T12:00:00.000Z", tipo };
}

describe("métricas financeiras", () => {
  it("calcula totais, variação e maior estabelecimento", () => {
    const metrics = calculateFinancialMetrics(
      [entry("1", "Mercado", "100.50"), entry("2", "Posto", "80"), entry("3", "Mercado", "49.50")],
      [entry("4", "Mercado", "200")],
    );

    expect(metrics.total).toBe(230);
    expect(metrics.difference).toBe(30);
    expect(metrics.percentageChange).toBe(15);
    expect(metrics.averageTicket).toBeCloseTo(76.67, 2);
    expect(metrics.topPlace).toMatchObject({ label: "Mercado", value: 150 });
  });

  it("indica ausência de base percentual quando o mês anterior está zerado", () => {
    const metrics = calculateFinancialMetrics([entry("1", "Mercado", "10")], []);
    expect(metrics.percentageChange).toBeNull();
  });

  it("calcula corretamente a virada do ano", () => {
    expect(previousReferenceMonth("2026-01")).toBe("2025-12");
  });

  it("não inclui entradas no total gasto nem no maior estabelecimento", () => {
    const metrics = calculateFinancialMetrics([entry("1", "Salário", "5000", "ENTRADA"), entry("2", "Mercado", "200")], []);
    expect(metrics.total).toBe(200);
    expect(metrics.topPlace?.label).toBe("Mercado");
  });

  it("não deixa pagamentos ou créditos negativos reduzirem o total de saídas", () => {
    const metrics = calculateFinancialMetrics([
      entry("1", "Compra A", "1800.49"),
      entry("2", "Compra B", "880.48"),
      entry("3", "Pagamento da fatura", "-2330.49"),
    ], []);
    expect(metrics.total).toBe(2680.97);
    expect(metrics.groups.some((group) => group.value < 0)).toBe(false);
  });
});

describe("resumo de entradas e saídas", () => {
  it("soma apenas valores positivos conforme o tipo do lançamento", () => {
    expect(calculateFinancialSummary([
      entry("1", "Salário", "4650.22", "ENTRADA"),
      entry("2", "Compras", "2680.97"),
      entry("3", "Pagamento da fatura", "-2330.49"),
    ], "2026-08")).toEqual({ mesReferencia: "2026-08", entradas: 4650.22, saidas: 2680.97, saldo: 1969.25 });
  });

  it("normaliza o contrato mensal em português", () => {
    expect(normalizeFinancialSummary({ mesReferencia: "2026-07", totalEntradas: "5000.00", totalSaidas: "1800.50", saldo: "3199.50" }, "2026-07")).toEqual({
      mesReferencia: "2026-07", entradas: 5000, saidas: 1800.5, saldo: 3199.5,
    });
  });

  it("calcula o resumo usando lançamentos quando o envelope não informa totais", () => {
    expect(normalizeFinancialSummary({}, "2026-07", [entry("1", "Salário", "3000", "ENTRADA"), entry("2", "Aluguel", "1200")])).toEqual({
      mesReferencia: "2026-07", entradas: 3000, saidas: 1200, saldo: 1800,
    });
  });
});

describe("normalização da listagem", () => {
  it("aceita envelope paginado e nomes internos do banco", () => {
    const page = normalizeFinancialEntriesPage({
      data: [{ id: "1", place: "Spani", amount: 311.81, origin: "FILE", sourceFileName: "Nubank.csv", createdAt: "2026-08-20T01:09:57.000Z" }],
      meta: { page: 1, totalPages: 2 },
    }, 1, 100, "2026-07");

    expect(page.hasNextPage).toBe(true);
    expect(page.entries[0]).toMatchObject({ lugar: "Spani", valor: "311.81", nomeArquivo: "Nubank.csv", mesReferencia: "2026-07" });
  });

  it("aceita uma lista direta com os nomes públicos da API", () => {
    const page = normalizeFinancialEntriesPage([entry("1", "Mercado", "20")], 1, 100, "2026-07");
    expect(page.entries).toHaveLength(1);
    expect(page.hasNextPage).toBe(false);
  });
});
