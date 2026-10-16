"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ArrowUp, BarChart3, CalendarClock, Copy, ImageIcon, RotateCcw, Sparkles, SquarePlus, Swords } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BarChart } from "@/components/charts";
import { Btn, Chip, IconBtn } from "@/components/kit";
import { Sheet } from "@/components/sheet";
import { useSheet } from "@/components/sheets/use-sheet";
import { num, when } from "@/lib/format";
import { useInsights, useT } from "@/lib/hooks";
import { useAccount, useChat, useCompetitors, usePhotos, useStore, type ChatMessage } from "@/lib/store";
import { cn } from "@/lib/utils";
import { answer, matchQuestion, suggestions, type AiAnswer, type ChatContext, type ChatMode } from "@/mock/ai-chat";
import { ownComparison } from "@/mock/competitors";
import type { AccountId } from "@/mock/types";

const MODES: { mode: ChatMode; key: "aiModePost" | "aiModeAnalytics" | "aiModeCompetitors"; icon: typeof ImageIcon }[] = [
  { mode: "post", key: "aiModePost", icon: ImageIcon },
  { mode: "analytics", key: "aiModeAnalytics", icon: BarChart3 },
  { mode: "competitors", key: "aiModeCompetitors", icon: Swords },
];

let msgId = 0;

export function AiChatSheet() {
  const { open, close } = useSheet("ai");
  const { t, l } = useT();
  const chat = useChat();
  const mode = useStore((s) => s.chatMode);
  const setMode = useStore((s) => s.setChatMode);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const ctx = useChatContext();

  useEffect(() => {
    // New answers scroll to their start so they read from the top; everything else scrolls to the end.
    const last = chat[chat.length - 1];
    const answerArrived = last?.role === "ai" && !typing;
    const target = answerArrived ? document.getElementById(last.id) : endRef.current;
    target?.scrollIntoView({ behavior: "smooth", block: answerArrived ? "start" : "end" });
  }, [chat, typing]);

  const ask = (question: string, answerId: string) => {
    if (typing) return;
    const { pushChat } = useStore.getState();
    pushChat({ id: `m${msgId++}`, role: "user", text: question, mode });
    setTyping(true);
    window.setTimeout(() => {
      pushChat({ id: `m${msgId++}`, role: "ai", answerId, mode });
      setTyping(false);
    }, 900);
  };

  const submit = () => {
    const q = input.trim();
    if (!q) return;
    setInput("");
    ask(q, matchQuestion(q, mode));
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      desktop="panel"
      tall
      title={
        <span className="inline-flex items-center gap-1.5">
          <Sparkles className="size-4 text-brand" /> {t("askAi")}
        </span>
      }
      end={
        chat.length > 0 ? (
          <IconBtn label={t("clearChat")} onClick={() => useStore.getState().clearChat()} className="size-9 [&_svg]:size-[18px]">
            <RotateCcw />
          </IconBtn>
        ) : null
      }
      bodyClassName="flex flex-col"
      footer={
        <div className="space-y-2.5">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
            {suggestions[mode].map((s) => (
              <Chip key={s.id} onClick={() => ask(l(s.q), s.id)} disabled={typing}>
                {l(s.q)}
              </Chip>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit();
            }}
            className="flex items-center gap-2 rounded-full border bg-background py-1 ps-4 pe-1"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("askPlaceholder")}
              aria-label={t("askPlaceholder")}
              dir="auto"
              className="h-9 min-w-0 flex-1 bg-transparent text-[16px] outline-none"
            />
            <button
              type="submit"
              aria-label={t("send")}
              disabled={!input.trim() || typing}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-brand text-primary-foreground disabled:opacity-40"
            >
              <ArrowUp className="size-5" />
            </button>
          </form>
        </div>
      }
    >
      <div className="sticky top-0 z-10 flex gap-2 bg-elevated px-4 pb-3">
        {MODES.map((m) => (
          <Chip key={m.mode} active={mode === m.mode} onClick={() => setMode(m.mode)}>
            <m.icon />
            {t(m.key)}
          </Chip>
        ))}
      </div>
      <div className="flex-1 space-y-4 px-4 pt-1 pb-4" aria-live="polite">
        <AiBubble>
          <p>{t("aiIntro")}</p>
        </AiBubble>
        {chat.map((m, i) =>
          m.role === "user" ? (
            <div key={m.id} className="flex justify-end">
              <p dir="auto" className="max-w-[80%] rounded-[20px] rounded-ee-md bg-brand px-3.5 py-2 text-[15px] leading-snug text-primary-foreground">
                {m.text}
              </p>
            </div>
          ) : (
            <AiMessage key={m.id} id={m.id} message={m} ctx={ctx} animate={i === chat.length - 1} onClose={close} />
          ),
        )}
        {typing && (
          <AiBubble>
            <span className="flex items-center gap-1 py-1" aria-label={t("thinking")}>
              {[0, 1, 2].map((i) => (
                <motion.span
                  key={i}
                  className="size-1.5 rounded-full bg-muted-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }}
                />
              ))}
            </span>
          </AiBubble>
        )}
        <div ref={endRef} />
      </div>
    </Sheet>
  );
}

