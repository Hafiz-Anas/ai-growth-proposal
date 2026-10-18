"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, CalendarClock, Check, ChevronDown, CircleCheck, Copy, LoaderCircle, PencilLine, RefreshCw, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { BarChart } from "@/components/charts";
import { Avatar, Btn, Chip, Segmented, Skel } from "@/components/kit";
import { compact, num, when } from "@/lib/format";
import { useT } from "@/lib/hooks";
import type { MessageKey } from "@/lib/i18n";
import { useAccount, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { answer, type ChatContext } from "@/mock/ai-chat";
import { DIRECTION_LABEL, fullCaption, inspirationSources, productsFor, retone, type AiMsg, type PostDraft, type Step } from "@/mock/ai-studio";
import type { CaptionTone, Lang } from "@/mock/types";
import type { AiEngine } from "./engine";

type AiOf<K> = Extract<AiMsg, { role: "ai"; kind: K }>;

/* ---------- Layout ---------- */

export function AiRow({ children, id }: { children: ReactNode; id?: string }) {
  return (
    <div id={id} className="flex scroll-mt-4 items-start gap-2.5">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand text-primary-foreground">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 flex-1 space-y-2.5 pt-1 text-[15px] leading-relaxed">{children}</div>
    </div>
  );
}

export function UserMessage({ msg }: { msg: Extract<AiMsg, { role: "user" }> }) {
  const { l } = useT();
  const photos = useStore((s) => s.photos[s.activeAccountId]);
  const attached = (msg.photoIds ?? []).map((id) => photos.find((p) => p.id === id)).filter((p) => p !== undefined);
  return (
    <div className="flex flex-col items-end gap-1.5">
      {(attached.length > 0 || msg.refThumb) && (
        <div className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
          {attached.slice(0, 4).map((p) => (
            <span key={p.id} className="relative size-20 overflow-hidden rounded-2xl bg-muted sm:size-24">
              <Image src={p.thumb} alt={l(p.dish)} fill sizes="96px" className="object-cover" />
            </span>
          ))}
          {attached.length > 4 && <span className="grid size-20 place-items-center rounded-2xl bg-muted text-sm font-semibold sm:size-24">+{attached.length - 4}</span>}
          {msg.refThumb && (
            <span className="relative size-20 overflow-hidden rounded-2xl bg-muted sm:size-24">
              <Image src={msg.refThumb} alt="" fill sizes="96px" className="object-cover" />
            </span>
          )}
        </div>
      )}
      <p dir="auto" className="max-w-[85%] rounded-[20px] bg-secondary px-3.5 py-2 text-[15px] leading-snug whitespace-pre-line">
        {l(msg.text)}
      </p>
    </div>
  );
}

export function TypingDots() {
  const { t } = useT();
  return (
    <AiRow>
      <span className="flex h-6 items-center gap-1" role="status" aria-label={t("thinking")}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </span>
    </AiRow>
  );
}

/* ---------- Progress steps ---------- */

const STEP_MS = 750;
const STEP_KEY: Record<Step["key"], MessageKey> = {
  look: "stepLook",
  style: "stepStyle",
  product: "stepProduct",
  caption: "stepCaption",
  hashtags: "stepHashtags",
  time: "stepTime",
  directions: "stepDirections",
};

/** Runs the visible "working" steps, then marks the message ready so its result shows. */
function useSteps(msgId: string, steps: Step[], ready: boolean) {
  const [done, setDone] = useState(ready ? steps.length : 0);
  useEffect(() => {
    if (ready) return;
    const timer = window.setTimeout(() => {
      if (done < steps.length) setDone(done + 1);
      else useStore.getState().updateAiMsg(msgId, { ready: true });
    }, done < steps.length ? STEP_MS : 250);
    return () => window.clearTimeout(timer);
  }, [done, ready, steps.length, msgId]);
  return ready ? steps.length : done;
}

function Steps({ steps, done, ready }: { steps: Step[]; done: number; ready: boolean }) {
  const { t, l, lang } = useT();
  const [open, setOpen] = useState(false);
  const label = (s: Step) => t(STEP_KEY[s.key], { v: l(s.v) });
  const list = (
    <ol className="space-y-1.5" aria-live="polite">
      {steps.map((s, i) => {
        const state = i < done ? "done" : i === done && !ready ? "active" : "todo";
        return (
          <li key={s.key} className={cn("flex items-center gap-2 text-[13.5px]", state === "todo" && "text-muted-foreground/60", state === "done" && "text-muted-foreground")}>
            {state === "done" ? (
              <CircleCheck className="size-4 shrink-0 text-brand" />
            ) : state === "active" ? (
              <LoaderCircle className="size-4 shrink-0 animate-spin text-brand" />
            ) : (
              <span className="mx-[3px] size-2.5 shrink-0 rounded-full border-2 border-current" />
            )}
            <span dir="auto">{label(s)}</span>
          </li>
        );
      })}
    </ol>
  );
  if (!ready) return <div className="rounded-2xl border bg-card px-3.5 py-3">{list}</div>;
  return (
    <div>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="inline-flex items-center gap-1.5 rounded-full text-[12.5px] font-medium text-muted-foreground hover:text-foreground">
        <CircleCheck className="size-3.5 text-brand" />
        {t("stepsDone", { n: num(steps.length, lang) })}
        <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && <div className="mt-2 ps-1">{list}</div>}
    </div>
  );
}

