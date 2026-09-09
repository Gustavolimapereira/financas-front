"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/auth/auth-provider";
import { apiRequest } from "@/lib/api-client";
import {
  calculateFinancialMetrics,
  calculateFinancialSummary,
  currentReferenceMonth,
  normalizeFinancialEntriesPage,
  normalizeFinancialSummary,
  previousReferenceMonth,
} from "@/lib/financial-metrics";
import { formatCurrency, formatDate, formatReferenceMonth } from "@/lib/format";
import {
  getPaginationItems,
  sortFinancialEntries,
  type EntrySortKey,
  type SortDirection,
} from "@/lib/financial-table";
import type {
  FinancialEntry,
  FinancialSummary,
  SpendingGroup,
} from "@/types/api";
import { Alert } from "@/components/ui/alert";
import { EmptyState } from "@/components/ui/empty-state";
import {
  ChartIcon,
  PlusIcon,
  TrendDownIcon,
  TrendUpIcon,
  UploadIcon,
  WalletIcon,
} from "@/components/ui/icons";
import { MonthField } from "@/components/ui/month-field";
import { OriginBadge } from "@/components/ui/origin-badge";
import { TypeBadge } from "@/components/ui/type-badge";

const PAGE_SIZE = 100;
const TABLE_PAGE_SIZE = 10;
const CHART_COLORS = [
  "#147d61",
  "#4ca985",
  "#83c4a9",
  "#3977a8",
  "#83aacf",
  "#c2d1ca",
];

async function fetchAllEntries(
  month: string,
  signal: AbortSignal,
): Promise<FinancialEntry[]> {
  const entries: FinancialEntry[] = [];
  for (let page = 1; page <= 100; page += 1) {
    const query = new URLSearchParams({
      mesReferencia: month,
      pagina: String(page),
      limite: String(PAGE_SIZE),
    });
    const payload = await apiRequest<unknown>(
      `/api/financial-entries?${query}`,
      { signal },
    );
    const normalized = normalizeFinancialEntriesPage(
      payload,
      page,
      PAGE_SIZE,
      month,
    );
    entries.push(...normalized.entries);
    if (!normalized.hasNextPage) break;
  }
  return entries;
}

async function fetchSummary(
  month: string,
  signal: AbortSignal,
): Promise<unknown> {
  const query = new URLSearchParams({ mesReferencia: month });
  return apiRequest<unknown>(`/api/financial-entries/summary?${query}`, {
    signal,
  });
}

function mergeSmallGroups(groups: SpendingGroup[]): SpendingGroup[] {
  if (groups.length <= 5) return groups;
  const visible = groups.slice(0, 5);
  const othersValue = groups
    .slice(5)
    .reduce((sum, group) => sum + group.value, 0);
  const total = groups.reduce((sum, group) => sum + group.value, 0);
  return [
    ...visible,
    {
      label: "Outros",
      value: othersValue,
      percentage: total ? (othersValue / total) * 100 : 0,
    },
  ];
}

