"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { unreadFor, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NAV, isActive } from "./nav";

export function TabBar() {
  const pathname = usePathname();
  const { t, lang } = useT();
  const unread = useStore((s) => unreadFor(s, s.activeAccountId));

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-safe backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex h-[52px] max-w-lg items-stretch">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-label={t(key)}
                aria-current={active ? "page" : undefined}
                className="relative grid h-full place-items-center rounded-lg transition-transform active:scale-90"
              >
                <Icon className={cn("size-[26px]", active ? "text-foreground" : "text-foreground/80")} strokeWidth={active ? 2.6 : 1.7} />
                {key === "engagement" && unread > 0 && (
                  <span className="absolute top-2 start-[calc(50%+6px)] grid h-[17px] min-w-[17px] place-items-center rounded-full bg-bad px-1 text-[10px] font-bold text-white ring-2 ring-background">
                    {num(unread, lang)}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
