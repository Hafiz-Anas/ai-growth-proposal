"use client";

import { Check, ChevronDown, LogOut } from "lucide-react";
import { toast } from "sonner";
import { BarChart } from "@/components/charts";
import { ScoreRing } from "@/components/insights/insights-screen";
import { Btn } from "@/components/kit";
import { Sheet } from "@/components/sheet";
import { compact, num, weekday } from "@/lib/format";
import { useInsights, useT } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { NOW } from "@/mock/clock";
import type { L } from "@/mock/types";
import { useSheet } from "./use-sheet";

const PLANS: { id: "starter" | "growth" | "pro"; name: L; price: number; features: L[] }[] = [
  {
    id: "starter",
    name: { en: "Starter", ar: "البداية" },
    price: 12,
    features: [
      { en: "1 Instagram account", ar: "حساب إنستغرام واحد" },
      { en: "AI captions and replies", ar: "وصف وردود بالذكاء الاصطناعي" },
    ],
  },
  {
    id: "growth",
    name: { en: "Growth", ar: "النمو" },
    price: 25,
    features: [
      { en: "3 Instagram accounts", ar: "٣ حسابات إنستغرام" },
      { en: "Insights and weekly report", ar: "الإحصاءات والتقرير الأسبوعي" },
      { en: "3 competitors per account", ar: "٣ منافسين لكل حساب" },
    ],
  },
  {
    id: "pro",
    name: { en: "Pro", ar: "الاحترافية" },
    price: 45,
    features: [
      { en: "10 Instagram accounts", ar: "١٠ حسابات إنستغرام" },
      { en: "5 competitors per account", ar: "٥ منافسين لكل حساب" },
      { en: "Priority support on WhatsApp", ar: "دعم أولوية عبر واتساب" },
    ],
  },
];

export function PlanSheet() {
  const { open, close } = useSheet("plan");
  const { t, l, lang } = useT();
  const planId = useStore((s) => s.planId);
  return (
    <Sheet open={open} onClose={close} title={t("managePlan")}>
      <div className="space-y-3 px-4 pb-5">
        {PLANS.map((p) => {
          const current = p.id === planId;
          return (
            <div key={p.id} className={cn("rounded-2xl border p-4", current && "border-brand ring-1 ring-brand")}>
              <div className="flex items-baseline justify-between gap-2">
                <p className="text-[16px] font-semibold">{l(p.name)}</p>
                <p>
                  <span className="text-[20px] font-bold">
                    {num(p.price, lang)} {lang === "ar" ? "د.ك" : "KD"}
                  </span>{" "}
                  <span className="text-[12px] text-muted-foreground">{t("perMonth")}</span>
                </p>
              </div>
              <ul className="mt-2 space-y-1 text-[13.5px] text-muted-foreground">
                {p.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="size-3.5 text-brand" /> {l(f)}
                  </li>
                ))}
              </ul>
              <Btn
                size="sm"
                variant={current ? "secondary" : "primary"}
                disabled={current}
                className="mt-3 w-full"
                onClick={() => {
                  useStore.getState().setPlan(p.id);
                  toast.success(t("planUpdated"));
                  close();
                }}
              >
                {current ? t("currentPlan") : t("choose")}
              </Btn>
            </div>
          );
        })}
      </div>
    </Sheet>
  );
}

export function HelpSheet() {
  const { open, close } = useSheet("help");
  const { t } = useT();
  const faqs = [
    [t("helpQ1"), t("helpA1")],
    [t("helpQ2"), t("helpA2")],
    [t("helpQ3"), t("helpA3")],
  ];
  return (
    <Sheet
      open={open}
      onClose={close}
      title={t("helpCenter")}
      footer={
        <Btn
          variant="secondary"
          className="w-full"
          onClick={() => {
            toast.success(t("supportOpened"));
            close();
          }}
        >
          {t("contactSupport")}
        </Btn>
      }
    >
      <div className="divide-y px-4 pb-3">
        {faqs.map(([q, a]) => (
          <details key={q} className="group py-3">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium">
              {q}
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-2 text-[14px] leading-snug text-muted-foreground">{a}</p>
          </details>
        ))}
      </div>
    </Sheet>
  );
}

export function ReportSheet() {
  const { open, close } = useSheet("report");
  const { t, l, lang } = useT();
  const ins = useInsights();
  const days = ins.reachByDay.map((_, i) => weekday(new Date(NOW.getTime() - (6 - i) * 86_400_000).toISOString(), lang));
  return (
    <Sheet open={open} onClose={close} title={t("weeklyReport")} tall>
      <div className="space-y-5 px-4 pb-6">
        <div className="flex items-center gap-4">
          <ScoreRing score={ins.weekly.score} label={t("score")} lang={lang} size={76} />
          <div>
            <p className="text-[13px] text-muted-foreground">{l(ins.weekly.range)}</p>
            <p className="text-[20px] font-bold">
              {compact(ins.reach, lang)} <span className="text-[14px] font-medium text-muted-foreground">{t("reach")}</span>
            </p>
          </div>
        </div>
        <ul className="space-y-2.5 text-[14.5px] leading-snug">
          {ins.weekly.bullets.map((b, i) => (
            <li key={i} className="flex gap-2.5">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" aria-hidden />
              {l(b)}
            </li>
          ))}
        </ul>
        <div>
          <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">
            {t("reach")} • {t("last7Days")}
          </h3>
          <BarChart
            title={t("reach")}
            values={ins.reachByDay}
            labels={days}
            tickLabels={days}
            format={(v) => num(v, lang)}
            highlight={ins.reachByDay.indexOf(Math.max(...ins.reachByDay))}
            height={130}
          />
        </div>
      </div>
    </Sheet>
  );
}

export function LogoutSheet() {
  const { open, close } = useSheet("logout");
  const { t } = useT();
  return (
    <Sheet open={open} onClose={close} title={t("logOut")}>
      <div className="px-4 pb-5 text-center">
        <p className="text-[16px] font-semibold">{t("logOutConfirm")}</p>
        <p className="mt-1 text-[14px] text-muted-foreground">{t("logOutBody")}</p>
        <div className="mt-5 grid gap-2">
          <Btn
            size="lg"
            variant="danger"
            icon={<LogOut />}
            onClick={() => {
              useStore.getState().setLoggedOut(true);
              toast.success(t("loggedOut"));
            }}
          >
            {t("logOut")}
          </Btn>
          <Btn size="lg" variant="ghost" onClick={close}>
            {t("cancel")}
          </Btn>
        </div>
      </div>
    </Sheet>
  );
}
