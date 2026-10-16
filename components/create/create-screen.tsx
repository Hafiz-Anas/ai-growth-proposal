"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bookmark, CalendarClock, Check, Heart, MapPin, MessageCircle, Plus, RefreshCw, Send, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Avatar, Btn, Card, Chip, Segmented, Skel } from "@/components/kit";
import { PhotoTile } from "@/components/gallery/photo-tile";
import { num, when } from "@/lib/format";
import { useFakeLoading, useInsights, useT } from "@/lib/hooks";
import { useAccount, usePhotos, useStore } from "@/lib/store";
import { suggestedTime } from "@/lib/suggest";
import { cn } from "@/lib/utils";
import type { CaptionTone, L, Lang, Photo } from "@/mock/types";

export function CreateScreen() {
  const draft = useStore((s) => s.draft);
  const photos = usePhotos();
  const loading = useFakeLoading();
  const chosen = draft.photoIds.map((id) => photos.find((p) => p.id === id)).filter((p): p is Photo => !!p);

  if (loading) return <CreateSkeleton />;
  if (chosen.length === 0) return <Picker />;
  return <Composer key={chosen.map((p) => p.id).join()} photos={chosen} />;
}

/* ---------- Step 1: choose photos ---------- */

function Picker() {
  const { t, lang } = useT();
  const photos = usePhotos();
  const setDraft = useStore((s) => s.setDraft);
  const [selected, setSelected] = useState<string[]>([]);
  // Unposted photos first: that's what people usually want to post.
  const ordered = useMemo(() => [...photos.filter((p) => p.status !== "published"), ...photos.filter((p) => p.status === "published")], [photos]);

  return (
    <div>
      <div className="flex items-center gap-3 px-4 pt-1 pb-3 lg:px-0 lg:pt-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[22px] font-bold tracking-tight">{t("newPost")}</h1>
          <p className="text-[13px] text-muted-foreground">{t("choosePhotosBody")}</p>
        </div>
        <Btn disabled={selected.length === 0} onClick={() => setDraft({ photoIds: selected })}>
          {t("next_")}
          {selected.length > 0 && <span className="opacity-80">({num(selected.length, lang)})</span>}
        </Btn>
      </div>
      <div className="grid grid-cols-3 gap-[2px] sm:grid-cols-4 lg:grid-cols-5 lg:gap-1">
        {ordered.map((p, i) => (
          <PhotoTile
            key={p.id}
            photo={p}
            selecting
            selected={selected.includes(p.id)}
            priority={i < 9}
            onOpen={() => {}}
            onToggle={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
          />
        ))}
      </div>
    </div>
  );
}

/* ---------- Step 2: compose ---------- */

const TONES: { tone: CaptionTone; key: "shorter" | "moreFormal" | "friendlier" }[] = [
  { tone: "shorter", key: "shorter" },
  { tone: "formal", key: "moreFormal" },
  { tone: "friendly", key: "friendlier" },
];
const CYCLE: CaptionTone[] = ["base", "friendly", "formal", "shorter"];

function Composer({ photos }: { photos: Photo[] }) {
  const router = useRouter();
  const { t, lang } = useT();
  const account = useAccount();
  const insights = useInsights();
  const draft = useStore((s) => s.draft);
  const openSheet = useStore((s) => s.openSheet);
  const setDraft = useStore((s) => s.setDraft);

  const captionFor = (tone: CaptionTone): L => ({
    en: account.captions[tone].en.replace("{dish}", photos[0].dish.en),
    ar: account.captions[tone].ar.replace("{dish}", photos[0].dish.ar),
  });

  const [captionLang, setCaptionLang] = useState<Lang>(lang);
  const [tone, setTone] = useState<CaptionTone>(draft.caption ? "friendly" : "base");
  const [text, setText] = useState<L>(draft.caption ?? photos[0].caption ?? captionFor("base"));
  const [edited, setEdited] = useState(false);
  const [writing, setWriting] = useState(false);
  const [tags, setTags] = useState<string[]>(account.hashtags.slice(0, 5));
  const [extraTags, setExtraTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const bestTime = draft.time ?? suggestedTime(insights);

  const regenerate = (next: CaptionTone) => {
    setWriting(true);
    window.setTimeout(() => {
      setTone(next);
      setText(captionFor(next));
      setEdited(false);
      setWriting(false);
    }, 650);
  };

  const allTags = [...account.hashtags, ...extraTags];
  const finalCaption: L = {
    en: `${text.en}\n\n${tags.join(" ")}`.trim(),
    ar: `${text.ar}\n\n${tags.join(" ")}`.trim(),
  };
  const ids = photos.map((p) => p.id);

  const finish = () => {
    setDraft({ photoIds: [] });
    router.push("/");
  };

  const addTag = () => {
    const raw = newTag.trim().replace(/\s+/g, "_");
    if (!raw) return;
    const tag = raw.startsWith("#") ? raw : `#${raw}`;
    if (!allTags.includes(tag)) setExtraTags((x) => [...x, tag]);
    if (!tags.includes(tag)) setTags((x) => [...x, tag]);
    setNewTag("");
  };

  return (
    <div className="pb-4">
      <div className="flex items-center gap-3 px-4 pt-1 pb-3 lg:px-0 lg:pt-4">
        <h1 className="flex-1 text-[22px] font-bold tracking-tight">{t("newPost")}</h1>
        <Btn variant="ghost" size="sm" onClick={() => setDraft({ photoIds: [] })}>
          {t("changePhotos")}
        </Btn>
      </div>

      <div className="lg:grid lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* Preview */}
        <div className="lg:sticky lg:top-20">
          <p className="mb-2 hidden text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:block">{t("previewLabel")}</p>
          <PostPreview photos={photos} caption={finalCaption[captionLang]} captionLang={captionLang} />
        </div>

        {/* Editor */}
        <div className="mt-5 space-y-4 px-4 lg:mt-0 lg:px-0">
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-[15px] font-semibold">{t("caption")}</h2>
              <Segmented
                label={t("language")}
                value={captionLang}
                onChange={setCaptionLang}
                options={[
                  { value: "en", label: "EN" },
                  { value: "ar", label: "ع" },
                ]}
                className="w-28"
              />
            </div>
            <div className="relative">
              <textarea
                value={text[captionLang]}
                dir={captionLang === "ar" ? "rtl" : "ltr"}
                lang={captionLang}
                rows={5}
                onChange={(e) => {
                  setText((x) => ({ ...x, [captionLang]: e.target.value }));
                  setEdited(true);
                }}
                placeholder={t("writeCaption")}
                aria-label={t("caption")}
                className={cn(
                  "w-full resize-none rounded-xl bg-muted px-3 py-2.5 text-[15px] leading-relaxed outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  writing && "opacity-0",
                )}
              />
              <AnimatePresence>
                {writing && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 space-y-2 rounded-xl bg-muted p-3" aria-live="polite">
                    <span className="sr-only">{t("thinking")}</span>
                    <Skel className="h-3.5 w-11/12 bg-foreground/10" />
                    <Skel className="h-3.5 w-10/12 bg-foreground/10" />
                    <Skel className="h-3.5 w-8/12 bg-foreground/10" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Sparkles className="size-3.5 text-brand" />
              {edited ? t("edited") : t("aiWritten")}
            </div>
            <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
              <Chip onClick={() => regenerate(CYCLE[(CYCLE.indexOf(tone) + 1) % CYCLE.length])} disabled={writing}>
                <RefreshCw className={cn(writing && "animate-spin")} />
                {t("regenerate")}
              </Chip>
              {TONES.map((x) => (
                <Chip key={x.tone} active={tone === x.tone && !edited} onClick={() => regenerate(x.tone)} disabled={writing}>
                  {t(x.key)}
                </Chip>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="mb-3 text-[15px] font-semibold">{t("hashtags")}</h2>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => {
                const on = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTags((x) => (on ? x.filter((y) => y !== tag) : [...x, tag]))}
                    className={cn(
                      "inline-flex h-8 items-center gap-1 rounded-full border px-3 text-[13px] font-medium transition-colors",
                      on ? "border-transparent bg-brand-soft text-brand-ink" : "text-muted-foreground hover:bg-muted",
                    )}
                  >
                    {on && <Check className="size-3.5" strokeWidth={3} />}
                    <bdi>{tag}</bdi>
                  </button>
                );
              })}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addTag();
                }}
                className="flex h-8 items-center rounded-full border border-dashed ps-3 pe-1"
              >
                <input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder={t("addHashtag")}
                  aria-label={t("addHashtag")}
                  className="w-28 bg-transparent text-[13px] outline-none"
                />
                <button type="submit" aria-label={t("addHashtag")} className="grid size-6 place-items-center rounded-full hover:bg-muted">
                  <Plus className="size-4" />
                </button>
              </form>
            </div>
          </Card>

          <Card className="flex items-start gap-3 p-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-ink">
              <CalendarClock className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Sparkles className="size-3 text-brand" /> {t("bestTime")}
              </p>
              <p className="mt-0.5 text-[17px] font-semibold">{when(bestTime, lang)}</p>
              <p className="mt-0.5 text-[13px] text-muted-foreground">{t("bestTimeWhy", { n: num(insights.postsAnalyzed, lang) })}</p>
              <Btn
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => openSheet({ type: "schedule", photoIds: ids, caption: finalCaption, suggested: bestTime })}
              >
                {t("useThisTime")}
              </Btn>
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <Btn
              size="lg"
              className="col-span-2"
              icon={<Send />}
              onClick={() => {
                useStore.getState().publishPhotos(ids, finalCaption);
                toast.success(t("posted"));
                finish();
              }}
            >
              {t("postNow")}
            </Btn>
            <Btn
              size="lg"
              variant="secondary"
              icon={<CalendarClock />}
              onClick={() => openSheet({ type: "schedule", photoIds: ids, caption: finalCaption, suggested: bestTime })}
            >
              {t("schedule")}
            </Btn>
            <Btn
              size="lg"
              variant="outline"
              onClick={() => {
                useStore.getState().saveDraftPhotos(ids, finalCaption);
                toast.success(t("draftSaved"));
                finish();
              }}
            >
              {t("saveDraft")}
            </Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- Instagram-style preview ---------- */

function PostPreview({ photos, caption, captionLang }: { photos: Photo[]; caption: string; captionLang: Lang }) {
  const { l } = useT();
  const account = useAccount();
  const [index, setIndex] = useState(0);
  const [expanded, setExpanded] = useState(false);

  return (
    <article className="overflow-hidden border-y bg-background lg:rounded-2xl lg:border">
      <header className="flex items-center gap-2.5 px-3 py-2.5">
        <Avatar src={account.avatar} alt={account.handle} size={32} />
        <div className="min-w-0 leading-tight">
          <p className="truncate text-[13px] font-semibold" dir="ltr">
            {account.handle}
          </p>
          <p className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
            <MapPin className="size-3" />
            {l(account.location)}
          </p>
        </div>
      </header>
      <div className="relative">
        <div
          className="no-scrollbar flex aspect-square snap-x snap-mandatory overflow-x-auto bg-muted"
          onScroll={(e) => {
            const el = e.currentTarget;
            setIndex(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
          }}
        >
          {photos.map((p, i) => (
            <div key={p.id} className="relative aspect-square w-full shrink-0 snap-center">
              <Image src={p.src} alt={l(p.dish)} fill sizes="(min-width: 1024px) 420px, 100vw" priority={i === 0} className="object-cover" />
            </div>
          ))}
        </div>
        {photos.length > 1 && (
          <span className="absolute end-3 top-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-medium text-white">
            {index + 1}/{photos.length}
          </span>
        )}
      </div>
      <div className="flex items-center gap-4 px-3 pt-2.5 [&_svg]:size-6">
        <Heart strokeWidth={1.8} />
        <MessageCircle strokeWidth={1.8} className="-scale-x-100" />
        <Send strokeWidth={1.8} />
        {photos.length > 1 && (
          <div className="flex flex-1 justify-center gap-1">
            {photos.map((p, i) => (
              <span key={p.id} className={cn("size-1.5 rounded-full", i === index ? "bg-brand" : "bg-foreground/20")} />
            ))}
          </div>
        )}
        <Bookmark strokeWidth={1.8} className="ms-auto" />
      </div>
      <div className="px-3 pt-2 pb-3 text-[14px] leading-snug" dir={captionLang === "ar" ? "rtl" : "ltr"} lang={captionLang}>
        <p className={cn("whitespace-pre-line", !expanded && "line-clamp-3")}>
          <bdi className="font-semibold">{account.handle}</bdi> <CaptionText text={caption} />
        </p>
        {!expanded && caption.length > 110 && (
          <button type="button" onClick={() => setExpanded(true)} className="text-muted-foreground">
            {captionLang === "ar" ? "المزيد" : "more"}
          </button>
        )}
      </div>
    </article>
  );
}

/** Hashtags in the brand ink color, like links in a real post. */
function CaptionText({ text }: { text: string }): ReactNode {
  return text.split(/(\s+)/).map((part, i) =>
    part.startsWith("#") ? (
      <span key={i} className="text-brand-ink">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

function CreateSkeleton() {
  return (
    <div aria-busy className="space-y-4 px-4 pt-2 lg:px-0 lg:pt-4">
      <Skel className="h-7 w-40" />
      <div className="grid grid-cols-3 gap-[2px]">
        {Array.from({ length: 12 }, (_, i) => (
          <Skel key={i} className="aspect-square rounded-none" />
        ))}
      </div>
    </div>
  );
}
