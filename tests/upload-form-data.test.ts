import { describe, expect, it } from "vitest";
import { buildUploadFormData } from "@/lib/forms";

describe("FormData do upload", () => {
  it("inclui arquivo e mês quando informado", () => {
    const file = new File(["title,amount\nMercado,100.50"], "Nubank.csv", { type: "text/csv" });
    const data = buildUploadFormData(file, "2026-07");
    expect(data.get("file")).toBe(file);
    expect(data.get("mesReferencia")).toBe("2026-07");
  });

  it("não envia mês vazio", () => {
    const file = new File(["title,amount"], "Nubank_2026-07-28.csv", { type: "text/csv" });
    const data = buildUploadFormData(file);
    expect(data.has("mesReferencia")).toBe(false);
  });
});
