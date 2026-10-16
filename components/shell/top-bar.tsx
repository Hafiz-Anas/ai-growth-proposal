"use client";

import { Bell, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Avatar, IconBtn } from "@/components/kit";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { unreadFor, useAccount, useNotifications, useStore } from "@/lib/store";

export function TopBar() {
  const { t, lang } = useT();
  const account = useAccount();
  const openSheet = useStore((s) => s.openSheet);
  const unread = useNotifications().filter((n) => !n.read).length;
  const otherUnread = useStore((s) => s.accounts.some((a) => a.id !== s.activeAccountId && unreadFor(s, a.id) > 0));

  return (
    <header className="sticky top-0 z-30 border-b border-transparent bg-background/85 pt-safe backdrop-blur-xl supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-14 max-w-[935px] items-center gap-1 px-2 lg:px-8">
        <Link href="/profile" aria-label={t("openProfile")} className="grid size-10 place-items-center rounded-full">
          <Avatar src={account.avatar} alt={account.handle} size={32} ring />
        </Link>
        <button
          type="button"
          onClick={() => openSheet({ type: "accounts" })}
          aria-label={`${t("switchAccount")}: @${account.handle}`}
          aria-haspopup="dialog"
          className="flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 hover:bg-muted"
        >
          <span className="truncate text-[17px] font-bold tracking-tight" dir="ltr">
            @{account.handle}
          </span>
          <ChevronDown className="size-4 shrink-0" strokeWidth={2.5} />
          {otherUnread && <span className="size-2 shrink-0 rounded-full bg-bad" aria-hidden />}
        </button>
        <div className="flex-1" />
        <IconBtn label={unread ? `${t("notifications")}, ${t("unreadCount", { n: num(unread, lang) })}` : t("notifications")} onClick={() => openSheet({ type: "notifications" })}>
          <Bell strokeWidth={1.8} />
          {unread > 0 && (
            <span className="absolute end-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-bad px-1 text-[11px] leading-none font-bold text-white ring-2 ring-background">
              {num(unread, lang)}
            </span>
          )}
        </IconBtn>
      </div>
    </header>
  );
}
