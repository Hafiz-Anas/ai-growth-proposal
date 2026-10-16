import type { Metadata } from "next";
import { ProfileScreen } from "@/components/profile/profile-screen";

export const metadata: Metadata = { title: "Profile & settings" };

export default function Page() {
  return <ProfileScreen />;
}
