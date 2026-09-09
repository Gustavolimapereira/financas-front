"use client";

import { useRef, useState, type DragEvent, type FormEvent } from "react";
import Link from "next/link";
import { apiRequest } from "@/lib/api-client";
import { buildUploadFormData } from "@/lib/forms";
import type { UploadResponse } from "@/types/api";
import { Alert } from "@/components/ui/alert";
import { CheckIcon, FileIcon, UploadIcon } from "@/components/ui/icons";
import { MonthField } from "@/components/ui/month-field";
import { ImportedEntriesTable } from "./imported-entries-table";

const MAX_SIZE = 5 * 1024 * 1024;

export function CsvUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [month, setMonth] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UploadResponse | null>(null);

  function choose(candidate?: File) {
    setError(""); setResult(null);
    if (!candidate) return;
    if (!candidate.name.toLowerCase().endsWith(".csv") && candidate.type !== "text/csv") return setError("Selecione um arquivo no formato CSV.");
    if (candidate.size > MAX_SIZE) return setError("O arquivo ultrapassa o limite de 5 MB.");
    setFile(candidate);
  }

  function drop(event: DragEvent) { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files[0]); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!file) return setError("Selecione um arquivo CSV para continuar.");
    setError(""); setLoading(true);
    try { setResult(await apiRequest<UploadResponse>("/api/financial-entries/upload", { method: "POST", body: buildUploadFormData(file, month || undefined) })); }
    catch (requestError) { setError(requestError instanceof Error ? requestError.message : "Não foi possível importar o arquivo."); }
    finally { setLoading(false); }
  }

  function reset() { setFile(null); setMonth(""); setResult(null); setError(""); if (inputRef.current) inputRef.current.value = ""; }

  if (result) return <div className="upload-result"><div className="upload-success-head"><span><CheckIcon /></span><div><p className="eyebrow">IMPORTAÇÃO CONCLUÍDA</p><h2>{result.totalRegistrosInseridos} {result.totalRegistrosInseridos === 1 ? "registro adicionado" : "registros adicionados"}</h2><p>{result.message}</p></div></div><div className="import-meta"><div><small>Arquivo</small><strong><FileIcon />{result.arquivo}</strong></div><div><small>Mês de referência</small><strong>{result.mesReferencia}</strong></div></div><ImportedEntriesTable entries={result.valores}/><div className="result-actions"><button className="button button-primary" onClick={reset}><UploadIcon />Importar outro CSV</button><Link href="/dashboard" className="button button-ghost">Voltar ao início</Link></div></div>;

  return <form className="form-card upload-form" onSubmit={submit}><div className="form-card-head"><h2>Selecione seu arquivo</h2><p>Envie seu extrato no formato indicado.</p></div>{error && <div className="form-alert"><Alert>{error}</Alert></div>}<div className="form-body"><input ref={inputRef} className="sr-only" id="csv-file" type="file" accept=".csv,text/csv" onChange={(e) => choose(e.target.files?.[0])}/><div className={`dropzone ${dragging ? "dragging" : ""} ${file ? "has-file" : ""}`} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={drop}>{file ? <><span className="file-selected"><FileIcon /></span><strong>{file.name}</strong><small>{(file.size / 1024).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} KB</small><button type="button" className="text-button" onClick={() => choose(undefined)}>Remover arquivo</button></> : <><span className="drop-icon"><UploadIcon /></span><strong>Arraste seu arquivo CSV aqui</strong><span>ou</span><button type="button" className="button button-secondary" onClick={() => inputRef.current?.click()}>Selecionar arquivo</button><small>Apenas .CSV · Tamanho máximo de 5 MB</small></>}</div><MonthField label="Mês de referência" optional value={month} onChange={(e) => setMonth(e.target.value)} hint=""/><div className="info-box"><strong>O mês pode ser identificado automaticamente</strong><p>Inclua uma data no nome do arquivo, como <code>Nubank_2026-07-28.csv</code>. Se não houver data, selecione o mês acima.</p></div><div className="csv-example"><strong>Formato esperado</strong><code>title,amount<br/>Mercado,100.50<br/>Posto,80.00</code><small>Também aceitamos ponto e vírgula e valores com vírgula.</small></div></div><div className="form-footer"><Link href="/dashboard" className="button button-ghost">Cancelar</Link><button className="button button-primary" disabled={loading || !file}>{loading ? <><span className="spinner"/>Processando arquivo...</> : <><UploadIcon />Importar lançamentos</>}</button></div></form>;
}
