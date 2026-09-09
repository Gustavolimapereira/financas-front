import { describe, expect, it } from "vitest";
import { entrySchema, parseBrlMoney } from "@/lib/forms";

describe("criação manual", () => {
  it("converte valor brasileiro e monta um payload válido", () => {
    const result = entrySchema.parse({ lugar: "Conta de energia", valor: parseBrlMoney("185,90"), mesReferencia: "2026-07", tipo: "SAIDA" });
    expect(result).toEqual({ lugar: "Conta de energia", valor: 185.9, mesReferencia: "2026-07", tipo: "SAIDA" });
  });

  it("rejeita mês fora do padrão esperado", () => {
    expect(entrySchema.safeParse({ lugar: "Mercado", valor: 10, mesReferencia: "07/2026", tipo: "SAIDA" }).success).toBe(false);
  });

  it("aceita um ganho como entrada", () => {
    expect(entrySchema.parse({ lugar: "Salário", valor: 3500, mesReferencia: "2026-07", tipo: "ENTRADA" }).tipo).toBe("ENTRADA");
  });
});
