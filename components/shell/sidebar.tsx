"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/kit";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { unreadFor, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isActive, navFor } from "./nav";

const item = "flex h-12 w-full items-center gap-4 rounded-xl px-3 text-[15px] transition-colors hover:bg-muted";

/** Desktop navigation, like Instagram on the web. Notifications and Profile live in the header. */
export function Sidebar() {
  const pathname = usePathname();
  const { t, lang } = useT();
  const unread = useStore((s) => unreadFor(s, s.activeAccountId));
  const layout = useStore((s) => s.aiLayout);

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-[244px] flex-col border-e bg-background px-3 pt-7 pb-5 lg:flex">
      <Link href="/" className="mb-8 px-3">
        <Wordmark />
      </Link>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
        {navFor(layout).map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(item, active && "font-bold")}>
              <span className="relative">
                {href === "/ai" ? (
                  <span className="grid size-[26px] place-items-center rounded-lg bg-brand text-primary-foreground">
                    <Icon className="size-4" strokeWidth={active ? 2.6 : 2} />
                  </span>
                ) : (
                  <Icon className="size-[26px]" strokeWidth={active ? 2.6 : 1.8} />
                )}
                {key === "engagement" && unread > 0 && (
                  <span className="absolute -end-2 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-bad px-1 text-[11px] font-bold text-white">
                    {num(unread, lang)}
                  </span>
                )}
              </span>
              {t(key)}
            </Link>
          );
        })}
      </nav>
      <p className="px-3 text-[11px] leading-relaxed text-muted-foreground">
        {t("by")}
        <br />
        {t("demoNote")}
      </p>
    </aside>
  );
}
