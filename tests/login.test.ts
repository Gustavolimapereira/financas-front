import { describe, expect, it } from "vitest";
import { loginSchema } from "@/lib/forms";

describe("login", () => {
  it("aceita credenciais válidas", () => {
    const result = loginSchema.safeParse({ email: "gustavo@email.com", password: "senha123" });
    expect(result.success).toBe(true);
  });

  it("rejeita e-mail inválido e senha curta", () => {
    const result = loginSchema.safeParse({ email: "email-invalido", password: "123" });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.issues.map((issue) => issue.path[0])).toEqual(["email", "password"]);
  });
});
