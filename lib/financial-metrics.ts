import type { FinancialEntriesPage, FinancialEntry, FinancialMetrics, FinancialSummary, SpendingGroup } from "@/types/api";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function firstValue(record: UnknownRecord, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : typeof value === "number" ? String(value) : fallback;
}

function asPositiveInteger(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toCents(value: string | number): number {
  return Math.round(Number(value) * 100);
}

function normalizeEntry(value: unknown, fallbackMonth: string): FinancialEntry | null {
  if (!isRecord(value)) return null;
  const id = asString(firstValue(value, ["id"]));
  const lugar = asString(firstValue(value, ["lugar", "place", "title"]));
  const valor = asString(firstValue(value, ["valor", "amount"]));
  const origem = asString(firstValue(value, ["origem", "origin"]));
  if (!id || !lugar || !Number.isFinite(Number(valor)) || (origem !== "FILE" && origem !== "MANUAL")) return null;

  const fileName = firstValue(value, ["nomeArquivo", "sourceFileName"]);
  return {
    id,
    lugar,
    valor,
    origem,
    nomeArquivo: typeof fileName === "string" ? fileName : null,
    mesReferencia: asString(firstValue(value, ["mesReferencia", "referenceMonth"]), fallbackMonth),
    inseridoEm: asString(firstValue(value, ["inseridoEm", "createdAt"]), new Date(0).toISOString()),
    tipo: asString(firstValue(value, ["tipo", "type"]), "SAIDA") === "ENTRADA" ? "ENTRADA" : "SAIDA",
  };
}

function findEntriesArray(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (!isRecord(payload)) return [];
  for (const key of ["items", "data", "dados", "registros", "entries", "valores"]) {
    const candidate = payload[key];
    if (Array.isArray(candidate)) return candidate;
    if (isRecord(candidate)) {
      const nested = findEntriesArray(candidate);
      if (nested.length) return nested;
    }
  }
  return [];
}

function paginationRecord(payload: unknown): UnknownRecord {
  if (!isRecord(payload)) return {};
  for (const key of ["meta", "paginacao", "pagination"]) {
    if (isRecord(payload[key])) return payload[key] as UnknownRecord;
  }
  return payload;
}

export function normalizeFinancialEntriesPage(
  payload: unknown,
  requestedPage: number,
  pageSize: number,
  fallbackMonth: string,
): FinancialEntriesPage {
  const entries = findEntriesArray(payload).map((item) => normalizeEntry(item, fallbackMonth)).filter((entry): entry is FinancialEntry => entry !== null);
  const pagination = paginationRecord(payload);
  const page = asPositiveInteger(firstValue(pagination, ["pagina", "page", "currentPage"])) ?? requestedPage;
  const totalPages = asPositiveInteger(firstValue(pagination, ["totalPaginas", "totalPages", "lastPage"]));
  const total = asPositiveInteger(firstValue(pagination, ["total", "totalItems", "count"]));
  const hasExplicitNext = firstValue(pagination, ["temProximaPagina", "hasNextPage", "hasNext"]);
  const hasNextPage = typeof hasExplicitNext === "boolean"
    ? hasExplicitNext
    : totalPages
      ? page < totalPages
      : total
        ? page * pageSize < total
        : entries.length === pageSize;
  return { entries, page, totalPages, hasNextPage };
}

export function previousReferenceMonth(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, monthNumber - 2, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function currentReferenceMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function calculateFinancialMetrics(current: FinancialEntry[], previous: FinancialEntry[]): FinancialMetrics {
  const currentExpenses = current.filter((entry) => entry.tipo === "SAIDA" && Number(entry.valor) > 0);
  const previousExpenses = previous.filter((entry) => entry.tipo === "SAIDA" && Number(entry.valor) > 0);
  const total = currentExpenses.reduce((sum, entry) => sum + toCents(entry.valor), 0) / 100;
  const previousTotal = previousExpenses.reduce((sum, entry) => sum + toCents(entry.valor), 0) / 100;
  const difference = Math.round((total - previousTotal) * 100) / 100;
  const percentageChange = previousTotal > 0 ? (difference / previousTotal) * 100 : null;
  const grouped = new Map<string, { label: string; valueInCents: number }>();

  for (const entry of currentExpenses) {
    const label = entry.lugar.trim() || "Sem descrição";
    const key = label.toLocaleLowerCase("pt-BR");
    const existing = grouped.get(key);
    grouped.set(key, { label: existing?.label ?? label, valueInCents: (existing?.valueInCents ?? 0) + toCents(entry.valor) });
  }

  const groups: SpendingGroup[] = [...grouped.values()]
    .sort((a, b) => b.valueInCents - a.valueInCents)
    .map((group) => ({ label: group.label, value: group.valueInCents / 100, percentage: total > 0 ? ((group.valueInCents / 100) / total) * 100 : 0 }));

  return {
    total,
    previousTotal,
    difference,
    percentageChange,
    entryCount: currentExpenses.length,
    averageTicket: currentExpenses.length ? total / currentExpenses.length : 0,
    topPlace: groups[0] ?? null,
    groups,
  };
}

export function calculateFinancialSummary(entries: FinancialEntry[], month: string): FinancialSummary {
  const entradas = entries
    .filter((entry) => entry.tipo === "ENTRADA" && Number(entry.valor) > 0)
    .reduce((sum, entry) => sum + toCents(entry.valor), 0) / 100;
  const saidas = entries
    .filter((entry) => entry.tipo === "SAIDA" && Number(entry.valor) > 0)
    .reduce((sum, entry) => sum + toCents(entry.valor), 0) / 100;
  return { mesReferencia: month, entradas, saidas, saldo: Math.round((entradas - saidas) * 100) / 100 };
}

function numericValue(record: UnknownRecord, keys: string[]): number | null {
  const value = firstValue(record, keys);
  if (isRecord(value)) {
    return numericValue(value, ["total", "valor", "value", "amount"]);
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function normalizeFinancialSummary(payload: unknown, month: string, entries: FinancialEntry[] = []): FinancialSummary {
  const root = isRecord(payload) && isRecord(payload.data) ? payload.data : payload;
  const record = isRecord(root) ? root : {};
  const fallback = calculateFinancialSummary(entries, month);
  const entradas = numericValue(record, ["totalEntradas", "entradas", "income", "totalIncome", "received"]) ?? fallback.entradas;
  const saidas = numericValue(record, ["totalSaidas", "saidas", "expenses", "totalExpenses", "spent"]) ?? fallback.saidas;
  const saldo = numericValue(record, ["saldo", "balance"]) ?? entradas - saidas;
  return { mesReferencia: asString(firstValue(record, ["mesReferencia", "referenceMonth"]), month), entradas, saidas, saldo };
}
