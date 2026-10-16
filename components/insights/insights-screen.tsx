"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Activity, Check, CircleAlert, FileText, Lightbulb, RefreshCw, Share2, Sparkles, X } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { toast } from "sonner";
import { BarChart, Heatmap, HBars } from "@/components/charts";
import { Btn, Card, Delta, EmptyState, Section, Segmented, Skel } from "@/components/kit";
import { compact, date, daysFromNow, hourLabel, num, pct, weekday, when } from "@/lib/format";
import { engagementOf, useFakeLoading, useInsights, useT } from "@/lib/hooks";
import { usePhotos, useRecs, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { kuwaitAt } from "@/mock/clock";
import { TIME_SLOTS } from "@/mock/insights";
import type { Photo, Recommendation } from "@/mock/types";

export function InsightsScreen() {
  const { t } = useT();
  const loading = useFakeLoading();
  if (loading) return <InsightsSkeleton />;
  return (
    <div className="space-y-8 pt-2 lg:grid lg:grid-cols-2 lg:gap-x-6 lg:gap-y-8 lg:space-y-0 lg:pt-4">
      <h1 className="sr-only">{t("insights")}</h1>
      <Overview />
      <AiStatus />
      <WeeklyReport />
      <Recommendations />
      <PostPerformance />
      <BestTimes />
      <ContentTypes />
      <Monitored />
    </div>
  );
}

/* ---------- Overview ---------- */

function Overview() {
  const { t, lang } = useT();
  const ins = useInsights();
  const tiles = [
    { label: t("followers"), value: compact(ins.followers, lang), delta: ins.followersChange, unit: "%" as const },
    { label: t("reach"), value: compact(ins.reach, lang), delta: ins.reachChange, unit: "%" as const },
    { label: t("engagementRate"), value: pct(ins.engagementRate, lang), delta: ins.engagementChange, unit: "pt" as const },
  ];
  return (
    <Section title={t("accountOverview")} action={<span className="text-[13px] text-muted-foreground">{t("last7Days")}</span>} className="lg:col-span-2">
      <div className="grid grid-cols-3 gap-2 px-4 lg:gap-4 lg:px-0">
        {tiles.map((x) => (
          <Card key={x.label} className="p-3 lg:p-4">
            <p className="truncate text-[12px] text-muted-foreground">{x.label}</p>
            <p className="mt-1 text-[22px] leading-none font-bold tracking-tight lg:text-[28px]">{x.value}</p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-1">
              <Delta value={x.delta} unit={x.unit} lang={lang} />
              <span className="hidden text-[11px] text-muted-foreground sm:inline">{t("vsLastWeek")}</span>
            </div>
          </Card>
        ))}
      </div>
    </Section>
  );
}

/* ---------- AI status ---------- */

function AiStatus() {
  const { t, lang } = useT();
  const ins = useInsights();
  const [running, setRunning] = useState(false);
  const good = ins.aiHealth === "good";
  const run = () => {
    setRunning(true);
    window.setTimeout(() => {
      useStore.getState().runAnalysis();
      setRunning(false);
      toast.success(t("analysisDone"));
    }, 1600);
  };
  return (
    <Section title={t("aiStatus")}>
      <Card className="mx-4 p-4 lg:mx-0">
        <div className="flex items-center gap-3">
          <span className={cn("grid size-11 place-items-center rounded-full", good ? "bg-brand-soft text-good" : "bg-warn/15 text-warn")}>
            {good ? <Activity className="size-5" /> : <CircleAlert className="size-5" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 font-semibold">
              <span className={cn("size-2 rounded-full", good ? "bg-good" : "bg-warn")} aria-hidden />
              {good ? t("healthGood") : t("healthAttention")}
            </p>
            <p className="text-[13px] text-muted-foreground">{t("postsAnalyzed", { n: num(ins.postsAnalyzed, lang) })}</p>
          </div>
        </div>
        <dl className="mt-4 grid grid-cols-2 gap-3 border-t pt-3 text-[13px]">
          <div>
            <dt className="text-muted-foreground">{t("lastAnalysis")}</dt>
            <dd className="font-medium">{running ? t("analyzing") : when(ins.lastAnalysis, lang)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">{t("nextAnalysis")}</dt>
            <dd className="font-medium">{when(ins.nextAnalysis, lang)}</dd>
          </div>
        </dl>
        <Btn variant="secondary" size="sm" className="mt-4 w-full" icon={<RefreshCw className={cn(running && "animate-spin")} />} disabled={running} onClick={run}>
          {running ? t("analyzing") : t("runNow")}
        </Btn>
      </Card>
    </Section>
  );
}

/* ---------- Weekly report ---------- */

function WeeklyReport() {
  const { t, l, lang } = useT();
  const ins = useInsights();
  const openSheet = useStore((s) => s.openSheet);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(`https://growth-engine.demo/report/${ins.weekly.score}`);
    } catch {
      /* clipboard can be blocked; the toast still confirms the demo action */
    }
    toast.success(t("reportShared"));
  };
  return (
    <Section title={t("weeklyReport")} action={<span className="text-[13px] text-muted-foreground">{l(ins.weekly.range)}</span>}>
      <Card className="mx-4 p-4 lg:mx-0">
        <div className="flex items-center gap-4">
          <ScoreRing score={ins.weekly.score} label={t("score")} lang={lang} />
          <ul className="min-w-0 flex-1 space-y-1.5 text-[13.5px] leading-snug">
            {ins.weekly.bullets.slice(0, 2).map((b, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
                {l(b)}
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-4 flex gap-2">
          <Btn size="sm" variant="secondary" className="flex-1" icon={<FileText />} onClick={() => openSheet({ type: "report" })}>
            {t("viewReport")}
          </Btn>
          <Btn size="sm" variant="ghost" icon={<Share2 />} onClick={share}>
            {t("shareReport")}
          </Btn>
        </div>
      </Card>
    </Section>
  );
}

export function ScoreRing({ score, label, lang, size = 64 }: { score: number; label: string; lang: "en" | "ar"; size?: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${label}: ${score}/100`}>
      <svg viewBox="0 0 64 64" className="size-full -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-muted" />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-brand" strokeDasharray={c} strokeDashoffset={c * (1 - score / 100)} />
      </svg>
      <span className="absolute inset-0 grid place-items-center text-lg font-bold">{num(score, lang)}</span>
    </div>
  );
}

/* ---------- Recommendations ---------- */

function Recommendations() {
  const { t } = useT();
  const recs = useRecs();
  const [showDismissed, setShowDismissed] = useState(false);
  const visible = recs.filter((r) => showDismissed || r.status !== "dismissed");
  const open = recs.filter((r) => r.status === "new" || r.status === "accepted");
  const hasDismissed = recs.some((r) => r.status === "dismissed");
  return (
    <Section
      title={t("recommendations")}
      className="lg:col-span-2"
      action={
        hasDismissed && (
          <button type="button" onClick={() => setShowDismissed((x) => !x)} className="text-[13px] font-semibold text-brand-ink">
            {t("showDismissed")}
          </button>
        )
      }
    >
      {open.length === 0 && !showDismissed && visible.length === 0 ? (
        <EmptyState icon={<Lightbulb />} title={t("noRecs")} body={t("noRecsBody")} />
      ) : (
        <div className="no-scrollbar flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:grid lg:grid-cols-2 lg:overflow-visible lg:px-0">
          <AnimatePresence initial={false}>
            {visible.map((r) => (
              <RecCard key={r.id} rec={r} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </Section>
  );
}

function RecCard({ rec }: { rec: Recommendation }) {
  const { t, l, lang } = useT();
  const set = useStore((s) => s.setRecStatus);
  const muted = rec.status === "done" || rec.status === "dismissed";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className="w-[84%] shrink-0 snap-center sm:w-[340px] lg:w-auto"
    >
      <Card className={cn("flex h-full flex-col p-4", muted && "opacity-60")}>
        <div className="mb-2 flex items-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
            <Sparkles className="size-3" /> {l(rec.impact)}
          </span>
          {rec.status === "accepted" && <StatusPill>{t("accepted")}</StatusPill>}
          {rec.status === "done" && <StatusPill>{t("markedDone")}</StatusPill>}
          {rec.status === "dismissed" && <StatusPill>{t("dismissed")}</StatusPill>}
        </div>
        <h3 className="text-[15px] leading-snug font-semibold">{l(rec.title)}</h3>
        <p className="mt-1 flex-1 text-[13.5px] leading-snug text-muted-foreground">{l(rec.why)}</p>
        <p className="mt-3 text-[11.5px] text-muted-foreground">{t("basedOn", { n: num(rec.basedOn, lang) })}</p>
        <div className="mt-3 flex gap-2">
          {rec.status === "new" && (
            <>
              <Btn
                size="sm"
                className="flex-1"
                icon={<Check />}
                onClick={() => {
                  set(rec.id, "accepted");
                  toast.success(t("accepted"));
                }}
              >
                {t("accept")}
              </Btn>
              <Btn
                size="sm"
                variant="secondary"
                icon={<X />}
                onClick={() => {
                  set(rec.id, "dismissed");
                  toast.success(t("dismissed"), { action: { label: t("undo"), onClick: () => set(rec.id, "new") } });
                }}
              >
                {t("dismiss")}
              </Btn>
            </>
          )}
          {rec.status === "accepted" && (
            <Btn
              size="sm"
              variant="secondary"
              className="flex-1"
              icon={<Check />}
              onClick={() => {
                set(rec.id, "done");
                toast.success(t("markedDone"));
              }}
            >
              {t("markDone")}
            </Btn>
          )}
          {rec.status === "dismissed" && (
            <Btn size="sm" variant="ghost" onClick={() => set(rec.id, "new")}>
              {t("undo")}
            </Btn>
          )}
        </div>
      </Card>
    </motion.div>
  );
}

function StatusPill({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-semibold">{children}</span>;
}

/* ---------- Post performance ---------- */

type Metric = "reach" | "likes" | "comments" | "saves";

function PostPerformance() {
  const { t, l, lang } = useT();
  const photos = usePhotos();
  const openSheet = useStore((s) => s.openSheet);
  const [metric, setMetric] = useState<Metric>("reach");
  const last10 = photos
    .filter((p) => p.status === "published" && p.metrics)
    .sort((a, b) => b.publishedAt!.localeCompare(a.publishedAt!))
    .slice(0, 10)
    .reverse();
  const values = last10.map((p) => p.metrics![metric]);
  const best = values.indexOf(Math.max(...values));
  return (
    <Section title={t("postPerformance")} action={<span className="text-[13px] text-muted-foreground">{t("last10Posts")}</span>} className="lg:col-span-2">
      <Card className="mx-4 p-4 lg:mx-0">
        <Segmented
          label={t("postPerformance")}
          value={metric}
          onChange={setMetric}
          options={(["reach", "likes", "comments", "saves"] as Metric[]).map((m) => ({ value: m, label: t(m) }))}
          className="mb-5"
        />
        <BarChart
          title={t("postPerformance")}
          values={values}
          highlight={best}
          labels={last10.map((p) => `${l(p.dish)} • ${date(p.publishedAt!, lang)}`)}
          format={(v) => num(v, lang)}
          onSelect={(i) => openSheet({ type: "performance", photoId: last10[i].id })}
          tickLabels={last10.map((p) => <Thumb key={p.id} photo={p} />)}
          height={150}
        />
      </Card>
    </Section>
  );
}

function Thumb({ photo }: { photo: Photo }) {
  return (
    <span className="relative block aspect-square w-full max-w-9 overflow-hidden rounded-[5px] bg-muted">
      <Image src={photo.thumb} alt="" fill sizes="36px" className="object-cover" />
    </span>
  );
}

/* ---------- Best times ---------- */

function BestTimes() {
  const { t, lang } = useT();
  const ins = useInsights();
  // Rows are Saturday..Friday: tomorrow (16 Oct is a Friday) is Saturday.
  const rows = Array.from({ length: 7 }, (_, i) => weekday(kuwaitAt(i + 1, 12), lang));
  const cols = TIME_SLOTS.map((h) => hourLabel(h, lang));
  return (
    <Section title={t("bestTimes")} action={<span className="text-[13px] text-muted-foreground">{t("kuwaitTime")}</span>}>
      <Card className="mx-4 p-4 lg:mx-0">
        <Heatmap
          matrix={ins.bestTimes}
          rowLabels={rows}
          colLabels={cols}
          title={t("bestTimes")}
          format={(v) => pct(v, lang, 0)}
          lowLabel={t("low")}
          highLabel={t("high")}
        />
      </Card>
    </Section>
  );
}

/* ---------- Content types ---------- */

function ContentTypes() {
  const { t, lang } = useT();
  const ins = useInsights();
  const labels = { reel: t("reel"), carousel: t("carousel"), photo: t("photo") };
  return (
    <Section title={t("contentThatWorks")}>
      <Card className="mx-4 p-4 lg:mx-0">
        <p className="mb-3 text-[12px] text-muted-foreground">{t("avgEngagement")}</p>
        <HBars
          rows={[...ins.contentTypes]
            .sort((a, b) => b.engagement - a.engagement)
            .map((c) => ({
              label: (
                <>
                  {labels[c.type]} <span className="text-muted-foreground">• {num(c.posts, lang)}</span>
                </>
              ),
              value: c.engagement,
              display: pct(c.engagement, lang),
            }))}
        />
        <div className="mt-5 border-t pt-4">
          <p className="mb-3 text-[13px] font-semibold">{t("promotedVsNormal")}</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: t("promoted"), d: ins.promoted },
              { label: t("normal"), d: ins.organic },
            ].map((x, i) => (
              <div key={x.label} className={cn("rounded-xl p-3", i === 0 ? "bg-brand-soft" : "bg-muted")}>
                <p className="text-[12px] font-semibold">{x.label}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{t("avgReach")}</p>
                <p className="text-lg leading-tight font-bold">{compact(x.d.reach, lang)}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">{t("avgEngagement")}</p>
                <p className="text-lg leading-tight font-bold">{pct(x.d.engagement, lang)}</p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </Section>
  );
}

/* ---------- Monitored posts ---------- */

function Monitored() {
  const { t, l, lang } = useT();
  const photos = usePhotos();
  const openSheet = useStore((s) => s.openSheet);
  const published = photos.filter((p) => p.status === "published" && p.metrics);
  // Median reach of normal (not promoted) posts: a fair "usual" for comparison.
  const organic = published.filter((p) => !p.promoted).map((p) => p.metrics!.reach).sort((a, b) => a - b);
  const avgReach = organic[Math.floor(organic.length / 2)] ?? 1;
  const avgEng = published.reduce((s, p) => s + engagementOf(p), 0) / Math.max(1, published.length);
  const byDate = [...published].sort((a, b) => b.publishedAt!.localeCompare(a.publishedAt!));
  const lastWeek = byDate.filter((p) => daysFromNow(p.publishedAt!) >= -6);
  const recent = (lastWeek.length ? lastWeek : byDate).slice(0, 4);
  return (
    <Section title={t("monitoredPosts")} className="lg:col-span-2">
      <p className="-mt-2 mb-3 px-4 text-[13px] text-muted-foreground lg:px-0">{t("monitoredBody")}</p>
      <Card className="mx-4 divide-y lg:mx-0">
        {recent.map((p) => {
          const day = Math.min(7, 1 - daysFromNow(p.publishedAt!));
          // Compare to what an average post had reached by the same day.
          const expected = avgReach * [0.42, 0.64, 0.76, 0.85, 0.92, 0.97, 1][day - 1];
          const soFar = p.metrics!.reachByDay.slice(0, day).reduce((s, v) => s + v, 0) || p.metrics!.reach;
          const ratio = soFar / expected;
          const status = ratio > 1.15 ? "above" : ratio < 0.7 ? "below" : "track";
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => openSheet({ type: "performance", photoId: p.id })}
              className="flex w-full items-center gap-3 p-3 text-start hover:bg-muted/50"
            >
              <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={p.thumb} alt="" fill sizes="48px" className="object-cover" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold">{l(p.dish)}</p>
                <p className="text-[12px] text-muted-foreground">
                  {t("dayN", { n: num(day, lang) })} • {compact(soFar, lang)} {t("reach").toLowerCase()} • {pct(engagementOf(p) || avgEng, lang)}
                </p>
                <div className="mt-1.5 h-1 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-brand" style={{ width: `${(day / 7) * 100}%` }} />
                </div>
              </div>
              <span
                className={cn(
                  "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  status === "above" && "bg-brand-soft text-good",
                  status === "track" && "bg-secondary",
                  status === "below" && "bg-warn/15 text-warn",
                )}
              >
                {status === "above" ? t("aboveAverage") : status === "below" ? t("belowAverage") : t("onTrack")}
              </span>
            </button>
          );
        })}
      </Card>
    </Section>
  );
}

function InsightsSkeleton() {
  return (
    <div aria-busy className="space-y-6 px-4 pt-3 lg:px-0 lg:pt-4">
      <Skel className="h-5 w-40" />
      <div className="grid grid-cols-3 gap-2">
        {[0, 1, 2].map((i) => (
          <Skel key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skel className="h-40 rounded-2xl" />
      <Skel className="h-52 rounded-2xl" />
    </div>
  );
}
