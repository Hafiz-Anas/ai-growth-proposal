"use client";

import { Check, ChevronRight, Loader2, Plus, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Btn } from "@/components/kit";
import { ConnectionBadge } from "@/components/profile/profile-screen";
import { Sheet } from "@/components/sheet";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { unreadFor, useAccount, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AccountId } from "@/mock/types";
import { useSheet } from "./use-sheet";

export function AccountsSheet() {
  const { open, close } = useSheet("accounts");
  const { t, l, lang } = useT();
  const router = useRouter();
  const state = useStore();
  const activeId = state.activeAccountId;

  return (
    <Sheet open={open} onClose={close} title={t("accounts")}>
      <div className="px-2 pb-3">
        <ul>
          {state.accounts.map((a) => {
            const unread = unreadFor(state, a.id);
            const active = a.id === activeId;
            const pending = a.connection === "pending";
            return (
              <li key={a.id}>
                <button
                  type="button"
                  disabled={pending}
                  aria-current={active}
                  onClick={() => {
                    close();
                    if (!active) {
                      state.switchAccount(a.id as AccountId);
                      toast.success(t("switchedTo", { handle: a.handle }));
                    }
                  }}
                  className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-start hover:bg-muted disabled:opacity-60"
                >
                  <Avatar src={a.avatar} alt={a.handle} size={52} ring={active} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-semibold" dir="ltr">
                      @{a.handle}
                    </p>
                    <p className="truncate text-[13px] text-muted-foreground">{l(a.name)}</p>
                    <ConnectionBadge status={a.connection} className="mt-1 bg-transparent px-0 py-0" />
                  </div>
                  {unread > 0 && !active && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1.5 text-[11px] font-bold text-white" aria-label={t("unreadCount", { n: num(unread, lang) })}>
                      {num(unread, lang)}
                    </span>
                  )}
                  <span className={cn("grid size-6 place-items-center rounded-full border-2", active ? "border-brand bg-brand text-white" : "border-foreground/20")}>
                    {active && <Check className="size-3.5" strokeWidth={3} />}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          onClick={() => state.openSheet({ type: "addAccount" })}
          className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-start text-[15px] font-semibold hover:bg-muted"
        >
          <span className="grid size-[52px] place-items-center rounded-full border-2 border-dashed border-foreground/25">
            <Plus className="size-6" />
          </span>
          {t("addAccount")}
        </button>
        <button
          type="button"
          onClick={() => {
            close();
            router.push("/profile");
          }}
          className="mt-1 flex w-full items-center gap-3 rounded-xl border-t px-2 pt-3 pb-2 text-start text-[15px] hover:bg-muted"
        >
          <Settings className="ms-3 me-3 size-6 text-muted-foreground" />
          <span className="flex-1">{t("profileSettings")}</span>
          <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
        </button>
      </div>
    </Sheet>
  );
}

export function AddAccountSheet() {
  const { open, close } = useSheet("addAccount");
  const { t } = useT();
  const [handle, setHandle] = useState("");
  const [busy, setBusy] = useState(false);
  const valid = /^@?[a-zA-Z0-9._]{3,30}$/.test(handle.trim());

  const connect = () => {
    setBusy(true);
    window.setTimeout(() => {
      useStore.getState().addAccount(handle);
      toast.success(t("accountAdded"));
      setBusy(false);
      setHandle("");
      useStore.getState().openSheet({ type: "accounts" });
    }, 1100);
  };

  return (
    <Sheet open={open} onClose={close} title={t("addAccount")}>
      <form
        className="space-y-4 px-4 pb-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (valid && !busy) connect();
        }}
      >
        <p className="text-[14px] leading-snug text-muted-foreground">{t("addAccountBody")}</p>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">{t("handle")}</span>
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@username"
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            className="h-12 w-full rounded-xl bg-muted px-3 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <Btn type="submit" size="lg" className="w-full" disabled={!valid || busy} icon={busy ? <Loader2 className="animate-spin" /> : undefined}>
          {t("connect")}
        </Btn>
      </form>
    </Sheet>
  );
}

export function EditProfileSheet() {
  const { open, close } = useSheet("editProfile");
  const { t, lang } = useT();
  const account = useAccount();
  const [form, setForm] = useState({ name: account.name[lang], bio: account.bio[lang] });
  const [forId, setForId] = useState(`${account.id}-${lang}-${open}`);
  if (forId !== `${account.id}-${lang}-${open}`) {
    setForId(`${account.id}-${lang}-${open}`);
    setForm({ name: account.name[lang], bio: account.bio[lang] });
  }

  return (
    <Sheet
      open={open}
      onClose={close}
      title={t("editProfile")}
      footer={
        <Btn
          size="lg"
          className="w-full"
          onClick={() => {
            useStore.getState().updateProfile(account.id, {
              name: { ...account.name, [lang]: form.name },
              bio: { ...account.bio, [lang]: form.bio },
            });
            toast.success(t("saved"));
            close();
          }}
        >
          {t("save")}
        </Btn>
      }
    >
      <div className="space-y-4 px-4 pb-4">
        <div className="flex justify-center py-2">
          <Avatar src={account.avatar} alt={account.handle} size={80} />
        </div>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">{t("name")}</span>
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="h-12 w-full rounded-xl bg-muted px-3 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold">{t("bio")}</span>
          <textarea
            value={form.bio}
            rows={4}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="w-full resize-none rounded-xl bg-muted px-3 py-2.5 text-[16px] leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>
    </Sheet>
  );
}
