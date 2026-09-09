export type UserRole = "USER" | "ADMIN";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface User extends AuthUser {
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse extends AuthTokens {
  user: AuthUser;
}

export interface BackendError {
  statusCode?: number;
  message?: string | string[] | Record<string, unknown>;
  path?: string;
  error?: string;
}

export type EntryOrigin = "MANUAL" | "FILE";
export type EntryType = "ENTRADA" | "SAIDA";

export interface FinancialEntry {
  id: string;
  lugar: string;
  valor: string;
  origem: EntryOrigin;
  nomeArquivo: string | null;
  mesReferencia: string;
  inseridoEm: string;
  tipo: EntryType;
}

export interface FinancialEntriesPage {
  entries: FinancialEntry[];
  page: number;
  totalPages: number | null;
  hasNextPage: boolean;
}

export interface SpendingGroup {
  label: string;
  value: number;
  percentage: number;
}

export interface FinancialMetrics {
  total: number;
  previousTotal: number;
  difference: number;
  percentageChange: number | null;
  entryCount: number;
  averageTicket: number;
  topPlace: SpendingGroup | null;
  groups: SpendingGroup[];
}

export interface CreateEntryInput {
  lugar: string;
  valor: number;
  mesReferencia: string;
  tipo?: EntryType;
}

export type UpdateEntryInput = CreateEntryInput;

export interface FinancialSummary {
  mesReferencia: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface UploadResponse {
  message: string;
  arquivo: string;
  mesReferencia: string;
  totalRegistrosInseridos: number;
  valores: FinancialEntry[];
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  password?: string;
}
