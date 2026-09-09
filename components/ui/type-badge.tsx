import type { EntryType } from "@/types/api";
import { TrendDownIcon, TrendUpIcon } from "./icons";

export function TypeBadge({ type }: { type: EntryType }) {
  return <span className={`type-badge type-${type.toLowerCase()}`}>{type === "ENTRADA" ? <TrendUpIcon/> : <TrendDownIcon/>}{type === "ENTRADA" ? "Entrada" : "Saída"}</span>;
}
