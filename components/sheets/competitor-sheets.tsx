"use client";

import { ExternalLink, Plus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar, Btn, Delta } from "@/components/kit";
import { Sheet } from "@/components/sheet";
import { compact, num, pct } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { useCompetitors, useStore } from "@/lib/store";
import { competitorSuggestions } from "@/mock/competitors";
import type { AccountId } from "@/mock/types";
import { useSheet } from "./use-sheet";

const MAX = 5;

export function AddCompetitorSheet() {
  const { open, close } = useSheet("addCompetitor");
  const { t, lang } = useT();
  const accountId = useStore((s) => s.activeAccountId) as AccountId;
  const competitors = useCompetitors();
  const [handle, setHandle] = useState("");
  const clean = handle.trim().replace(/^@/, "").toLowerCase();
  const exists = competitors.some((c) => c.handle === clean);
  const full = competitors.length >= MAX;
  const valid = /^[a-z0-9._]{3,30}$/.test(clean) && !exists && !full;
  const suggestions = (competitorSuggestions[accountId] ?? []).filter((s) => !competitors.some((c) => c.handle === s.handle));

  const add = (h: string) => {
    useStore.getState().addCompetitor(h);
    toast.success(t("competitorAdded"));
    setHandle("");
    close();
  };

  return (
    <Sheet open={open} onClose={close} title={t("addCompetitor")}>
      <div className="px-4 pb-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (valid) add(clean);
          }}
          className="flex gap-2"
        >
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="@username"
            aria-label={t("handle")}
            dir="ltr"
            autoCapitalize="none"
            autoCorrect="off"
            className="h-11 min-w-0 flex-1 rounded-xl bg-muted px-3 text-[16px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Btn type="submit" disabled={!valid} icon={<Plus />}>
            {t("add")}
          </Btn>
        </form>
        <p className="mt-2 text-[12px] text-muted-foreground">
          {num(competitors.length, lang)} / {num(MAX, lang)} • {t("noCompetitorsBody")}
        </p>
        {suggestions.length > 0 && !full && (
          <>
            <h3 className="mt-5 mb-2 text-[13px] font-semibold text-muted-foreground">{t("suggestionsTitle")}</h3>
            <ul className="divide-y overflow-hidden rounded-2xl border">
              {suggestions.map((s) => (
                <li key={s.handle} className="flex items-center gap-3 px-3 py-2.5">
                  <Avatar src={s.avatar} alt={s.handle} size={44} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold" dir="ltr">
                      {s.handle}
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                      {s.name} • {compact(s.followers, lang)} {t("followers").toLowerCase()}
                    </p>
                  </div>
                  <Btn size="sm" onClick={() => add(s.handle)}>
                    {t("add")}
                  </Btn>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </Sheet>
  );
}

export function CompetitorSheet() {
  const { open, data, close } = useSheet("competitor");
  const { t, l, lang } = useT();
  const competitors = useCompetitors();
  const c = data ? competitors.find((x) => x.id === data.id) : undefined;

  return (
    <Sheet open={open} onClose={close} title={c ? <span dir="ltr">{c.handle}</span> : ""}>
      {c && (
        <div className="px-4 pb-5">
          <div className="flex items-center gap-5">
            <Avatar src={c.avatar} alt={c.handle} size={80} ring />
            <dl className="grid flex-1 grid-cols-3 text-center">
              <div>
                <dd className="text-[17px] font-bold">{compact(c.followers, lang)}</dd>
                <dt className="text-[12px] text-muted-foreground">{t("followers")}</dt>
              </div>
              <div>
                <dd className="text-[17px] font-bold">{num(c.postsPerWeek, lang)}</dd>
                <dt className="text-[12px] text-muted-foreground">{t("postsPerWeek")}</dt>
              </div>
              <div>
                <dd className="text-[17px] font-bold">{pct(c.engagementRate, lang)}</dd>
                <dt className="text-[12px] text-muted-foreground">{t("engagementRate")}</dt>
              </div>
            </dl>
          </div>
          <p className="mt-3 text-[15px] font-semibold">{l(c.name)}</p>
          <p className="mt-0.5 text-[14px] leading-snug text-muted-foreground">{l(c.note)}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-[13px]">
            <div className="rounded-xl bg-muted p-3">
              <p className="text-muted-foreground">{t("growth30")}</p>
              <Delta value={c.growth} lang={lang} className="text-[15px]" />
            </div>
            <div className="rounded-xl bg-muted p-3">
              <p className="text-muted-foreground">{t("bestDaysTimes")}</p>
              <p className="font-semibold">
                {l(c.bestDays)} • {l(c.bestTime)}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-[2px] overflow-hidden rounded-xl">
            {c.thumbs.map((src, i) => (
              <span key={i} className="relative aspect-square bg-muted">
                <Image src={src} alt="" fill sizes="33vw" className="object-cover" />
              </span>
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">{t("estimateNote")}</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Btn variant="secondary" icon={<ExternalLink />} onClick={() => toast(t("openedInstagram"))}>
              {t("viewOnInstagram")}
            </Btn>
            <Btn
              variant="danger"
              icon={<Trash2 />}
              onClick={() => {
                const removed = useStore.getState().removeCompetitor(c.id);
                close();
                toast.success(t("competitorRemoved"), {
                  action: removed ? { label: t("undo"), onClick: () => useStore.getState().restoreCompetitor(removed) } : undefined,
                });
              }}
            >
              {t("remove")}
            </Btn>
          </div>
        </div>
      )}
    </Sheet>
  );
}
