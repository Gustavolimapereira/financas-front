import type { EntryOrigin } from "@/types/api";

export function OriginBadge({ origin }: { origin: EntryOrigin }) {
  return <span className={`badge badge-${origin.toLowerCase()}`}><span />{origin === "MANUAL" ? "Manual" : "Arquivo"}</span>;
}
