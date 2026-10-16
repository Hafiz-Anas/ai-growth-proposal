import type { Metadata } from "next";
import { InsightsScreen } from "@/components/insights/insights-screen";

export const metadata: Metadata = { title: "Insights" };

export default function Page() {
  return <InsightsScreen />;
}
