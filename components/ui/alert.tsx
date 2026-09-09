import type { ReactNode } from "react";
import { AlertIcon, CheckIcon } from "./icons";

export function Alert({ type = "error", children }: { type?: "error" | "success" | "info"; children: ReactNode }) {
  return <div className={`alert alert-${type}`} role={type === "error" ? "alert" : "status"}>{type === "success" ? <CheckIcon /> : <AlertIcon />}<div>{children}</div></div>;
}
