"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Info, MoreHorizontal, Plus, Sparkles, Swords, Trash2 } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { HBars, StackedBar } from "@/components/charts";
import { Avatar, Btn, Card, Chip, EmptyState, Section, Skel } from "@/components/kit";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { compact, num, pct } from "@/lib/format";
import { useFakeLoading, useT } from "@/lib/hooks";
import { useAccount, useCompetitors, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { ownComparison } from "@/mock/competitors";
import type { AccountId, Competitor, L } from "@/mock/types";

export function CompetitorsScreen() {
  const { t } = useT();
  const loading = useFakeLoading();
  const competitors = useCompetitors();
  const openSheet = useStore((s) => s.openSheet);

  return (
    <div className="pt-1 lg:pt-4">
      <div className="flex items-center gap-3 px-4 pb-3 lg:px-0">
        <h1 className="flex-1 text-[22px] font-bold tracking-tight">{t("competitors")}</h1>
        <Btn size="sm" variant="secondary" className="rounded-full" icon={<Plus />} onClick={() => openSheet({ type: "addCompetitor" })}>
          {t("addCompetitor")}
        </Btn>
      </div>
      {loading ? (
        <CompetitorsSkeleton />
      ) : competitors.length === 0 ? (
        <EmptyState
          icon={<Swords />}
          title={t("noCompetitors")}
          body={t("noCompetitorsBody")}
          action={<Btn onClick={() => openSheet({ type: "addCompetitor" })}>{t("addCompetitor")}</Btn>}
        />
      ) : (
        <div className="space-y-8">
          <StoryRow competitors={competitors} />
          <div className="grid gap-3 px-4 sm:grid-cols-2 lg:grid-cols-3 lg:px-0">
            <AnimatePresence initial={false}>
              {competitors.map((c) => (
                <CompetitorCard key={c.id} c={c} />
              ))}
            </AnimatePresence>
          </div>
          <Comparison competitors={competitors.filter((c) => !c.analyzing)} />
        </div>
      )}
    </div>
  );
}

/* Instagram stories-style row of competitors */
function StoryRow({ competitors }: { competitors: Competitor[] }) {
  const openSheet = useStore((s) => s.openSheet);
  return (
    <div className="no-scrollbar flex gap-4 overflow-x-auto px-4 lg:px-0">
      {competitors.map((c) => (
        <button key={c.id} type="button" onClick={() => openSheet({ type: "competitor", id: c.id })} className="flex w-[72px] shrink-0 flex-col items-center gap-1.5">
          <Avatar src={c.avatar} alt={c.handle} size={66} ring />
          <span className="w-full truncate text-center text-[11.5px]" dir="ltr">
            {c.handle}
          </span>
        </button>
      ))}
    </div>
  );
}

function CompetitorCard({ c }: { c: Competitor }) {
  const { t, l, lang } = useT();
  const openSheet = useStore((s) => s.openSheet);

  // Newly added accounts "analyze" for a moment before their numbers appear.
  useEffect(() => {
    if (!c.analyzing) return;
    const id = window.setTimeout(() => useStore.getState().finishCompetitor(c.id), 2200);
    return () => window.clearTimeout(id);
  }, [c.analyzing, c.id]);

  const remove = () => {
    const removed = useStore.getState().removeCompetitor(c.id);
    toast.success(t("competitorRemoved"), {
      action: removed ? { label: t("undo"), onClick: () => useStore.getState().restoreCompetitor(removed) } : undefined,
    });
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}>
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => openSheet({ type: "competitor", id: c.id })} className="flex min-w-0 flex-1 items-center gap-3 text-start">
            <Avatar src={c.avatar} alt={c.handle} size={52} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold" dir="ltr">
                {c.handle}
              </p>
              <p className="truncate text-[13px] text-muted-foreground">{l(c.name)}</p>
            </div>
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger aria-label={t("more")} className="grid size-9 place-items-center rounded-full hover:bg-muted">
              <MoreHorizontal className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast(t("openedInstagram"))}>{t("viewOnInstagram")}</DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={remove}>
                <Trash2 /> {t("remove")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {c.analyzing ? (
          <div className="mt-4 space-y-2" aria-live="polite">
            <p className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
              <Sparkles className="size-3.5 animate-pulse text-brand" /> {t("analyzing")}
            </p>
            <Skel className="h-10" />
            <div className="grid grid-cols-3 gap-[2px]">
              {[0, 1, 2].map((i) => (
                <Skel key={i} className="aspect-square rounded-none" />
              ))}
            </div>
          </div>
        ) : (
          <>
            <dl className="mt-4 grid grid-cols-3 text-center">
              <Stat label={t("followers")} value={compact(c.followers, lang)} />
              <Stat label={t("postsPerWeek")} value={num(c.postsPerWeek, lang)} />
              <Stat label={t("engagementRate")} value={pct(c.engagementRate, lang)} />
            </dl>
            <div className="mt-3 grid grid-cols-3 gap-[2px] overflow-hidden rounded-lg">
              {c.thumbs.map((src, i) => (
                <span key={i} className="relative aspect-square bg-muted">
                  <Image src={src} alt="" fill sizes="120px" className="object-cover" />
                </span>
              ))}
            </div>
            <p className="mt-3 text-[13px] leading-snug text-muted-foreground">{l(c.note)}</p>
          </>
        )}
      </Card>
    </motion.div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dd className="text-[16px] font-bold">{value}</dd>
      <dt className="truncate text-[11.5px] text-muted-foreground">{label}</dt>
    </div>
  );
}

