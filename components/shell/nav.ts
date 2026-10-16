import { ChartNoAxesColumn, Images, MessageCircle, SquarePlus, Swords } from "lucide-react";
import type { MessageKey } from "@/lib/i18n";

export const NAV: { href: string; key: MessageKey; icon: typeof Images }[] = [
  { href: "/", key: "gallery", icon: Images },
  { href: "/engagement", key: "engagement", icon: MessageCircle },
  { href: "/create", key: "create", icon: SquarePlus },
  { href: "/insights", key: "insights", icon: ChartNoAxesColumn },
  { href: "/competitors", key: "competitors", icon: Swords },
];

export const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
