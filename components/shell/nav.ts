import { ChartNoAxesColumn, Images, MessageCircle, Sparkles, SquarePlus, Swords } from "lucide-react";
import type { MessageKey } from "@/lib/i18n";
import type { AiLayout } from "@/lib/store";

export interface NavItem {
  href: string;
  key: MessageKey;
  icon: typeof Images;
}

const side = {
  gallery: { href: "/", key: "gallery", icon: Images },
  engagement: { href: "/engagement", key: "engagement", icon: MessageCircle },
  insights: { href: "/insights", key: "insights", icon: ChartNoAxesColumn },
  competitors: { href: "/competitors", key: "competitors", icon: Swords },
} satisfies Record<string, NavItem>;

/** The center tab is AI by default; the "Footer pop-up" demo layout brings back Create (+). */
export function navFor(layout: AiLayout): NavItem[] {
  const center: NavItem = layout === "tab" ? { href: "/ai", key: "aiTab", icon: Sparkles } : { href: "/create", key: "create", icon: SquarePlus };
  return [side.gallery, side.engagement, center, side.insights, side.competitors];
}

export const isActive = (pathname: string, href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));
