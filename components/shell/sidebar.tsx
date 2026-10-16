"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, Wordmark } from "@/components/kit";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { unreadFor, useAccount, useNotifications, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NAV, isActive } from "./nav";

const item = "flex h-12 w-full items-center gap-4 rounded-xl px-3 text-[15px] transition-colors hover:bg-muted";

/** Desktop navigation, like Instagram on the web. */
export function Sidebar() {
  const pathname = usePathname();
  const { t, lang } = useT();
  const account = useAccount();
  const openSheet = useStore((s) => s.openSheet);
  const unread = useStore((s) => unreadFor(s, s.activeAccountId));
  const unreadNotifications = useNotifications().filter((n) => !n.read).length;

  return (
    <aside className="fixed inset-y-0 start-0 z-40 hidden w-[244px] flex-col border-e bg-background px-3 pt-7 pb-5 lg:flex">
      <Link href="/" className="mb-8 px-3">
        <Wordmark />
      </Link>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-1">
        {NAV.map(({ href, key, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <Link key={href} href={href} aria-current={active ? "page" : undefined} className={cn(item, active && "font-bold")}>
              <span className="relative">
                <Icon className="size-[26px]" strokeWidth={active ? 2.6 : 1.8} />
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
        <button type="button" className={item} onClick={() => openSheet({ type: "notifications" })}>
          <span className="relative">
            <Bell className="size-[26px]" strokeWidth={1.8} />
            {unreadNotifications > 0 && <span className="absolute -end-0.5 top-0 size-2.5 rounded-full bg-bad ring-2 ring-background" />}
          </span>
          {t("notifications")}
        </button>
        <Link href="/profile" aria-current={pathname === "/profile" ? "page" : undefined} className={cn(item, pathname === "/profile" && "font-bold")}>
          <Avatar src={account.avatar} alt={account.handle} size={26} className={cn(pathname === "/profile" && "ring-2 ring-foreground")} />
          {t("profile")}
        </Link>
      </nav>
      <p className="px-3 text-[11px] leading-relaxed text-muted-foreground">
        {t("by")}
        <br />
        {t("demoNote")}
      </p>
    </aside>
  );
}
