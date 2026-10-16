"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Inbox, MessageCircle, PenLine, RefreshCw, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Btn, EmptyState, IconBtn, InitialsAvatar, Segmented, Skel } from "@/components/kit";
import { ago, num } from "@/lib/format";
import { useFakeLoading, useIsDesktop, useT } from "@/lib/hooks";
import { useEngagement, usePhotos, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { EngagementItem, SentAs } from "@/mock/types";

type Tab = "comments" | "messages" | "sent";

export function EngagementScreen() {
  const { t, lang } = useT();
  const items = useEngagement();
  const loading = useFakeLoading();
  const isDesktop = useIsDesktop();
  const [tab, setTab] = useState<Tab>("comments");
  const [openId, setOpenId] = useState<string | null>(null);

  const comments = items.filter((e) => e.kind === "comment" && !e.sent);
  const messages = items.filter((e) => e.kind === "message" && !e.sent);
  const sent = items.filter((e) => e.sent).sort((a, b) => b.sent!.at.localeCompare(a.sent!.at));
  const list = tab === "comments" ? comments : tab === "messages" ? messages : sent;
  const current = items.find((e) => e.id === openId) ?? null;

  const count = (n: number) => (n > 0 ? ` ${num(n, lang)}` : "");
  const open = (id: string) => {
    setOpenId(id);
    useStore.getState().markEngagementRead(id);
  };

  // On phones, the thread replaces the list (like Instagram DMs).
  if (!isDesktop && current) return <Thread item={current} onBack={() => setOpenId(null)} />;

  const listPane = (
    <div className="min-w-0">
      <div className="px-4 pt-1 pb-3 lg:px-4 lg:pt-4">
        <Segmented
          label={t("engagement")}
          value={tab}
          onChange={(v) => (setTab(v), setOpenId(null))}
          options={[
            { value: "comments", label: `${t("comments")}${count(comments.length)}` },
            { value: "messages", label: `${t("messages")}${count(messages.length)}` },
            { value: "sent", label: t("sent") },
          ]}
        />
      </div>
      {loading ? (
        <ListSkeleton />
      ) : list.length === 0 ? (
        tab === "sent" ? (
          <EmptyState icon={<Send />} title={t("nothingSent")} body={t("nothingSentBody")} />
        ) : (
          <EmptyState icon={<Inbox />} title={t("allCaughtUp")} body={t("allCaughtUpBody")} />
        )
      ) : (
        <ul>
          <AnimatePresence initial={false}>
            {list.map((item) => (
              <motion.li
                key={item.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
              >
                {tab === "sent" ? (
                  <SentRow item={item} active={item.id === openId} onOpen={() => open(item.id)} />
                ) : (
                  <InboxRow item={item} active={item.id === openId} onOpen={() => open(item.id)} />
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );

  if (!isDesktop) return listPane;

  return (
    <div className="mt-4 grid h-[calc(100dvh-56px-128px)] grid-cols-[minmax(0,380px)_minmax(0,1fr)] overflow-hidden rounded-2xl border">
      <div className="overflow-y-auto border-e">{listPane}</div>
      <div className="min-w-0 overflow-y-auto">
        {current ? (
          <Thread item={current} />
        ) : (
          <EmptyState icon={<MessageCircle />} title={t("selectConversation")} body={t("selectConversationBody")} />
        )}
      </div>
    </div>
  );
}

/* ---------- Rows ---------- */

function useReply(item: EngagementItem) {
  const [variant, setVariant] = useState(0);
  const options = [item.aiReply, ...item.alternatives];
  return { text: options[variant % options.length], next: () => setVariant((v) => v + 1) };
}

function send(item: EngagementItem, text: string, as: SentAs, t: ReturnType<typeof useT>["t"]) {
  useStore.getState().sendReply(item.id, text, as);
  toast.success(t("sentToast"));
}

function InboxRow({ item, active, onOpen }: { item: EngagementItem; active: boolean; onOpen: () => void }) {
  const { t, lang } = useT();
  const photos = usePhotos();
  const post = item.photoId ? photos.find((p) => p.id === item.photoId) : undefined;
  const reply = useReply(item);

  return (
    <div className={cn("relative px-4 py-3 transition-colors hover:bg-muted/50", active && "bg-muted")}>
      <button type="button" onClick={onOpen} className="absolute inset-0" aria-label={`${item.customer.name}: ${item.text}`} />
      <div className="pointer-events-none relative flex gap-3">
        <InitialsAvatar name={item.customer.name} tint={item.customer.tint} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-1.5">
            <span className={cn("truncate text-[14px]", item.unread ? "font-bold" : "font-semibold")}><bdi>{item.customer.name}</bdi></span>
            <span className="shrink-0 text-[13px] text-muted-foreground">{ago(item.at, lang)}</span>
            {item.unread && <span className="ms-auto size-2 shrink-0 rounded-full bg-brand" aria-label="unread" />}
          </div>
          <p dir="auto" className={cn("mt-0.5 line-clamp-2 text-[14px] leading-snug", !item.unread && "text-foreground/85")}>
            {item.text}
          </p>
          <div className="mt-2 rounded-2xl rounded-ss-md bg-brand-soft px-3 py-2">
            <p className="mb-0.5 flex items-center gap-1 text-[11px] font-semibold text-brand-ink">
              <Sparkles className="size-3" /> {t("aiReply")}
            </p>
            <p dir="auto" className="line-clamp-3 text-[13.5px] leading-snug">
              {reply.text}
            </p>
          </div>
          <div className="pointer-events-auto mt-2 flex items-center gap-1.5">
            <Btn size="sm" icon={<Send />} onClick={() => send(item, reply.text, "as-is", t)}>
              {t("send")}
            </Btn>
            <Btn size="sm" variant="secondary" icon={<PenLine />} onClick={onOpen}>
              {t("edit")}
            </Btn>
            <IconBtn label={t("regenerate")} onClick={reply.next} className="size-8 [&_svg]:size-4">
              <RefreshCw />
            </IconBtn>
          </div>
        </div>
        {post && (
          <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-muted">
            <Image src={post.thumb} alt="" fill sizes="44px" className="object-cover" />
          </span>
        )}
      </div>
    </div>
  );
}

function SentLabel({ as }: { as: SentAs }) {
  const { t } = useT();
  const label = as === "as-is" ? t("sentAsIs") : as === "edited" ? t("edited") : t("writtenByYou");
  return (
    <span
      className={cn(
        "inline-flex h-5 items-center gap-1 rounded-full px-2 text-[11px] font-semibold",
        as === "as-is" && "bg-brand-soft text-brand-ink",
        as === "edited" && "bg-secondary text-foreground",
        as === "own" && "border text-muted-foreground",
      )}
    >
      {as === "as-is" && <Sparkles className="size-3" />}
      {as === "edited" && <PenLine className="size-3" />}
      {label}
    </span>
  );
}

function SentRow({ item, active, onOpen }: { item: EngagementItem; active: boolean; onOpen: () => void }) {
  const { t, lang } = useT();
  return (
    <button type="button" onClick={onOpen} className={cn("flex w-full gap-3 px-4 py-3 text-start hover:bg-muted/50", active && "bg-muted")}>
      <InitialsAvatar name={item.customer.name} tint={item.customer.tint} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-1.5">
          <span className="truncate text-[14px] font-semibold"><bdi>{item.customer.name}</bdi></span>
          <span className="shrink-0 text-[13px] text-muted-foreground">{ago(item.sent!.at, lang)}</span>
        </div>
        <p dir="auto" className="truncate text-[13px] text-muted-foreground">
          {item.text}
        </p>
        <p dir="auto" className="mt-1.5 line-clamp-2 text-[14px] leading-snug">
          <span className="sr-only">{t("yourReply")}: </span>
          {item.sent!.text}
        </p>
        <div className="mt-1.5">
          <SentLabel as={item.sent!.as} />
        </div>
      </div>
    </button>
  );
}

/* ---------- Thread ---------- */

function Thread({ item, onBack }: { item: EngagementItem; onBack?: () => void }) {
  const { t, lang } = useT();
  const photos = usePhotos();
  const post = item.photoId ? photos.find((p) => p.id === item.photoId) : undefined;
  const options = [item.aiReply, ...item.alternatives];
  const [variant, setVariant] = useState(0);
  const [text, setText] = useState(options[0]);
  const [own, setOwn] = useState(false);
  const [writing, setWriting] = useState(false);

  // Reset the draft when another conversation is opened in the desktop pane.
  const [shownId, setShownId] = useState(item.id);
  if (shownId !== item.id) {
    setShownId(item.id);
    setVariant(0);
    setText(options[0]);
    setOwn(false);
  }

  useEffect(() => {
    if (!writing) return;
    const id = window.setTimeout(() => setWriting(false), 600);
    return () => window.clearTimeout(id);
  }, [writing]);

  const regenerate = () => {
    const next = (variant + 1) % options.length;
    setVariant(next);
    setText(options[next]);
    setOwn(false);
    setWriting(true);
  };

  const as: SentAs = own ? "own" : options.includes(text) ? "as-is" : "edited";

  return (
    <div className="flex min-h-[calc(100dvh-56px-118px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col lg:min-h-full">
      <div className="sticky top-[calc(56px+env(safe-area-inset-top))] z-10 flex items-center gap-2 border-b lg:top-0 bg-background/90 px-2 py-2 backdrop-blur lg:px-4">
        {onBack && (
          <IconBtn label={t("back")} onClick={onBack}>
            <ChevronLeft className="rtl:rotate-180" />
          </IconBtn>
        )}
        <InitialsAvatar name={item.customer.name} tint={item.customer.tint} size={36} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[15px] font-semibold"><bdi>{item.customer.name}</bdi></p>
          <p className="truncate text-xs text-muted-foreground" dir="ltr">
            @{item.customer.handle}
          </p>
        </div>
      </div>

      <div className="flex-1 space-y-3 px-4 py-5">
        {post && (
          <div className="flex items-center gap-2.5 text-[13px] text-muted-foreground">
            <span className="relative size-10 shrink-0 overflow-hidden rounded-md bg-muted">
              <Image src={post.thumb} alt="" fill sizes="40px" className="object-cover" />
            </span>
            {item.customer.name} {t("onYourPost")}
          </div>
        )}
        <div className="flex items-end gap-2">
          <InitialsAvatar name={item.customer.name} tint={item.customer.tint} size={28} />
          <div className="max-w-[80%]">
            <p dir="auto" className="rounded-[20px] rounded-es-md bg-secondary px-3.5 py-2 text-[15px] leading-snug">
              {item.text}
            </p>
            <p className="mt-1 ps-1 text-[11px] text-muted-foreground">{ago(item.at, lang)}</p>
          </div>
        </div>
        {item.sent && (
          <div className="flex flex-col items-end gap-1">
            <p dir="auto" className="max-w-[80%] rounded-[20px] rounded-ee-md bg-brand px-3.5 py-2 text-[15px] leading-snug text-primary-foreground">
              {item.sent.text}
            </p>
            <div className="flex items-center gap-2 pe-1">
              <SentLabel as={item.sent.as} />
              <span className="text-[11px] text-muted-foreground">{ago(item.sent.at, lang)}</span>
            </div>
          </div>
        )}
      </div>

      {!item.sent && (
        <div className="sticky bottom-[calc(108px+env(safe-area-inset-bottom))] border-t bg-background px-4 pt-3 pb-4 lg:bottom-0">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-brand-ink">
            {own ? <PenLine className="size-3.5" /> : <Sparkles className="size-3.5" />}
            {own ? t("writtenByYou") : as === "edited" ? t("edited") : t("aiReply")}
          </div>
          <div className="relative">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              dir="auto"
              rows={4}
              aria-label={t("yourReply")}
              placeholder={t("writeCaption")}
              className={cn(
                "w-full resize-none rounded-2xl border bg-background px-3.5 py-2.5 text-[15px] leading-snug outline-none focus-visible:ring-2 focus-visible:ring-ring",
                writing && "opacity-0",
              )}
            />
            {writing && (
              <div className="absolute inset-0 space-y-2 rounded-2xl border p-3" aria-live="polite">
                <span className="sr-only">{t("thinking")}</span>
                <Skel className="h-3.5 w-11/12" />
                <Skel className="h-3.5 w-9/12" />
              </div>
            )}
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <Btn size="sm" variant="secondary" icon={<RefreshCw />} onClick={regenerate} disabled={writing}>
              {t("regenerate")}
            </Btn>
            <Btn
              size="sm"
              variant="ghost"
              icon={<PenLine />}
              onClick={() => {
                setOwn(true);
                setText("");
              }}
            >
              {t("writeOwn")}
            </Btn>
            <Btn size="sm" className="ms-auto" icon={<Send />} disabled={!text.trim() || writing} onClick={() => send(item, text.trim(), as, t)}>
              {t("send")}
            </Btn>
          </div>
        </div>
      )}
    </div>
  );
}

function ListSkeleton() {
  return (
    <div aria-busy className="space-y-5 px-4 py-2">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="flex gap-3">
          <Skel className="size-11 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skel className="h-3.5 w-32" />
            <Skel className="h-3.5 w-full" />
            <Skel className="h-14 w-full rounded-2xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
