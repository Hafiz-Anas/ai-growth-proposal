"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  FolderPlus,
  Heart,
  MessageCircle,
  PencilLine,
  SquarePlus,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { compact, date, num, time, when } from "@/lib/format";
import { useIsDesktop, useT } from "@/lib/hooks";
import { usePhotos, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { usePhotoActions } from "./use-photo-actions";

/** Full-screen photo viewer, like the Photos app: swipe sideways between photos, swipe down to close. */
export function PhotoViewer() {
  const viewer = useStore((s) => s.viewer);
  const close = useStore((s) => s.closeViewer);
  return (
    // Non-modal so sheets opened from the viewer (Schedule, Add to album…) can sit on top of it.
    <Dialog.Root open={!!viewer} onOpenChange={(open) => !open && close()} modal={false} disablePointerDismissal>
      <AnimatePresence>{viewer && <ViewerContent key="viewer" />}</AnimatePresence>
    </Dialog.Root>
  );
}

function ViewerContent() {
  const { t, l, lang, dir } = useT();
  const isDesktop = useIsDesktop();
  const viewer = useStore((s) => s.viewer)!;
  const close = useStore((s) => s.closeViewer);
  const openSheet = useStore((s) => s.openSheet);
  const photos = usePhotos();
  const actions = usePhotoActions();
  const popupRef = useRef<HTMLDivElement>(null);
  const [direction, setDirection] = useState(0);
  const [chrome, setChrome] = useState(true);

  const items = viewer.ids.map((id) => photos.find((p) => p.id === id)).filter((p) => p !== undefined);
  const index = Math.min(viewer.index, items.length - 1);
  const photo = items[index];

  // If the photo was deleted and nothing is left, close.
  useEffect(() => {
    if (!photo) close();
  }, [photo, close]);

  const go = (step: number) => {
    const next = index + step;
    if (next < 0 || next >= items.length) return;
    setDirection(step);
    useStore.getState().openViewer(items.map((p) => p.id), next);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(dir === "rtl" ? -1 : 1);
      if (e.key === "ArrowLeft") go(dir === "rtl" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!photo) return null;

  const rtl = dir === "rtl" ? -1 : 1;
  const onDragEnd = (_: unknown, info: PanInfo) => {
    const { x, y } = info.offset;
    if (Math.abs(y) > 110 && Math.abs(y) > Math.abs(x)) return close();
    if (x * rtl < -70 || info.velocity.x * rtl < -500) go(1);
    else if (x * rtl > 70 || info.velocity.x * rtl > 500) go(-1);
  };

  const m = photo.metrics;
  const removeCurrent = () => {
    const ids = items.map((p) => p.id).filter((id) => id !== photo.id);
    actions.remove([photo.id]);
    if (ids.length) useStore.getState().openViewer(ids, Math.min(index, ids.length - 1));
    else close();
  };

  return (
    <Dialog.Portal keepMounted>
      <Dialog.Popup
        ref={popupRef}
        initialFocus={popupRef}
        aria-label={l(photo.dish)}
        className="fixed inset-0 z-[60] flex flex-col bg-black text-white outline-none"
        render={<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />}
      >
        {/* Top bar */}
        <div className={cn("relative z-10 pt-safe transition-opacity", !chrome && "pointer-events-none opacity-0")}>
          <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-2">
            <Dialog.Close aria-label={t("close")} className="grid size-10 place-items-center rounded-full hover:bg-white/10">
              <X className="size-6" />
            </Dialog.Close>
            <div className="min-w-0 flex-1 text-center">
              <Dialog.Title className="truncate text-[15px] font-semibold">{l(photo.dish)}</Dialog.Title>
              <p className="text-xs text-white/60">
                {date(photo.takenAt, lang, { day: "numeric", month: "long" })} • {time(photo.takenAt, lang)}
              </p>
            </div>
            <span className="w-10 text-center text-xs text-white/60 tabular-nums">
              {num(index + 1, lang)}/{num(items.length, lang)}
            </span>
          </div>
        </div>

        {/* Photo */}
        <div className="relative min-h-0 flex-1 overflow-hidden" onClick={() => setChrome((c) => !c)}>
          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={photo.id}
              custom={direction}
              variants={{
                enter: (d: number) => ({ x: `${d * rtl * 100}%`, opacity: 0.4 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: `${-d * rtl * 100}%`, opacity: 0.4 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "spring", damping: 34, stiffness: 320 }}
              drag
              dragDirectionLock
              dragSnapToOrigin
              dragElastic={0.6}
              onDragEnd={onDragEnd}
              className="absolute inset-0 touch-none"
            >
              <Image src={photo.src} alt={l(photo.dish)} fill sizes="100vw" priority className="pointer-events-none object-contain select-none" draggable={false} />
            </motion.div>
          </AnimatePresence>
          {isDesktop && (
            <>
              <NavArrow side="start" label={t("previous")} disabled={index === 0} onClick={() => go(-1)} />
              <NavArrow side="end" label={t("next")} disabled={index === items.length - 1} onClick={() => go(1)} />
            </>
          )}
        </div>

        {/* Details + actions */}
        <div className={cn("relative z-10 pb-safe transition-opacity", !chrome && "pointer-events-none opacity-0")}>
          <div className="mx-auto max-w-xl px-4 pt-3">
            {photo.status === "published" && m && (
              <div className="flex items-center gap-4 text-sm">
                <Stat icon={<Heart className="size-4" />} label={t("likes")} value={compact(m.likes, lang)} />
                <Stat icon={<MessageCircle className="size-4" />} label={t("comments")} value={compact(m.comments, lang)} />
                <Stat icon={<TrendingUp className="size-4" />} label={t("reach")} value={compact(m.reach, lang)} />
                <button
                  type="button"
                  onClick={() => openSheet({ type: "performance", photoId: photo.id })}
                  className="ms-auto rounded-full px-1 font-semibold text-[#7fd3a0] hover:underline"
                >
                  {t("viewPerformance")}
                </button>
              </div>
            )}
            {photo.status === "scheduled" && photo.scheduledFor && (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[13px]">
                <CalendarClock className="size-4" /> {t("scheduledFor", { when: when(photo.scheduledFor, lang) })}
              </p>
            )}
            {photo.status === "draft" && (
              <p className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[13px]">
                <PencilLine className="size-4" /> {t("draft")}
              </p>
            )}
          </div>
          <div className="mx-auto mt-2 grid max-w-xl grid-cols-5 px-2 pb-2">
            <Action icon={<SquarePlus />} label={t("createPost")} onClick={() => actions.createPost([photo.id])} />
            <Action icon={<CalendarClock />} label={t("schedule")} onClick={() => actions.schedule([photo.id])} />
            <Action icon={<FolderPlus />} label={t("addToAlbum")} onClick={() => actions.addToAlbum([photo.id])} />
            <Action
              icon={<Heart className={cn(photo.favorite && "fill-white")} />}
              label={photo.favorite ? t("unfavorite") : t("favorite")}
              pressed={photo.favorite}
              onClick={() => actions.favorite([photo.id], !photo.favorite)}
            />
            <Action icon={<Trash2 />} label={t("delete")} onClick={removeCurrent} />
          </div>
        </div>
      </Dialog.Popup>
    </Dialog.Portal>
  );
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <span className="flex items-center gap-1 font-semibold" title={label}>
      {icon}
      <span className="sr-only">{label}</span>
      {value}
    </span>
  );
}

function Action({ icon, label, onClick, pressed }: { icon: ReactNode; label: string; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className="flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] text-white/85 hover:bg-white/10 active:scale-95 [&_svg]:size-6"
    >
      {icon}
      <span className="max-w-full truncate px-0.5">{label}</span>
    </button>
  );
}

function NavArrow({ side, label, disabled, onClick }: { side: "start" | "end"; label: string; disabled: boolean; onClick: () => void }) {
  const Icon = side === "start" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25 disabled:opacity-0",
        side === "start" ? "start-4" : "end-4",
      )}
    >
      <Icon className="size-6 rtl:rotate-180" />
    </button>
  );
}
