import type { Metadata } from "next";
import { CreateScreen } from "@/components/create/create-screen";

export const metadata: Metadata = { title: "Create post" };

export default function Page() {
  return <CreateScreen />;
}
