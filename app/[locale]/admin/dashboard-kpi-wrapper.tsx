"use client";

import dynamic from "next/dynamic";
import type {AdminDashboardKPI} from "@/lib/data/admin";

const DashboardKpiGrid = dynamic(() => import("./dashboard-kpi-grid").then(m => ({default: m.DashboardKpiGrid})), {ssr: false});

export default function DashboardKpiWrapper({kpis, labels, locale}: {kpis: AdminDashboardKPI[]; labels: Record<string, string>; locale: string}) {
  return <DashboardKpiGrid kpis={kpis} labels={labels} locale={locale} />;
}