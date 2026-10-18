"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar, IconBtn } from "@/components/kit";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { useAccount, useNotifications, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

/** Notifications bell, then the profile picture (opens Profile & settings). Shown in every header. */
export function HeaderActions() {
  const { t, lang } = useT();
  const account = useAccount();
  const onProfile = usePathname() === "/profile";
  const openSheet = useStore((s) => s.openSheet);
  const unread = useNotifications().filter((n) => !n.read).length;

  return (
    <>
      <IconBtn label={unread ? `${t("notifications")}, ${t("unreadCount", { n: num(unread, lang) })}` : t("notifications")} onClick={() => openSheet({ type: "notifications" })}>
        <Bell strokeWidth={1.8} />
        {unread > 0 && (
          <span className="absolute end-1 top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-bad px-1 text-[11px] leading-none font-bold text-white ring-2 ring-background">
            {num(unread, lang)}
          </span>
        )}
      </IconBtn>
      <Link
        href="/profile"
        aria-label={t("profileSettings")}
        title={t("profileSettings")}
        aria-current={onProfile ? "page" : undefined}
        className="grid size-10 shrink-0 place-items-center rounded-full transition-transform active:scale-95"
      >
        <Avatar src={account.avatar} alt={account.handle} size={30} className={cn(onProfile && "ring-2 ring-foreground ring-offset-2 ring-offset-background")} />
      </Link>
    </>
  );
}
