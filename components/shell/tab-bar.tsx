"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { unreadFor, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isActive, navFor } from "./nav";

export function TabBar() {
  const pathname = usePathname();
  const { t, lang } = useT();
  const unread = useStore((s) => unreadFor(s, s.activeAccountId));
  const layout = useStore((s) => s.aiLayout);

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-safe backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex h-[52px] max-w-lg items-stretch">
        {navFor(layout).map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          if (href === "/ai")
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-label={t(key)}
                  aria-current={active ? "page" : undefined}
                  className="grid h-full place-items-center rounded-lg transition-transform active:scale-90"
                >
                  {/* AI is the heart of the app: the center tab gets the brand color. */}
                  <span
                    className={cn(
                      "grid h-8 w-12 place-items-center rounded-[11px] bg-brand text-primary-foreground transition-shadow",
                      active && "ring-2 ring-brand/30 ring-offset-2 ring-offset-background",
                    )}
                  >
                    <Icon className="size-[20px]" strokeWidth={active ? 2.5 : 2} />
                  </span>
                </Link>
              </li>
            );
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
