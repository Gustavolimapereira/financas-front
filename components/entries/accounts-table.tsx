"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api-client";
import { entrySchema, parseBrlMoney, schemaErrors, type FieldErrors } from "@/lib/forms";
import { normalizeFinancialEntriesPage } from "@/lib/financial-metrics";
import { getPaginationItems, sortFinancialEntries, type EntrySortKey, type SortDirection } from "@/lib/financial-table";
import { formatCurrency, formatDate, formatReferenceMonth } from "@/lib/format";
import type { EntryType, FinancialEntry, UpdateEntryInput } from "@/types/api";
import { Alert } from "@/components/ui/alert";
import { FormField } from "@/components/ui/form-field";
import { MoneyField } from "@/components/ui/money-field";
import { MonthField } from "@/components/ui/month-field";
import { OriginBadge } from "@/components/ui/origin-badge";
import { TypeBadge } from "@/components/ui/type-badge";
import { EditIcon, PlusIcon, ReceiptIcon, SearchIcon, TrashIcon, TrendDownIcon, TrendUpIcon, UploadIcon } from "@/components/ui/icons";

const API_PAGE_SIZE = 100;
const TABLE_PAGE_SIZE = 10;

type EditFields = {
  lugar: string;
  valor: string;
  mesReferencia: string;
  tipo: EntryType;
};

function moneyInputValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed)
    ? parsed.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : value;
}

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR").replace(/\s+/g, " ");
}

async function fetchAllEntries(month: string, signal: AbortSignal) {
  const entries: FinancialEntry[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const query = new URLSearchParams({ pagina: String(page), limite: String(API_PAGE_SIZE) });
    if (month) query.set("mesReferencia", month);
    const payload = await apiRequest<unknown>(`/api/financial-entries?${query}`, { signal });
    const normalized = normalizeFinancialEntriesPage(payload, page, API_PAGE_SIZE, month);
    entries.push(...normalized.entries);
    if (!normalized.hasNextPage) break;
  }
  return entries;
}

