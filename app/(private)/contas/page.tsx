import type { Metadata } from "next";
import { AccountsTable } from "@/components/entries/accounts-table";

export const metadata: Metadata = { title: "Contas" };

export default function AccountsPage() {
  return <AccountsTable />;
}
