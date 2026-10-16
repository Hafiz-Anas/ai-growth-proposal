import type { Metadata } from "next";
import { CompetitorsScreen } from "@/components/competitors/competitors-screen";

export const metadata: Metadata = { title: "Competitors" };

export default function Page() {
  return <CompetitorsScreen />;
}
