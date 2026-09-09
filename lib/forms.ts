import { z } from "zod";

const email = z.string().trim().email("Informe um e-mail válido.");
const password = z.string().min(8, "A senha deve ter pelo menos 8 caracteres.");

export const loginSchema = z.object({ email, password });

export const registerSchema = z
  .object({
    name: z.string().trim().min(3, "O nome deve ter pelo menos 3 caracteres."),
    email,
    password,
    passwordConfirmation: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirmation, {
    message: "As senhas não coincidem.",
    path: ["passwordConfirmation"],
  });

export const entrySchema = z.object({
  lugar: z.string().trim().min(1, "Informe o local ou descrição.").max(255, "Use no máximo 255 caracteres."),
  valor: z.number().positive("O valor deve ser maior que zero.").multipleOf(0.01, "Use no máximo 2 casas decimais."),
  mesReferencia: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Informe um mês válido."),
  tipo: z.enum(["ENTRADA", "SAIDA"]),
});

export type FieldErrors = Record<string, string>;

export function schemaErrors(error: z.ZodError): FieldErrors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0] ?? "form"), issue.message]));
}

export function parseBrlMoney(value: string): number {
  const normalized = value.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  return Number(normalized);
}

export function buildUploadFormData(file: File, mesReferencia?: string): FormData {
  const data = new FormData();
  data.append("file", file);
  if (mesReferencia) data.append("mesReferencia", mesReferencia);
  return data;
}
