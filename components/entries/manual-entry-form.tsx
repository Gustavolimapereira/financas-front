"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api-client";
import { entrySchema, parseBrlMoney, schemaErrors, type FieldErrors } from "@/lib/forms";
import { formatCurrency, formatDate, formatReferenceMonth } from "@/lib/format";
import type { FinancialEntry } from "@/types/api";
import { Alert } from "@/components/ui/alert";
import { CheckIcon, PlusIcon, TrendDownIcon, TrendUpIcon } from "@/components/ui/icons";
import { FormField } from "@/components/ui/form-field";
import { MoneyField } from "@/components/ui/money-field";
import { MonthField } from "@/components/ui/month-field";
import { OriginBadge } from "@/components/ui/origin-badge";
import { TypeBadge } from "@/components/ui/type-badge";

export function ManualEntryForm() {
  const [fields, setFields] = useState<{ lugar: string; valor: string; mesReferencia: string; tipo: "ENTRADA" | "SAIDA" }>({ lugar: "", valor: "", mesReferencia: "", tipo: "SAIDA" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [requestError, setRequestError] = useState("");
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState<FinancialEntry | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault(); setRequestError("");
    const result = entrySchema.safeParse({ ...fields, valor: parseBrlMoney(fields.valor) });
    if (!result.success) return setErrors(schemaErrors(result.error));
    setErrors({}); setLoading(true);
    try {
      const entry = await apiRequest<FinancialEntry>("/api/financial-entries", { method: "POST", body: JSON.stringify(result.data) });
      setCreated({ ...entry, tipo: entry.tipo === "ENTRADA" || entry.tipo === "SAIDA" ? entry.tipo : fields.tipo });
    } catch (error) { setRequestError(error instanceof Error ? error.message : "Não foi possível salvar o lançamento."); }
    finally { setLoading(false); }
  }

  function reset() { setFields({ lugar: "", valor: "", mesReferencia: "", tipo: "SAIDA" }); setCreated(null); setErrors({}); }

  if (created) return <div className="result-card"><div className="success-mark"><CheckIcon /></div><span className="eyebrow">LANÇAMENTO CRIADO</span><h2>Tudo certo!</h2><p>O lançamento foi registrado com sucesso.</p><dl className="entry-summary"><div><dt>Descrição</dt><dd>{created.lugar}</dd></div><div><dt>Tipo</dt><dd><TypeBadge type={created.tipo}/></dd></div><div><dt>Valor</dt><dd className={created.tipo === "ENTRADA" ? "money-positive" : "money-expense"}>{formatCurrency(created.valor)}</dd></div><div><dt>Mês de referência</dt><dd className="capitalize">{formatReferenceMonth(created.mesReferencia)}</dd></div><div><dt>Origem</dt><dd><OriginBadge origin={created.origem}/></dd></div><div><dt>Inserido em</dt><dd>{formatDate(created.inseridoEm)}</dd></div></dl><div className="result-actions"><button className="button button-primary" onClick={reset}><PlusIcon />Adicionar outro</button><Link className="button button-ghost" href="/dashboard">Voltar ao início</Link></div></div>;

  return <form className="form-card" onSubmit={submit} noValidate><div className="form-card-head"><h2>Dados do lançamento</h2><p>Registre uma entrada recebida ou uma saída paga.</p></div>{requestError && <Alert>{requestError}</Alert>}<div className="form-body"><fieldset className="type-selector"><legend>Tipo do lançamento</legend><label className={fields.tipo === "SAIDA" ? "selected expense" : ""}><input type="radio" name="tipo" value="SAIDA" checked={fields.tipo === "SAIDA"} onChange={() => setFields({ ...fields, tipo: "SAIDA" })}/><TrendDownIcon/><span><strong>Saída</strong><small>Dinheiro gasto ou conta paga</small></span></label><label className={fields.tipo === "ENTRADA" ? "selected income" : ""}><input type="radio" name="tipo" value="ENTRADA" checked={fields.tipo === "ENTRADA"} onChange={() => setFields({ ...fields, tipo: "ENTRADA" })}/><TrendUpIcon/><span><strong>Entrada</strong><small>Salário ou valor recebido</small></span></label></fieldset><FormField label={fields.tipo === "ENTRADA" ? "Origem ou descrição" : "Local ou descrição"} name="lugar" placeholder={fields.tipo === "ENTRADA" ? "Ex.: Salário" : "Ex.: Conta de energia"} maxLength={255} value={fields.lugar} error={errors.lugar} onChange={(e) => setFields({ ...fields, lugar: e.target.value })} required/><div className="two-columns"><MoneyField label="Valor" value={fields.valor} error={errors.valor} onChange={(valor) => setFields({ ...fields, valor })} required/><MonthField label="Mês de referência" value={fields.mesReferencia} error={errors.mesReferencia} onChange={(e) => setFields({ ...fields, mesReferencia: e.target.value })} required/></div></div><div className="form-footer"><Link href="/dashboard" className="button button-ghost">Cancelar</Link><button className="button button-primary" disabled={loading}>{loading ? <><span className="spinner"/>Salvando...</> : `Salvar ${fields.tipo === "ENTRADA" ? "entrada" : "saída"}`}</button></div></form>;
}