function useChatContext(): ChatContext {
  const account = useAccount();
  const photos = usePhotos();
  const insights = useInsights();
  const competitors = useCompetitors();
  return useMemo(
    () => ({ account, photos, insights, competitors, own: ownComparison[account.id as AccountId] ?? ownComparison.mathanet }),
    [account, photos, insights, competitors],
  );
}

function AiBubble({ children, id }: { children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="flex scroll-mt-14 items-start gap-2">
      <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-brand text-primary-foreground">
        <Sparkles className="size-3.5" />
      </span>
      <div className="min-w-0 max-w-[88%] rounded-[20px] rounded-ss-md bg-secondary px-3.5 py-2.5 text-[15px] leading-snug">{children}</div>
    </div>
  );
}

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

function AiMessage({ id, message, ctx, animate, onClose }: { id: string; message: Extract<ChatMessage, { role: "ai" }>; ctx: ChatContext; animate: boolean; onClose: () => void }) {
  const { t, l, lang } = useT();
  const a: AiAnswer = answer(message.answerId, ctx);
  const photo = a.photoId ? ctx.photos.find((p) => p.id === a.photoId) : undefined;
  return (
    <AiBubble id={id}>
      {a.estimate && (
        <span className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-background px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
          <Sparkles className="size-3" /> {t("estimate")}
        </span>
      )}
      <p>
        <Stream text={l(a.text)} animate={animate} />
      </p>
      {a.bullets && (
        <div className="mt-2 space-y-2">
          {a.bullets.map((b, i) => (
            <div key={i} className="rounded-xl bg-background p-2.5 text-[14px] whitespace-pre-line" dir="auto">
              {l(b)}
              {message.answerId === "post-caption" && <CopyButton text={l(b)} />}
            </div>
          ))}
        </div>
      )}
      {photo && !a.post && (
        <button
          type="button"
          onClick={() => useStore.getState().openViewer([photo.id], 0)}
          className="mt-2 flex w-full items-center gap-2.5 rounded-xl bg-background p-2 text-start"
        >
          <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
            <Image src={photo.thumb} alt="" fill sizes="48px" className="object-cover" />
          </span>
          <span className="truncate text-[14px] font-medium">{l(photo.dish)}</span>
        </button>
      )}
      {a.chart && (
        <div className="mt-3 rounded-xl bg-background p-3">
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
      {a.post && <PostProposal post={a.post} ctx={ctx} onClose={onClose} />}
    </AiBubble>
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

function PostProposal({ post, ctx, onClose }: { post: NonNullable<AiAnswer["post"]>; ctx: ChatContext; onClose: () => void }) {
  const { t, l, lang } = useT();
  const router = useRouter();
  const photo = ctx.photos.find((p) => p.id === post.photoId);
  if (!photo) return null;
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border bg-background">
      <p className="flex items-center gap-1 px-3 pt-2.5 pb-2 text-[12px] font-semibold text-brand-ink">
        <Sparkles className="size-3" /> {t("suggestedPost")}
      </p>
      <div className="relative aspect-[16/9] bg-muted">
        <Image src={photo.src} alt={l(photo.dish)} fill sizes="360px" className="object-cover" />
      </div>
      <div className="space-y-2 p-3">
        <p className="line-clamp-3 text-[13.5px] leading-snug" dir="auto">
          {l(post.caption)}
        </p>
        <p className={cn("flex items-center gap-1.5 text-[13px] font-semibold")}>
          <CalendarClock className="size-4 text-brand" /> {when(post.time, lang)}
        </p>
        <div className="grid grid-cols-2 gap-2 pt-1">
          <Btn
            size="sm"
            icon={<SquarePlus />}
            onClick={() => {
              useStore.getState().setDraft({ photoIds: [photo.id], caption: post.caption, time: post.time });
              onClose();
              router.push("/create");
            }}
          >
            {t("createThisPost")}
          </Btn>
          <Btn
            size="sm"
            variant="secondary"
            icon={<CalendarClock />}
            onClick={() => useStore.getState().openSheet({ type: "schedule", photoIds: [photo.id], caption: post.caption, suggested: post.time })}
          >
            {t("scheduleIt")}
          </Btn>
        </div>
      </div>
    </div>
  );
}
