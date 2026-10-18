import type { Metadata } from "next";
import { AiScreen } from "@/components/ai/ai-screen";

export const metadata: Metadata = { title: "AI" };

export default function Page() {
  return <AiScreen />;
}