function variationText(value: number, percentage: number | null) {
  if (value === 0) return "Mesmo valor do mês anterior";
  const direction = value > 0 ? "a mais" : "a menos";
  const percentageText =
    percentage === null
      ? "sem base anterior"
      : `${Math.abs(percentage).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
  return `${formatCurrency(Math.abs(value))} ${direction} · ${percentageText}`;
}

function MetricsSkeleton() {
  return (
    <div className="metrics-loading" aria-label="Carregando indicadores">
      <div className="skeleton metrics-skeleton-title" />
      <div className="metrics-skeleton-grid">
        {[1, 2, 3, 4].map((item) => (
          <div className="skeleton metrics-skeleton-card" key={item} />
        ))}
      </div>
      <div className="metrics-skeleton-charts">
        <div className="skeleton metrics-skeleton-chart" />
        <div className="skeleton metrics-skeleton-chart" />
      </div>
      <span className="sr-only">Carregando os dados financeiros...</span>
    </div>
  );
}

export function FinancialDashboard() {
  const { user } = useAuth();
  const [month, setMonth] = useState(currentReferenceMonth);
  const [currentEntries, setCurrentEntries] = useState<FinancialEntry[]>([]);
  const [currentSummary, setCurrentSummary] = useState<FinancialSummary>(
    () => ({
      mesReferencia: currentReferenceMonth(),
      entradas: 0,
      saidas: 0,
      saldo: 0,
    }),
  );
  const [previousSummary, setPreviousSummary] = useState<FinancialSummary>(
    () => ({
      mesReferencia: previousReferenceMonth(currentReferenceMonth()),
      entradas: 0,
      saidas: 0,
      saldo: 0,
    }),
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);
  const [tablePage, setTablePage] = useState(1);
  const [sortKey, setSortKey] = useState<EntrySortKey>("inseridoEm");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetchAllEntries(month, controller.signal),
      fetchAllEntries(previousReferenceMonth(month), controller.signal),
      fetchSummary(month, controller.signal),
      fetchSummary(previousReferenceMonth(month), controller.signal),
    ])
      .then(([current, previous, currentSummaryPayload, previousSummaryPayload]) => {
        if (!controller.signal.aborted) {
          setCurrentEntries(current);
          const apiCurrentSummary = normalizeFinancialSummary(currentSummaryPayload, month, current);
          const apiPreviousSummary = normalizeFinancialSummary(previousSummaryPayload, previousReferenceMonth(month), previous);
          setCurrentSummary(current.length ? calculateFinancialSummary(current, month) : apiCurrentSummary);
          setPreviousSummary(previous.length ? calculateFinancialSummary(previous, previousReferenceMonth(month)) : apiPreviousSummary);
        }
      })
      .catch((loadError: unknown) => {
        if (
          loadError instanceof DOMException &&
          loadError.name === "AbortError"
        )
          return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Não foi possível carregar seus indicadores.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [month, retryKey]);

  const metrics = useMemo(
    () => calculateFinancialMetrics(currentEntries, []),
    [currentEntries],
  );
  const chartGroups = useMemo(
    () => mergeSmallGroups(metrics.groups),
    [metrics.groups],
  );
  const expenseDifference = currentSummary.saidas - previousSummary.saidas;
  const expensePercentageChange =
    previousSummary.saidas > 0
      ? (expenseDifference / previousSummary.saidas) * 100
      : null;
  const maxMonthValue = Math.max(
    currentSummary.entradas,
    currentSummary.saidas,
    previousSummary.entradas,
    previousSummary.saidas,
    1,
  );
  const sortedEntries = useMemo(
    () => sortFinancialEntries(currentEntries, sortKey, sortDirection),
    [currentEntries, sortDirection, sortKey],
  );
  const totalTablePages = Math.max(
    1,
    Math.ceil(sortedEntries.length / TABLE_PAGE_SIZE),
  );
  const safeTablePage = Math.min(tablePage, totalTablePages);
  const visibleEntries = useMemo(() => {
    const start = (safeTablePage - 1) * TABLE_PAGE_SIZE;
    return sortedEntries.slice(start, start + TABLE_PAGE_SIZE);
  }, [safeTablePage, sortedEntries]);
  const paginationItems = useMemo(
    () => getPaginationItems(safeTablePage, totalTablePages),
    [safeTablePage, totalTablePages],
  );
  const donutBackground = useMemo(() => {
    const stops = chartGroups.map((group, index) => {
      const start = chartGroups
        .slice(0, index)
        .reduce((sum, item) => sum + item.percentage, 0);
      const end = start + group.percentage;
      return `${CHART_COLORS[index]} ${start}% ${end}%`;
    });
    return stops.length ? `conic-gradient(${stops.join(", ")})` : "#e8eeeb";
  }, [chartGroups]);

  const firstName = user.name.trim().split(" ")[0];
  const isIncrease = expenseDifference > 0;

  function changeSort(key: EntrySortKey) {
    if (key === sortKey)
      setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDirection(key === "inseridoEm" ? "desc" : "asc");
    }
    setTablePage(1);
  }

  function sortableHeader(
    label: string,
    key: EntrySortKey,
    alignRight = false,
  ) {
    const active = sortKey === key;
    return (
      <th
        className={alignRight ? "align-right" : undefined}
        aria-sort={
          active
            ? sortDirection === "asc"
              ? "ascending"
              : "descending"
            : "none"
        }
      >
        <button
          type="button"
          className={`sort-button ${active ? "active" : ""}`}
          onClick={() => changeSort(key)}
        >
          {label}
          <span aria-hidden="true" className="sort-indicator">
            {active ? (sortDirection === "asc" ? "↑" : "↓") : "↕"}
          </span>
        </button>
      </th>
    );
  }

  return (
    <>
      <div className="dashboard-head">
        <div>
          <span className="eyebrow">VISÃO GERAL</span>
          <h1>
            Olá, {firstName} <span aria-hidden="true">👋</span>
          </h1>
          <p>Acompanhe o que entrou, o que saiu e seu saldo mensal.</p>
        </div>
        <div className="dashboard-month">
          <MonthField
            id="dashboard-month"
            label="Mês analisado"
            value={month}
            onChange={(event) => {
              setLoading(true);
              setError("");
              setTablePage(1);
              setMonth(event.target.value);
            }}
          />
        </div>
      </div>

      {loading ? (
        <MetricsSkeleton />
      ) : error ? (
        <div className="dashboard-error">
          <Alert>{error}</Alert>
          <button
            className="button button-secondary"
            onClick={() => {
              setLoading(true);
              setError("");
              setRetryKey((key) => key + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      ) : !currentEntries.length &&
        currentSummary.entradas === 0 &&
        currentSummary.saidas === 0 ? (
        <>
          <div className="dashboard-empty-note">
            <strong className="capitalize">
              {formatReferenceMonth(month)}
            </strong>
            <span>Não há dados para gerar métricas neste período.</span>
          </div>
          <EmptyState />
        </>
      ) : (
        <>
          <section className="metric-grid" aria-label="Indicadores financeiros">
            <article className="metric-card income-card">
              <div className="metric-icon income">
                <TrendUpIcon />
              </div>
              <span>Entradas</span>
              <strong>{formatCurrency(currentSummary.entradas)}</strong>
              <small>Valores recebidos no mês</small>
            </article>
            <article className="metric-card expense-card">
              <div className="metric-icon expense">
                <TrendDownIcon />
              </div>
              <span>Saídas</span>
              <strong>{formatCurrency(currentSummary.saidas)}</strong>
              <small
                className={
                  expenseDifference > 0
                    ? "variation bad"
                    : expenseDifference < 0
                      ? "variation good"
                      : "variation"
                }
              >
                {expenseDifference !== 0 &&
                  (isIncrease ? <TrendUpIcon /> : <TrendDownIcon />)}
                {variationText(expenseDifference, expensePercentageChange)}
              </small>
            </article>
            <article
              className={`metric-card balance-card ${currentSummary.saldo < 0 ? "negative" : ""}`}
            >
              <div className="metric-icon balance">
                <WalletIcon />
              </div>
              <span>Saldo do mês</span>
              <strong>{formatCurrency(currentSummary.saldo)}</strong>
              <small>
                {currentSummary.saldo >= 0
                  ? "Entradas menos saídas"
                  : "As saídas superaram as entradas"}
              </small>
            </article>
            <article className="metric-card">
              <div className="metric-icon blue">
                <ChartIcon />
              </div>
              <span>Maior gasto</span>
              <strong className="metric-place" title={metrics.topPlace?.label}>
                {metrics.topPlace?.label ?? "—"}
              </strong>
              <small>
                {metrics.topPlace
                  ? `${formatCurrency(metrics.topPlace.value)} · ${metrics.topPlace.percentage.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do total`
                  : "Sem dados"}
              </small>
            </article>
          </section>

          <div className="chart-grid">
            <section className="chart-card">
              <div className="chart-heading">
                <div>
                  <h2>Fluxo mensal</h2>
                  <p>Entradas e saídas comparadas ao mês anterior.</p>
                </div>
                <div className="flow-legend">
                  <span>
                    <i className="income" />
                    Entradas
                  </span>
                  <span>
                    <i className="expense" />
                    Saídas
                  </span>
                </div>
              </div>
              <div
                className="cashflow-months"
                aria-label="Comparação de entradas e saídas entre os dois meses"
              >
                <div className="cashflow-month">
                  <div className="flow-bars">
                    <div className="flow-bar">
                      <strong>
                        {formatCurrency(previousSummary.entradas)}
                      </strong>
                      <div className="flow-track">
                        <span
                          className="income"
                          style={{
                            height: `${Math.max((previousSummary.entradas / maxMonthValue) * 100, previousSummary.entradas ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flow-bar">
                      <strong>{formatCurrency(previousSummary.saidas)}</strong>
                      <div className="flow-track">
                        <span
                          className="expense"
                          style={{
                            height: `${Math.max((previousSummary.saidas / maxMonthValue) * 100, previousSummary.saidas ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <small className="capitalize">
                    {formatReferenceMonth(previousReferenceMonth(month))}
                  </small>
                </div>
                <div className="cashflow-month current">
                  <div className="flow-bars">
                    <div className="flow-bar">
                      <strong>{formatCurrency(currentSummary.entradas)}</strong>
                      <div className="flow-track">
                        <span
                          className="income"
                          style={{
                            height: `${Math.max((currentSummary.entradas / maxMonthValue) * 100, currentSummary.entradas ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="flow-bar">
                      <strong>{formatCurrency(currentSummary.saidas)}</strong>
                      <div className="flow-track">
                        <span
                          className="expense"
                          style={{
                            height: `${Math.max((currentSummary.saidas / maxMonthValue) * 100, currentSummary.saidas ? 4 : 0)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <small className="capitalize">
                    {formatReferenceMonth(month)}
                  </small>
                </div>
              </div>
              <div
                className={`comparison-summary ${isIncrease ? "increase" : "decrease"}`}
              >
                {expenseDifference === 0 ? (
                  "Suas saídas permaneceram estáveis."
                ) : (
                  <>
                    {isIncrease ? <TrendUpIcon /> : <TrendDownIcon />}
                    <span>
                      Você gastou{" "}
                      <strong>
                        {formatCurrency(Math.abs(expenseDifference))}{" "}
                        {isIncrease ? "a mais" : "a menos"}
                      </strong>
                      {expensePercentageChange !== null && (
                        <>
                          {" "}
                          (
                          {Math.abs(expensePercentageChange).toLocaleString(
                            "pt-BR",
                            { maximumFractionDigits: 1 },
                          )}
                          %)
                        </>
                      )}
                      .
                    </span>
                  </>
                )}
              </div>
            </section>

            <section className="chart-card">
              <div className="chart-heading">
                <div>
                  <h2>Onde você mais gastou</h2>
                  <p>Agrupado pelo local ou descrição do lançamento.</p>
                </div>
              </div>
              {chartGroups.length ? (
                <div className="distribution">
                  <div
                    className="donut"
                    style={{ background: donutBackground }}
                    role="img"
                    aria-label="Distribuição dos gastos por estabelecimento"
                  >
                    <div>
                      <strong>{metrics.groups.length}</strong>
                      <small>locais</small>
                    </div>
                  </div>
                  <ul className="chart-legend">
                    {chartGroups.map((group, index) => (
                      <li key={group.label}>
                        <span
                          className="legend-color"
                          style={{ background: CHART_COLORS[index] }}
                        />
                        <div>
                          <strong title={group.label}>{group.label}</strong>
                          <small>
                            {group.percentage.toLocaleString("pt-BR", {
                              maximumFractionDigits: 1,
                            })}
                            %
                          </small>
                        </div>
                        <b>{formatCurrency(group.value)}</b>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="chart-empty">
                  <ChartIcon />
                  <strong>Nenhuma saída neste mês</strong>
                  <span>
                    O gráfico será exibido quando houver despesas no período.
                  </span>
                </div>
              )}
              <p className="category-disclaimer">
                A API ainda não informa categorias. Este gráfico usa o campo
                “local/descrição”, sem categorizações presumidas.
              </p>
            </section>
          </div>

          <section className="entries-card">
            <div className="entries-heading ">
              <div>
                <h2>Lançamentos do mês</h2>
                <p>
                  Exibindo{" "}
                  {sortedEntries.length
                    ? (safeTablePage - 1) * TABLE_PAGE_SIZE + 1
                    : 0}
                  –
                  {Math.min(
                    safeTablePage * TABLE_PAGE_SIZE,
                    sortedEntries.length,
                  )}{" "}
                  de {sortedEntries.length} lançamentos.
                </p>
              </div>
              <div className="entries-actions">
                <Link href="/contas/nova" className="button button-secondary">
                  <PlusIcon />
                  Novo lançamento
                </Link>
                <Link href="/contas/importar" className="button button-primary">
                  <UploadIcon />
                  Importar CSV
                </Link>
              </div>
            </div>
            <div className="table-wrap dashboard-table">
              <table>
                <caption className="sr-only">
                  Lançamentos do mês selecionado; clique nos títulos das colunas
                  para ordenar
                </caption>
                <thead>
                  <tr>
                    {sortableHeader("Descrição", "lugar")}
                    {sortableHeader("Tipo", "tipo")}
                    {sortableHeader("Origem", "origem")}
                    {sortableHeader("Inserido em", "inseridoEm")}
                    {sortableHeader("Valor", "valor", true)}
                  </tr>
                </thead>
                <tbody>
                  {visibleEntries.map((entry) => (
                    <tr key={entry.id}>
                      <td>
                        <strong>{entry.lugar}</strong>
                        {entry.nomeArquivo && (
                          <small>{entry.nomeArquivo}</small>
                        )}
                      </td>
                      <td>
                        <TypeBadge type={entry.tipo} />
                      </td>
                      <td>
                        <OriginBadge origin={entry.origem} />
                      </td>
                      <td>{formatDate(entry.inseridoEm)}</td>
                      <td
                        className={`align-right entry-value ${entry.tipo === "ENTRADA" ? "income" : "expense"}`}
                      >
                        {entry.tipo === "ENTRADA" ? "+" : "−"}{" "}
                        {formatCurrency(entry.valor)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalTablePages > 1 && (
              <nav
                className="table-pagination"
                aria-label="Paginação dos lançamentos"
              >
                <span>
                  Página {safeTablePage} de {totalTablePages}
                </span>
                <div>
                  <button
                    type="button"
                    className="pagination-arrow"
                    disabled={safeTablePage === 1}
                    onClick={() => setTablePage(safeTablePage - 1)}
                    aria-label="Página anterior"
                  >
                    ‹
                  </button>
                  {paginationItems.map((item) =>
                    typeof item === "number" ? (
                      <button
                        type="button"
                        key={item}
                        className={item === safeTablePage ? "active" : ""}
                        aria-current={
                          item === safeTablePage ? "page" : undefined
                        }
                        onClick={() => setTablePage(item)}
                      >
                        {item}
                      </button>
                    ) : (
                      <span
                        key={item}
                        className="pagination-ellipsis"
                        aria-hidden="true"
                      >
                        …
                      </span>
                    ),
                  )}
                  <button
                    type="button"
                    className="pagination-arrow"
                    disabled={safeTablePage === totalTablePages}
                    onClick={() => setTablePage(safeTablePage + 1)}
                    aria-label="Próxima página"
                  >
                    ›
                  </button>
                </div>
              </nav>
            )}
          </section>
        </>
      )}
    </>
  );
}