/* ---------- Comparison ---------- */

function Comparison({ competitors }: { competitors: Competitor[] }) {
  const { t, l, lang } = useT();
  const account = useAccount();
  const own = ownComparison[account.id as AccountId] ?? ownComparison.mathanet;
  const [pick, setPick] = useState<string>("avg");
  if (competitors.length === 0) return null;

  const avg = (f: (c: Competitor) => number) => competitors.reduce((s, c) => s + f(c), 0) / competitors.length;
  const selected = competitors.find((c) => c.id === pick);
  const them = selected
    ? { name: `@${selected.handle}`, postsPerWeek: selected.postsPerWeek, engagementRate: selected.engagementRate, mix: selected.mix, bestDays: selected.bestDays, bestTime: selected.bestTime }
    : {
        name: lang === "ar" ? "متوسط المنافسين" : "Competitor average",
        postsPerWeek: avg((c) => c.postsPerWeek),
        engagementRate: avg((c) => c.engagementRate),
        mix: { reel: avg((c) => c.mix.reel), carousel: avg((c) => c.mix.carousel), photo: avg((c) => c.mix.photo) },
        bestDays: competitors[0].bestDays,
        bestTime: competitors[0].bestTime,
      };

  const mix = (m: { reel: number; carousel: number; photo: number }) => [
    { label: t("reel"), value: m.reel, display: pct(m.reel, lang, 0), color: "series-1" as const },
    { label: t("carousel"), value: m.carousel, display: pct(m.carousel, lang, 0), color: "series-2" as const },
    { label: t("photo"), value: m.photo, display: pct(m.photo, lang, 0), color: "series-3" as const },
  ];

  const insights = buildComparisonNotes(own, them, selected?.handle);

  return (
    <div className="space-y-6">
      <Section
        title={t("comparison")}
        action={
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">
            <Sparkles className="size-3 text-brand" /> {t("estimate")}
          </span>
        }
      >
        <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto px-4 lg:px-0">
          <Chip active={pick === "avg"} onClick={() => setPick("avg")}>
            {lang === "ar" ? "الكل" : "All"}
          </Chip>
          {competitors.map((c) => (
            <Chip key={c.id} active={pick === c.id} onClick={() => setPick(c.id)}>
              <span dir="ltr">@{c.handle}</span>
            </Chip>
          ))}
        </div>
        <Card className="mx-4 divide-y lg:mx-0">
          <Legend you={`@${account.handle}`} them={them.name} />
          <Row title={t("postingFrequency")}>
            <HBars
              rows={[
                { label: t("you"), value: own.postsPerWeek, display: t("perWeek", { n: num(own.postsPerWeek, lang) }) },
                { label: them.name, value: them.postsPerWeek, display: t("perWeek", { n: num(them.postsPerWeek, lang, 1) }), muted: true },
              ]}
            />
          </Row>
          <Row title={t("engagementRate")}>
            <HBars
              rows={[
                { label: t("you"), value: own.engagementRate, display: pct(own.engagementRate, lang) },
                { label: them.name, value: them.engagementRate, display: pct(them.engagementRate, lang), muted: true },
              ]}
            />
          </Row>
          <Row title={t("contentMix")}>
            <div className="space-y-3">
              <div>
                <p className="mb-1.5 text-[13px]">{t("you")}</p>
                <StackedBar parts={mix(own.mix)} />
              </div>
              <div>
                <p className="mb-1.5 text-[13px]">{them.name}</p>
                <StackedBar parts={mix(them.mix)} />
              </div>
            </div>
          </Row>
          <Row title={t("bestDaysTimes")}>
            <div className="grid grid-cols-2 gap-3 text-[13px]">
              <div className="rounded-xl bg-brand-soft p-3">
                <p className="font-semibold">{t("you")}</p>
                <p className="mt-1">{l(own.bestDays)}</p>
                <p className="text-muted-foreground">{l(own.bestTime)}</p>
              </div>
              <div className="rounded-xl bg-muted p-3">
                <p className="truncate font-semibold">{them.name}</p>
                <p className="mt-1">{l(them.bestDays)}</p>
                <p className="text-muted-foreground">{l(them.bestTime)}</p>
              </div>
            </div>
          </Row>
          <p className="flex items-start gap-1.5 p-4 text-[12px] text-muted-foreground">
            <Info className="mt-px size-3.5 shrink-0" /> {t("estimateNote")}
          </p>
        </Card>
      </Section>

      <Section title={t("aiComparison")}>
        <Card className="mx-4 p-4 lg:mx-0">
          <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
            <Sparkles className="size-3" /> {t("estimate")}
          </span>
          <ul className="space-y-2.5 text-[14px] leading-snug">
            {insights.map((n, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {l(n)}
              </li>
            ))}
          </ul>
        </Card>
      </Section>
    </div>
  );
}

