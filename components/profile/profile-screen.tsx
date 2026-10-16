"use client";

import { Bell, ChevronRight, CircleHelp, CreditCard, Globe, Info, Link2, LogOut, MessageSquare, Moon, Plus, RotateCcw, Users } from "lucide-react";
import Image from "next/image";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { Avatar, Btn, Segmented, Skel } from "@/components/kit";
import { Switch } from "@/components/ui/switch";
import { compact, num } from "@/lib/format";
import { useFakeLoading, useT } from "@/lib/hooks";
import { unreadFor, useAccount, usePhotos, useStore, type Theme } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Lang } from "@/mock/types";

export function ProfileScreen() {
  const loading = useFakeLoading();
  return (
    <div className="pt-2 lg:pt-6">
      {loading ? <HeaderSkeleton /> : <ProfileHeader />}
      <Settings />
    </div>
  );
}

function ProfileHeader() {
  const { t, l, lang } = useT();
  const account = useAccount();
  const photos = usePhotos();
  const openSheet = useStore((s) => s.openSheet);
  const published = photos.filter((p) => p.status === "published");
  const share = async () => {
    try {
      await navigator.clipboard.writeText(`https://instagram.com/${account.handle}`);
    } catch {
      /* clipboard may be blocked; the demo still confirms */
    }
    toast.success(t("profileLinkCopied"));
  };

  return (
    <section className="px-4 lg:px-0">
      <div className="flex items-center gap-5 lg:gap-16 lg:px-10">
        <Avatar src={account.avatar} alt={account.handle} size={88} ring className="lg:scale-125" />
        <dl className="grid flex-1 grid-cols-3 text-center lg:max-w-sm lg:text-start">
          {[
            { label: t("posts"), value: compact(account.posts, lang) },
            { label: t("followers"), value: compact(account.followers, lang) },
            { label: t("following"), value: compact(account.following, lang) },
          ].map((s) => (
            <div key={s.label} className="flex flex-col-reverse lg:flex-row lg:gap-1.5">
              <dt className="text-[13px] text-muted-foreground lg:text-[15px] lg:text-foreground">{s.label}</dt>
              <dd className="text-[17px] font-bold lg:text-[15px]">{s.value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="mt-3 lg:mt-5 lg:px-10">
        <h1 className="text-[15px] font-semibold">{l(account.name)}</h1>
        <p className="text-[13px] text-muted-foreground">{l(account.category)}</p>
        <p className="mt-1 text-[14px] leading-snug whitespace-pre-line">{l(account.bio)}</p>
        <p className="mt-1 flex items-center gap-1 text-[14px] font-semibold text-brand-ink" dir="ltr">
          <Link2 className="size-3.5" /> {account.link}
        </p>
        <ConnectionBadge status={account.connection} className="mt-2" />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 lg:max-w-md lg:px-10">
        <Btn variant="secondary" size="sm" className="h-9" onClick={() => openSheet({ type: "editProfile" })}>
          {t("editProfile")}
        </Btn>
        <Btn variant="secondary" size="sm" className="h-9" onClick={share}>
          {t("shareProfile")}
        </Btn>
      </div>
      {published.length > 0 && (
        <div className="-mx-4 mt-5 grid grid-cols-6 gap-[2px] lg:mx-0 lg:gap-1 lg:overflow-hidden lg:rounded-xl">
          {published.slice(0, 6).map((p, i) => (
            <button
              key={p.id}
              type="button"
              aria-label={l(p.dish)}
              onClick={() => useStore.getState().openViewer(published.map((x) => x.id), i)}
              className="relative aspect-square bg-muted"
            >
              <Image src={p.thumb} alt="" fill sizes="(min-width:1024px) 150px, 17vw" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}

export function ConnectionBadge({ status, className }: { status: string; className?: string }) {
  const { t } = useT();
  const map = {
    connected: { dot: "bg-good", text: t("connectedTo") },
    reconnect: { dot: "bg-warn", text: t("reconnectNeeded") },
    pending: { dot: "bg-muted-foreground", text: t("pendingConnection") },
  } as const;
  const m = map[status as keyof typeof map] ?? map.connected;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[12px] font-medium", className)}>
      <span className={cn("size-1.5 rounded-full", m.dot)} aria-hidden />
      {m.text}
    </span>
  );
}

/* ---------- Settings ---------- */

function Settings() {
  const { t, lang } = useT();
  const accounts = useStore((s) => s.accounts);
  const activeId = useStore((s) => s.activeAccountId);
  const prefs = useStore((s) => s.notificationPrefs);
  const theme = useStore((s) => s.theme);
  const planId = useStore((s) => s.planId);
  const planLabel = { starter: { en: "Starter plan", ar: "باقة البداية" }, growth: { en: "Growth plan", ar: "باقة النمو" }, pro: { en: "Pro plan", ar: "الباقة الاحترافية" } }[planId][lang];
  const state = useStore();
  const openSheet = state.openSheet;

  return (
    <div className="mt-8 space-y-6 px-4 lg:px-0">
      <Group title={t("plan")}>
        <Item icon={<CreditCard />} label={planLabel} detail={t("planRenews", { date: lang === "ar" ? "١ نوفمبر" : "1 Nov" })} onClick={() => openSheet({ type: "plan" })} />
      </Group>

      <Group title={t("connectedAccounts")}>
        {accounts.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
            <Avatar src={a.avatar} alt={a.handle} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14px] font-semibold" dir="ltr">
                @{a.handle}
              </p>
              <ConnectionBadge status={a.connection} className="mt-0.5 bg-transparent px-0 py-0" />
            </div>
            {a.connection === "reconnect" ? (
              <Btn
                size="sm"
                onClick={() => {
                  state.reconnectAccount(a.id);
                  toast.success(t("reconnected"));
                }}
              >
                {t("reconnect")}
              </Btn>
            ) : a.id === activeId ? (
              <span className="text-[12px] font-semibold text-brand-ink">{t("active")}</span>
            ) : unreadFor(state, a.id) > 0 ? (
              <span className="grid h-5 min-w-5 place-items-center rounded-full bg-bad px-1.5 text-[11px] font-bold text-white">{num(unreadFor(state, a.id), lang)}</span>
            ) : null}
          </div>
        ))}
        <Item icon={<Plus />} label={t("addAccount")} onClick={() => openSheet({ type: "addAccount" })} accent />
      </Group>

      <Group title={t("notifications")}>
        {(
          [
            ["comments", t("notifyComments")],
            ["messages", t("notifyMessages")],
            ["recs", t("notifyRecs")],
            ["report", t("notifyReport")],
            ["competitors", t("notifyCompetitors")],
          ] as const
        ).map(([key, label]) => (
          <label key={key} className="flex min-h-12 cursor-pointer items-center gap-3 px-4">
            <Bell className="size-5 text-muted-foreground" />
            <span className="flex-1 text-[15px]">{label}</span>
            <Switch
              checked={prefs[key]}
              onCheckedChange={(v) => {
                state.setNotificationPref(key, v);
                toast.success(t("settingSaved"));
              }}
            />
          </label>
        ))}
      </Group>

      <Group title={`${t("language")} • ${t("theme")}`}>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Globe className="size-5 text-muted-foreground" />
          <span className="flex-1 text-[15px]">{t("language")}</span>
          <Segmented<Lang>
            label={t("language")}
            value={lang}
            onChange={state.setLang}
            options={[
              { value: "en", label: "English" },
              { value: "ar", label: "العربية" },
            ]}
            className="w-44"
          />
        </div>
        <div className="flex items-center gap-3 px-4 py-2.5">
          <Moon className="size-5 text-muted-foreground" />
          <span className="flex-1 text-[15px]">{t("theme")}</span>
          <Segmented<Theme>
            label={t("theme")}
            value={theme}
            onChange={state.setTheme}
            options={[
              { value: "light", label: t("light") },
              { value: "dark", label: t("dark") },
              { value: "system", label: t("system") },
            ]}
            className="w-52"
          />
        </div>
      </Group>

      <Group title={t("help")}>
        <Item icon={<CircleHelp />} label={t("helpCenter")} onClick={() => openSheet({ type: "help" })} />
        <Item icon={<MessageSquare />} label={t("contactSupport")} onClick={() => toast.success(t("supportOpened"))} />
      </Group>

      <Group title={t("aboutDemo")}>
        <p className="flex gap-3 px-4 py-3 text-[13px] leading-snug text-muted-foreground">
          <Info className="size-5 shrink-0" />
          {t("aboutDemoBody")}
        </p>
        <Item icon={<Users />} label={t("photoCredits")} href="/CREDITS.md" />
        <Item
          icon={<RotateCcw />}
          label={t("resetDemo")}
          onClick={() => {
            state.resetDemo();
            toast.success(t("demoReset"));
          }}
        />
      </Group>

      <Group>
        <Item icon={<LogOut />} label={t("logOut")} onClick={() => openSheet({ type: "logout" })} danger />
      </Group>
      <p className="pb-4 text-center text-[11px] text-muted-foreground" dir="ltr">
        Growth Engine • Raid Technologies • v0.1 proposal
      </p>
    </div>
  );
}

function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <section>
      {title && <h2 className="mb-1.5 px-1 text-[13px] font-semibold text-muted-foreground">{title}</h2>}
      <div className="divide-y overflow-hidden rounded-2xl border bg-card">{children}</div>
    </section>
  );
}

function Item({
  icon,
  label,
  detail,
  onClick,
  href,
  danger,
  accent,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
  onClick?: () => void;
  href?: string;
  danger?: boolean;
  accent?: boolean;
}) {
  const cls = cn(
    "flex min-h-12 w-full items-center gap-3 px-4 py-2.5 text-start text-[15px] hover:bg-muted/60 [&>svg:first-child]:size-5",
    danger && "text-destructive",
    accent && "text-brand-ink",
    !danger && !accent && "[&>svg:first-child]:text-muted-foreground",
  );
  const inner = (
    <>
      {icon}
      <span className="min-w-0 flex-1">
        {label}
        {detail && <span className="block text-[12px] text-muted-foreground">{detail}</span>}
      </span>
      {!danger && <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />}
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}

function HeaderSkeleton() {
  return (
    <div aria-busy className="px-4 lg:px-10">
      <div className="flex items-center gap-5">
        <Skel className="size-[88px] rounded-full" />
        <div className="grid flex-1 grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skel key={i} className="h-9" />
          ))}
        </div>
      </div>
      <Skel className="mt-4 h-4 w-40" />
      <Skel className="mt-2 h-12 w-full" />
    </div>
  );
}