/* ---------- Post message ---------- */

export function PostMessage({ msg, ctx }: { msg: AiOf<"post">; ctx: ChatContext }) {
  const { l } = useT();
  const done = useSteps(msg.id, msg.steps, msg.ready);
  return (
    <AiRow id={msg.id}>
      {msg.text && msg.ready && <p className="whitespace-pre-line" dir="auto">{l(msg.text)}</p>}
      <Steps steps={msg.steps} done={done} ready={msg.ready} />
      <AnimatePresence initial={false}>
        {msg.ready && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <PostCard msgId={msg.id} post={msg.post} ctx={ctx} />
          </motion.div>
        )}
      </AnimatePresence>
    </AiRow>
  );
}

const TONES: { tone: CaptionTone; key: MessageKey }[] = [
  { tone: "shorter", key: "shorter" },
  { tone: "formal", key: "moreFormal" },
  { tone: "friendly", key: "friendlier" },
];

function PostCard({ msgId, post, ctx }: { msgId: string; post: PostDraft; ctx: ChatContext }) {
  const { t, l, lang } = useT();
  const account = useAccount();
  const [captionLang, setCaptionLang] = useState<Lang>(lang);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  const [toneMenu, setToneMenu] = useState(false);
  const [writing, setWriting] = useState(false);
  const photos = post.photoIds.map((id) => ctx.photos.find((p) => p.id === id)).filter((p) => p !== undefined);
  const update = (patch: Partial<PostDraft>) => useStore.getState().updateAiMsg(msgId, { post: { ...post, ...patch } });
  const s = useStore.getState;

  const regenerate = (tone: CaptionTone) => {
    setToneMenu(false);
    setWriting(true);
    window.setTimeout(() => {
      useStore.getState().updateAiMsg(msgId, { post: retone(ctx, post, tone) });
      setWriting(false);
    }, 800);
  };

  const approve = () => {
    s().schedulePhotos(post.photoIds, post.time, fullCaption(post));
    update({ status: "scheduled" });
    toast.success(t("scheduledMoved", { when: when(post.time, lang) }));
  };
  const postNow = () => {
    s().publishPhotos(post.photoIds, fullCaption(post));
    update({ status: "posted" });
    toast.success(t("posted"));
  };
  const saveDraft = () => {
    s().saveDraftPhotos(post.photoIds, fullCaption(post));
    update({ status: "draft" });
    toast.success(t("draftSaved"));
  };

  const badge = post.inspiredBy ? (
    t("inspiredBy", { handle: post.inspiredBy })
  ) : post.direction ? (
    l(DIRECTION_LABEL[post.direction])
  ) : (
    t("suggestedPost")
  );

  return (
    <article className="w-full max-w-[420px] overflow-hidden rounded-2xl border bg-card shadow-[0_2px_12px_-6px_rgb(0_0_0/0.15)]">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar src={account.avatar} alt={account.handle} size={30} />
        <p className="min-w-0 flex-1 truncate text-[13px] font-semibold" dir="ltr">
          {account.handle}
        </p>
        <span className="inline-flex max-w-[60%] items-center gap-1 truncate rounded-full bg-brand-soft px-2 py-0.5 text-[11.5px] font-semibold text-brand-ink">
          <Sparkles className="size-3 shrink-0" />
          <span className="truncate">{badge}</span>
        </span>
      </header>

      <Photos photos={photos.map((p) => ({ id: p.id, src: p.src, alt: l(p.dish) }))} />

      <div className="space-y-3 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[12px] font-semibold text-muted-foreground">{t("caption")}</p>
          <Segmented
            label={t("language")}
            value={captionLang}
            onChange={(v) => (setCaptionLang(v), setEditing(false))}
            options={[
              { value: "en", label: "EN" },
              { value: "ar", label: "ع" },
            ]}
            className="w-24 [&_button]:h-7"
          />
        </div>

        {editing ? (
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            dir={captionLang === "ar" ? "rtl" : "ltr"}
            lang={captionLang}
            rows={5}
            aria-label={t("caption")}
            className="w-full resize-none rounded-xl bg-muted px-3 py-2.5 text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring"
            autoFocus
          />
        ) : writing ? (
          <div aria-busy className="space-y-2 py-1">
            <span className="sr-only">{t("thinking")}</span>
            <Skel className="h-3.5 w-11/12" />
            <Skel className="h-3.5 w-10/12" />
            <Skel className="h-3.5 w-7/12" />
          </div>
        ) : (
          <p className="text-[14.5px] leading-relaxed whitespace-pre-line" dir={captionLang === "ar" ? "rtl" : "ltr"} lang={captionLang}>
            {post.caption[captionLang]}
          </p>
        )}

        <div className="flex flex-wrap gap-1.5" aria-label={t("hashtags")}>
          {post.hashtags.map((tag) => (
            <bdi key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[12.5px] font-medium text-brand-ink">
              {tag}
            </bdi>
          ))}
        </div>

        <p className="flex items-center gap-1.5 text-[13px]">
          <CalendarClock className="size-4 shrink-0 text-brand" />
          <span className="font-semibold">{when(post.time, lang)}</span>
          <span className="text-muted-foreground">· {t("bestTime")}</span>
        </p>

        {post.inspiredBy && <p className="text-[12px] text-muted-foreground">{t("notCopied")}</p>}
        {post.edited && !editing && (
          <p className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <PencilLine className="size-3" /> {t("edited")}
          </p>
        )}

        {post.status !== "new" ? (
          <p className="flex items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-[13.5px] font-semibold text-brand-ink" role="status">
            <Check className="size-4 shrink-0" strokeWidth={3} />
            {post.status === "scheduled" ? t("scheduledFor", { when: when(post.time, lang) }) : post.status === "posted" ? t("postedStatus") : t("draftStatus")}
          </p>
        ) : editing ? (
          <div className="grid grid-cols-2 gap-2">
            <Btn variant="secondary" onClick={() => setEditing(false)}>
              {t("cancel")}
            </Btn>
            <Btn
              onClick={() => {
                update({ caption: { ...post.caption, [captionLang]: text }, edited: true });
                setEditing(false);
              }}
            >
              {t("save")}
            </Btn>
          </div>
        ) : (
          <div className="space-y-2">
            <Btn className="w-full" icon={<CalendarClock />} onClick={approve} disabled={writing}>
              {t("approveSchedule")}
            </Btn>
            <div className="grid grid-cols-4 gap-1">
              <CardAction icon={<Send />} label={t("postNow")} onClick={postNow} disabled={writing} />
              <CardAction
                icon={<PencilLine />}
                label={t("edit")}
                onClick={() => {
                  setText(post.caption[captionLang]);
                  setToneMenu(false);
                  setEditing(true);
                }}
                disabled={writing}
              />
              <CardAction icon={<RefreshCw className={cn(writing && "animate-spin")} />} label={t("regenerate")} onClick={() => setToneMenu((o) => !o)} pressed={toneMenu} disabled={writing} />
              <CardAction icon={<Bookmark />} label={t("saveDraft")} onClick={saveDraft} disabled={writing} />
            </div>
            {toneMenu && (
              <div className="flex flex-wrap gap-2 pt-1">
                {TONES.map((x) => (
                  <Chip key={x.tone} active={post.tone === x.tone && !post.edited} onClick={() => regenerate(x.tone)}>
                    {t(x.key)}
                  </Chip>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function CardAction({ icon, label, onClick, pressed, disabled }: { icon: ReactNode; label: string; onClick: () => void; pressed?: boolean; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      disabled={disabled}
      className={cn(
        "flex min-w-0 flex-col items-center gap-1 rounded-xl px-0.5 py-2 text-[11.5px] leading-tight font-medium hover:bg-muted disabled:opacity-40 [&_svg]:size-5",
        pressed && "bg-muted",
      )}
    >
      {icon}
      <span className="w-full truncate text-center">{label}</span>
    </button>
  );
}

function Photos({ photos }: { photos: { id: string; src: string; alt: string }[] }) {
  const [index, setIndex] = useState(0);
  return (
    <div className="relative">
      <div
        className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto bg-muted"
        onScroll={(e) => setIndex(Math.round(Math.abs(e.currentTarget.scrollLeft) / e.currentTarget.clientWidth))}
      >
        {photos.map((p) => (
          <div key={p.id} className="relative aspect-square w-full shrink-0 snap-center">
            <Image src={p.src} alt={p.alt} fill sizes="420px" className="object-cover" />
          </div>
        ))}
      </div>
      {photos.length > 1 && (
        <span className="absolute end-2.5 top-2.5 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white" dir="ltr">
          {index + 1}/{photos.length}
        </span>
      )}
    </div>
  );
}

/* ---------- Directions ---------- */

export function DirectionsMessage({ msg, ctx, engine }: { msg: AiOf<"directions">; ctx: ChatContext; engine: AiEngine }) {
  const { t, l } = useT();
  const done = useSteps(msg.id, msg.steps, msg.ready);
  return (
    <AiRow id={msg.id}>
      {msg.text && msg.ready && <p className="whitespace-pre-line" dir="auto">{l(msg.text)}</p>}
      <Steps steps={msg.steps} done={done} ready={msg.ready} />
      {msg.ready && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="-mx-2 flex snap-x snap-mandatory gap-3 overflow-x-auto px-2 pb-2 max-lg:no-scrollbar"
          role="list"
        >
          {msg.options.map((o, i) => {
            const photo = ctx.photos.find((p) => p.id === o.photoIds[0]);
            const chosen = msg.chosen === i;
            const other = msg.chosen !== undefined && !chosen;
            return (
              <div
                key={i}
                role="listitem"
                className={cn(
                  "flex w-[74%] max-w-[250px] shrink-0 snap-start flex-col overflow-hidden rounded-2xl border bg-card transition-opacity sm:w-[230px]",
                  chosen && "border-brand ring-2 ring-brand",
                  other && "opacity-45",
                )}
              >
                <div className="relative aspect-square bg-muted">
                  {photo && <Image src={photo.thumb} alt={l(photo.dish)} fill sizes="250px" className="object-cover" />}
                  <span className="absolute start-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11.5px] font-semibold text-white backdrop-blur">
                    {l(DIRECTION_LABEL[o.direction ?? "warm"])}
                  </span>
                </div>
                <p className="line-clamp-4 flex-1 px-3 pt-2.5 text-[13.5px] leading-snug whitespace-pre-line" dir="auto">
                  {l(o.caption)}
                </p>
                <div className="p-3">
                  <Btn
                    size="sm"
                    variant={chosen ? "primary" : "secondary"}
                    className="w-full"
                    disabled={msg.chosen !== undefined || engine.typing}
                    onClick={() => engine.chooseDirection(msg.id, i)}
                    icon={chosen ? <Check /> : undefined}
                  >
                    {chosen ? t("chosen") : t("useThis")}
                  </Btn>
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </AiRow>
  );
}

/* ---------- Pickers ---------- */

export function InspirationMessage({ msg, ctx, engine }: { msg: AiOf<"pickInspiration">; ctx: ChatContext; engine: AiEngine }) {
  const { t, lang } = useT();
  const sources = inspirationSources(ctx);
  const [tab, setTab] = useState<"own" | "competitors">(msg.chosen?.startsWith("comp:") ? "competitors" : "own");
  const list = sources[tab];
  return (
    <AiRow id={msg.id}>
      <p>{t("pickInspo")}</p>
      <Segmented
        label={t("promptLikeThis")}
        value={tab}
        onChange={setTab}
        options={[
          { value: "own", label: t("yourTopPosts") },
          { value: "competitors", label: t("competitors") },
        ]}
        className="max-w-xs"
      />
      <div className="-mx-2 flex gap-2 overflow-x-auto px-2 pb-1 max-lg:no-scrollbar">
        {list.map((s) => {
          const chosen = msg.chosen === s.id;
          return (
            <button
              key={s.id}
              type="button"
              disabled={!!msg.chosen || engine.typing}
              onClick={() => engine.pickInspiration(msg.id, s.id)}
              aria-pressed={chosen}
              aria-label={`@${s.handle}`}
              className={cn(
                "relative size-28 shrink-0 overflow-hidden rounded-xl bg-muted text-start transition-[opacity,transform] enabled:active:scale-95 sm:size-32",
                chosen && "ring-[3px] ring-brand ring-offset-2 ring-offset-background",
                msg.chosen && !chosen && "opacity-40",
              )}
            >
              <Image src={s.thumb} alt="" fill sizes="128px" className="object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-2 pt-5 pb-1.5 text-[11px] leading-tight font-semibold text-white">
                <span className="block truncate" dir="ltr">
                  @{s.handle}
                </span>
                <span className="block font-normal opacity-85">
                  {s.own ? `${compact(s.stat, lang)} ${t("reach").toLowerCase()}` : `${compact(s.stat, lang)} ${t("followers").toLowerCase()}`}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </AiRow>
  );
}

export function ProductMessage({ msg, ctx, engine }: { msg: AiOf<"pickProduct">; ctx: ChatContext; engine: AiEngine }) {
  const { t, l } = useT();
  return (
    <AiRow id={msg.id}>
      <p>{t("pickProduct")}</p>
      <div className="flex flex-wrap gap-2">
        {productsFor(ctx.account.id).map((p) => (
          <Chip
            key={p.id}
            active={msg.chosen === p.id}
            disabled={!!msg.chosen || engine.typing}
            onClick={() => engine.pickProduct(msg.id, p.id)}
            className={cn("h-auto min-h-9 py-1.5", msg.chosen && msg.chosen !== p.id && "opacity-45")}
          >
            <span className="font-semibold">{l(p.name)}</span>
            <span className={cn("text-[12px]", msg.chosen === p.id ? "opacity-80" : "text-muted-foreground")}>{l(p.price)}</span>
          </Chip>
        ))}
      </div>
    </AiRow>
  );
}

/* ---------- Canned answers (analytics, competitors, hashtags…) ---------- */

/** Reveals text word by word, like a streamed answer. Instant with reduced motion. */
function Stream({ text, animate }: { text: string; animate: boolean }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  const [count, setCount] = useState(animate && !reduce ? 0 : words.length);
  useEffect(() => {
    if (count >= words.length) return;
    const id = window.setTimeout(() => setCount((c) => c + 2), 28);
    return () => window.clearTimeout(id);
  }, [count, words.length]);
  return <>{words.slice(0, count).join(" ")}</>;
}

export function AnswerMessage({ msg, ctx, animate }: { msg: AiOf<"answer">; ctx: ChatContext; animate: boolean }) {
  const { t, l, lang } = useT();
  const a = answer(msg.answerId, ctx);
  const photo = a.photoId ? ctx.photos.find((p) => p.id === a.photoId) : undefined;
  return (
    <AiRow id={msg.id}>
      {a.estimate && (
        <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
          <Sparkles className="size-3" /> {t("estimate")}
        </span>
      )}
      <p>
        <Stream text={l(a.text)} animate={animate} />
      </p>
      {a.bullets && (
        <div className="space-y-2">
          {a.bullets.map((b, i) => (
            <div key={i} className="rounded-xl border bg-card p-3 text-[14px] whitespace-pre-line" dir="auto">
              {l(b)}
              {msg.answerId === "post-caption" && <CopyButton text={l(b)} />}
            </div>
          ))}
        </div>
      )}
      {photo && (
        <button
          type="button"
          onClick={() => useStore.getState().openViewer([photo.id], 0)}
          className="flex w-full max-w-sm items-center gap-2.5 rounded-xl border bg-card p-2 text-start hover:bg-muted/60"
        >
          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={photo.thumb} alt="" fill sizes="48px" className="object-cover" />
          </span>
          <span className="truncate text-[14px] font-medium">{l(photo.dish)}</span>
        </button>
      )}
      {a.chart && (
        <div className="max-w-md rounded-xl border bg-card p-3">
          <BarChart
            title={t("reach")}
            values={a.chart.values}
            labels={a.chart.labels.map((x) => l(x))}
            tickLabels={a.chart.labels.map((x) => l(x))}
            highlight={a.chart.highlight}
            format={(v) => num(v, lang)}
            height={96}
          />
        </div>
      )}
    </AiRow>
  );
}

function CopyButton({ text }: { text: string }) {
  const { t } = useT();
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
        } catch {
          /* clipboard may be blocked */
        }
        toast.success(t("copied"));
      }}
      className="mt-2 flex items-center gap-1 text-[12px] font-semibold text-brand-ink"
    >
      <Copy className="size-3.5" /> {t("copy")}
    </button>
  );
}

export function TextMessage({ msg }: { msg: AiOf<"text"> }) {
  const { l } = useT();
  return (
    <AiRow id={msg.id}>
      <p className="whitespace-pre-line" dir="auto">
        {l(msg.text)}
      </p>
    </AiRow>
  );
}