export function AccountsTable() {
  const [entries, setEntries] = useState<FinancialEntry[]>([]);
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"TODOS" | EntryType>("TODOS");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<EntrySortKey>("inseridoEm");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [editing, setEditing] = useState<FinancialEntry | null>(null);
  const [deleting, setDeleting] = useState<FinancialEntry | null>(null);
  const [editFields, setEditFields] = useState<EditFields>({ lugar: "", valor: "", mesReferencia: "", tipo: "SAIDA" });
  const [editErrors, setEditErrors] = useState<FieldErrors>({});
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchAllEntries(month, controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) setEntries(result);
      })
      .catch((loadError: unknown) => {
        if (loadError instanceof DOMException && loadError.name === "AbortError") return;
        setError(loadError instanceof Error ? loadError.message : "Não foi possível carregar suas contas.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, retryKey]);

  const filteredEntries = useMemo(() => {
    const term = normalizeSearchValue(search);
    const filtered = entries.filter((entry) => {
      const searchableValues = [
        entry.lugar,
        entry.nomeArquivo ?? "",
        entry.valor,
        moneyInputValue(entry.valor),
        formatCurrency(entry.valor),
      ];
      return (typeFilter === "TODOS" || entry.tipo === typeFilter) &&
        (!term || searchableValues.some((value) => normalizeSearchValue(value).includes(term)));
    });
    return sortFinancialEntries(filtered, sortKey, sortDirection);
  }, [entries, search, sortDirection, sortKey, typeFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / TABLE_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const visibleEntries = filteredEntries.slice((safePage - 1) * TABLE_PAGE_SIZE, safePage * TABLE_PAGE_SIZE);
  const paginationItems = getPaginationItems(safePage, totalPages);

  function changeSort(key: EntrySortKey) {
    if (key === sortKey) setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    else {
      setSortKey(key);
      setSortDirection(key === "inseridoEm" ? "desc" : "asc");
    }
    setPage(1);
  }

  function sortableHeader(label: string, key: EntrySortKey, alignRight = false) {
    const active = sortKey === key;
    return <th className={alignRight ? "align-right" : undefined} aria-sort={active ? sortDirection === "asc" ? "ascending" : "descending" : "none"}><button type="button" className={`sort-button ${active ? "active" : ""}`} onClick={() => changeSort(key)}>{label}<span aria-hidden="true" className="sort-indicator">{active ? sortDirection === "asc" ? "↑" : "↓" : "↕"}</span></button></th>;
  }

  function openEdit(entry: FinancialEntry) {
    setMessage("");
    setActionError("");
    setEditErrors({});
    setEditFields({ lugar: entry.lugar, valor: moneyInputValue(entry.valor), mesReferencia: entry.mesReferencia, tipo: entry.tipo });
    setEditing(entry);
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing) return;
    const result = entrySchema.safeParse({ ...editFields, valor: parseBrlMoney(editFields.valor) });
    if (!result.success) return setEditErrors(schemaErrors(result.error));
    setEditErrors({});
    setActionError("");
    setSaving(true);
    try {
      const payload: UpdateEntryInput = result.data;
      const response = await apiRequest<FinancialEntry | undefined>(`/api/financial-entries/${editing.id}`, { method: "PATCH", body: JSON.stringify(payload) });
      const updated: FinancialEntry = response ?? { ...editing, ...payload, valor: String(payload.valor) };
      setEntries((current) => current.map((entry) => entry.id === editing.id ? { ...entry, ...updated } : entry));
      setEditing(null);
      setMessage("Conta atualizada com sucesso.");
    } catch (saveError) {
      setActionError(saveError instanceof Error ? saveError.message : "Não foi possível atualizar esta conta.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry() {
    if (!deleting) return;
    setActionError("");
    setRemoving(true);
    try {
      await apiRequest<void>(`/api/financial-entries/${deleting.id}`, { method: "DELETE" });
      setEntries((current) => current.filter((entry) => entry.id !== deleting.id));
      setDeleting(null);
      setMessage("Conta excluída com sucesso.");
    } catch (removeError) {
      setActionError(removeError instanceof Error ? removeError.message : "Não foi possível excluir esta conta.");
    } finally {
      setRemoving(false);
    }
  }

  const rangeStart = filteredEntries.length ? (safePage - 1) * TABLE_PAGE_SIZE + 1 : 0;
  const rangeEnd = Math.min(safePage * TABLE_PAGE_SIZE, filteredEntries.length);

  return <>
    <div className="accounts-heading">
      <div><span className="eyebrow">CONTAS</span><h1>Gerenciar contas</h1><p>Consulte seus lançamentos e edite ou exclua cada item.</p></div>
      <div className="accounts-primary-actions"><Link href="/contas/nova" className="button button-secondary"><PlusIcon />Nova conta</Link><Link href="/contas/importar" className="button button-primary"><UploadIcon />Importar CSV</Link></div>
    </div>

    {message && <div className="accounts-feedback"><Alert type="success">{message}</Alert></div>}

    <section className="accounts-card">
      <div className="accounts-toolbar">
        <div className="accounts-search"><SearchIcon /><label className="sr-only" htmlFor="accounts-search">Buscar contas</label><input id="accounts-search" type="search" placeholder="Buscar por descrição, arquivo ou valor" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} /></div>
        <div className="accounts-filter"><MonthField id="accounts-month" label="Mês" value={month} optional onChange={(event) => { setLoading(true); setError(""); setMonth(event.target.value); setPage(1); }} />{month && <button type="button" className="filter-clear" onClick={() => { setLoading(true); setError(""); setMonth(""); setPage(1); }}>Ver todos</button>}</div>
        <div className="field accounts-type-filter"><label htmlFor="accounts-type">Tipo</label><select id="accounts-type" value={typeFilter} onChange={(event) => { setTypeFilter(event.target.value as "TODOS" | EntryType); setPage(1); }}><option value="TODOS">Todos</option><option value="ENTRADA">Entradas</option><option value="SAIDA">Saídas</option></select></div>
      </div>

      {loading ? <div className="accounts-loading" aria-label="Carregando contas"><span className="spinner"/><span>Carregando suas contas...</span></div> : error ? <div className="accounts-error"><Alert>{error}</Alert><button type="button" className="button button-secondary" onClick={() => { setLoading(true); setError(""); setRetryKey((key) => key + 1); }}>Tentar novamente</button></div> : !filteredEntries.length ? <div className="accounts-empty"><span><ReceiptIcon /></span><h2>{entries.length ? "Nenhuma conta encontrada" : "Nenhuma conta cadastrada"}</h2><p>{entries.length ? "Tente alterar os filtros ou o termo de busca." : "Adicione uma conta manualmente ou importe um arquivo CSV."}</p>{!entries.length && <Link href="/contas/nova" className="button button-secondary"><PlusIcon />Adicionar conta</Link>}</div> : <>
        <div className="accounts-table-summary"><span>Exibindo {rangeStart}–{rangeEnd} de {filteredEntries.length} contas</span></div>
        <div className="table-wrap accounts-table"><table><caption className="sr-only">Lista de contas; use as ações da última coluna para editar ou excluir</caption><thead><tr>{sortableHeader("Descrição", "lugar")}<th>Mês</th>{sortableHeader("Tipo", "tipo")}{sortableHeader("Origem", "origem")}{sortableHeader("Inserido em", "inseridoEm")}{sortableHeader("Valor", "valor", true)}<th className="align-right">Ações</th></tr></thead><tbody>{visibleEntries.map((entry) => <tr key={entry.id}><td><strong>{entry.lugar}</strong>{entry.nomeArquivo && <small>{entry.nomeArquivo}</small>}</td><td className="capitalize accounts-month-cell">{formatReferenceMonth(entry.mesReferencia)}</td><td><TypeBadge type={entry.tipo}/></td><td><OriginBadge origin={entry.origem}/></td><td className="accounts-date-cell">{formatDate(entry.inseridoEm)}</td><td className={`align-right entry-value ${entry.tipo === "ENTRADA" ? "income" : "expense"}`}>{entry.tipo === "ENTRADA" ? "+" : "−"} {formatCurrency(entry.valor)}</td><td><div className="row-actions"><button type="button" className="row-action edit" onClick={() => openEdit(entry)} aria-label={`Editar ${entry.lugar}`} title="Editar"><EditIcon /></button><button type="button" className="row-action delete" onClick={() => { setMessage(""); setActionError(""); setDeleting(entry); }} aria-label={`Excluir ${entry.lugar}`} title="Excluir"><TrashIcon /></button></div></td></tr>)}</tbody></table></div>
        {totalPages > 1 && <nav className="table-pagination accounts-pagination" aria-label="Paginação das contas"><span>Página {safePage} de {totalPages}</span><div><button type="button" className="pagination-arrow" disabled={safePage === 1} onClick={() => setPage(safePage - 1)} aria-label="Página anterior">‹</button>{paginationItems.map((item) => typeof item === "number" ? <button type="button" key={item} className={item === safePage ? "active" : ""} aria-current={item === safePage ? "page" : undefined} onClick={() => setPage(item)}>{item}</button> : <span key={item} className="pagination-ellipsis" aria-hidden="true">…</span>)}<button type="button" className="pagination-arrow" disabled={safePage === totalPages} onClick={() => setPage(safePage + 1)} aria-label="Próxima página">›</button></div></nav>}
      </>}
    </section>

    {editing && <div className="modal-backdrop" role="presentation" onMouseDown={() => !saving && setEditing(null)}><div className="modal account-edit-modal" role="dialog" aria-modal="true" aria-labelledby="edit-account-title" onMouseDown={(event) => event.stopPropagation()}><div className="account-modal-heading"><span className="modal-icon edit"><EditIcon /></span><div><h2 id="edit-account-title">Editar conta</h2><p>Atualize os dados deste lançamento.</p></div></div><form onSubmit={saveEdit} noValidate>{actionError && <Alert>{actionError}</Alert>}<div className="account-edit-fields"><fieldset className="type-selector"><legend>Tipo do lançamento</legend><label className={editFields.tipo === "SAIDA" ? "selected expense" : ""}><input type="radio" name="edit-tipo" value="SAIDA" checked={editFields.tipo === "SAIDA"} onChange={() => setEditFields({ ...editFields, tipo: "SAIDA" })}/><TrendDownIcon/><span><strong>Saída</strong><small>Conta paga ou dinheiro gasto</small></span></label><label className={editFields.tipo === "ENTRADA" ? "selected income" : ""}><input type="radio" name="edit-tipo" value="ENTRADA" checked={editFields.tipo === "ENTRADA"} onChange={() => setEditFields({ ...editFields, tipo: "ENTRADA" })}/><TrendUpIcon/><span><strong>Entrada</strong><small>Valor recebido</small></span></label></fieldset><FormField autoFocus label="Descrição" name="edit-lugar" maxLength={255} value={editFields.lugar} error={editErrors.lugar} onChange={(event) => setEditFields({ ...editFields, lugar: event.target.value })} required/><div className="two-columns"><MoneyField id="edit-valor" label="Valor" value={editFields.valor} error={editErrors.valor} onChange={(valor) => setEditFields({ ...editFields, valor })} required/><MonthField id="edit-mes" label="Mês de referência" value={editFields.mesReferencia} error={editErrors.mesReferencia} onChange={(event) => setEditFields({ ...editFields, mesReferencia: event.target.value })} required/></div></div><div className="modal-actions account-modal-actions"><button type="button" className="button button-ghost" disabled={saving} onClick={() => setEditing(null)}>Cancelar</button><button className="button button-primary" disabled={saving}>{saving ? <><span className="spinner"/>Salvando...</> : "Salvar alterações"}</button></div></form></div></div>}

    {deleting && <div className="modal-backdrop" role="presentation" onMouseDown={() => !removing && setDeleting(null)}><div className="modal" role="dialog" aria-modal="true" aria-labelledby="delete-account-title" onMouseDown={(event) => event.stopPropagation()}><div className="modal-icon"><TrashIcon /></div><h2 id="delete-account-title">Excluir esta conta?</h2><p>O lançamento <strong>{deleting.lugar}</strong>, no valor de <strong>{formatCurrency(deleting.valor)}</strong>, será removido. Esta ação não pode ser desfeita.</p>{actionError && <Alert>{actionError}</Alert>}<div className="modal-actions"><button type="button" className="button button-ghost" disabled={removing} onClick={() => setDeleting(null)}>Cancelar</button><button type="button" className="button button-danger" disabled={removing} onClick={removeEntry}>{removing ? <><span className="spinner"/>Excluindo...</> : "Sim, excluir"}</button></div></div></div>}
  </>;
}