function Legend({ you, them }: { you: string; them: string }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3 text-[12px]">
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-4 rounded-full bg-brand" aria-hidden />
        <bdi>{you}</bdi>
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="h-2 w-4 rounded-full bg-neutral-series" aria-hidden />
        <bdi>{them}</bdi>
      </span>
    </div>
  );
}

function Row({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4">
      <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

function buildComparisonNotes(
  own: { postsPerWeek: number; engagementRate: number; mix: { reel: number } },
  them: { postsPerWeek: number; engagementRate: number; mix: { reel: number } },
  /** The selected competitor's @handle, or undefined when comparing with the average. */
  handle?: string,
): L[] {
  // "@x posts" vs "your competitors post", so the sentences read naturally either way.
  const who: L = handle ? { en: `@${handle}`, ar: `@${handle}` } : { en: "Your competitors", ar: "منافسوك" };
  const whoLower: L = handle ? who : { en: "your competitors", ar: "منافسيك" };
  const s = handle ? "s" : "";
  const notes: L[] = [];
  const postGap = them.postsPerWeek - own.postsPerWeek;
  notes.push(
    postGap > 0.5
      ? {
          en: `${who.en} post${s} about ${num(postGap, "en", 1)} more times a week. One extra Reel a week would close most of the gap.`,
          ar: `${who.ar} ${handle ? "ينشر" : "ينشرون"} تقريباً ${num(postGap, "ar", 1)} مرات أكثر أسبوعياً. ريلز إضافي واحد أسبوعياً يغلق معظم الفارق.`,
        }
      : {
          en: `You post about as often as ${whoLower.en}. Keep the rhythm steady.`,
          ar: `تنشر تقريباً بنفس معدل ${whoLower.ar}. حافظ على هذا الإيقاع.`,
        },
  );
  const engGap = own.engagementRate - them.engagementRate;
  notes.push(
    engGap >= 0
      ? {
          en: `Your engagement is ${num(engGap, "en", 1)} points higher: your audience is more loyal.`,
          ar: `تفاعلك أعلى بـ${num(engGap, "ar", 1)} نقطة: جمهورك أكثر ولاءً.`,
        }
      : {
          en: `${who.en} get${s} ${num(-engGap, "en", 1)} points more engagement, mostly from Reels and quick replies.`,
          ar: `${who.ar} ${handle ? "يحصل" : "يحصلون"} على تفاعل أعلى بـ${num(-engGap, "ar", 1)} نقطة، أغلبه من الريلز والردود السريعة.`,
        },
  );
  notes.push(
    them.mix.reel > own.mix.reel + 5
      ? {
          en: `Reels are ${pct(them.mix.reel, "en", 0)} of their posts vs ${pct(own.mix.reel, "en", 0)} of yours.`,
          ar: `الريلز تمثل ${pct(them.mix.reel, "ar", 0)} من منشوراتهم مقابل ${pct(own.mix.reel, "ar", 0)} من منشوراتك.`,
        }
      : {
          en: "Your content mix is balanced compared to theirs.",
          ar: "تنوّع المحتوى عندك متوازن مقارنةً بهم.",
        },
  );
  return notes;
}

function CompetitorsSkeleton() {
  return (
    <div aria-busy className="space-y-6 px-4 lg:px-0">
      <div className="flex gap-4">
        {[0, 1, 2, 3].map((i) => (
          <Skel key={i} className="size-[66px] shrink-0 rounded-full" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skel key={i} className={cn("h-64 rounded-2xl", i > 0 && "max-sm:hidden")} />
        ))}
      </div>
    </div>
  );
}
