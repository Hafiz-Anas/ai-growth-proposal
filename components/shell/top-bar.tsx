"use client";

import { ChevronDown } from "lucide-react";
import { useT } from "@/lib/hooks";
import { unreadFor, useAccount, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { HeaderActions } from "./header-actions";

export function TopBar({ className }: { className?: string }) {
  const { t } = useT();
  const account = useAccount();
  const openSheet = useStore((s) => s.openSheet);
  const otherUnread = useStore((s) => s.accounts.some((a) => a.id !== s.activeAccountId && unreadFor(s, a.id) > 0));

  return (
    <header className={cn("sticky top-0 z-30 border-b border-transparent bg-background/85 pt-safe backdrop-blur-xl supports-[backdrop-filter]:bg-background/75", className)}>
      <div className="mx-auto flex h-14 max-w-[935px] items-center gap-1 ps-2.5 pe-2 lg:px-8">
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
        <HeaderActions />
      </div>
    </header>
  );
}
