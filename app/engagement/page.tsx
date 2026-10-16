import type { Metadata } from "next";
import { EngagementScreen } from "@/components/engagement/engagement-screen";

export const metadata: Metadata = { title: "Engagement" };

export default function Page() {
  return <EngagementScreen />;
}
