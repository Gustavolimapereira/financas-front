import type { Metadata } from "next";
import { FinancialDashboard } from "@/components/dashboard/financial-dashboard";

export const metadata: Metadata = { title: "Visão geral" };

export default function DashboardPage() { return <FinancialDashboard />; }
