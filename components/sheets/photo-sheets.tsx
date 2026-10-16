"use client";

import { CalendarClock, Check, FolderPlus, Heart, ImageUp, Images, Sparkles } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { BarChart } from "@/components/charts";
import { Btn, Delta } from "@/components/kit";
import { Sheet } from "@/components/sheet";
import { compact, dayKey, num, time, when } from "@/lib/format";
import { useInsights, useT } from "@/lib/hooks";
import { useAlbums, usePhotos, useStore } from "@/lib/store";
import { alternativeTimes, suggestedTime } from "@/lib/suggest";
import { cn } from "@/lib/utils";
import { cameraRoll } from "@/mock/photos";
import type { AccountId } from "@/mock/types";
import { useSheet } from "./use-sheet";

/* ---------- Schedule ---------- */

export function ScheduleSheet() {
  const { open, data, close } = useSheet("schedule");
  const { t, lang } = useT();
  const router = useRouter();
  const photos = usePhotos();
  const insights = useInsights();
  const suggested = data?.suggested ?? suggestedTime(insights);
  const options = [suggested, ...alternativeTimes(insights).filter((x) => x !== suggested)].slice(0, 4);
  const [choice, setChoice] = useState<string>("0");
  const [customDate, setCustomDate] = useState(dayKey(options[0]));
  const [customTime, setCustomTime] = useState("20:30");
  const chosen = data?.photoIds.map((id) => photos.find((p) => p.id === id)).filter((p) => p !== undefined) ?? [];

  const at = choice === "custom" ? new Date(`${customDate}T${customTime}:00+03:00`).toISOString() : options[Number(choice)];

  const confirm = () => {
    if (!data) return;
    useStore.getState().schedulePhotos(data.photoIds, at, data.caption);
    toast.success(t("scheduledToast", { when: when(at, lang) }));
    close();
    setChoice("0");
    if (data.caption) {
      useStore.getState().setDraft({ photoIds: [] });
      router.push("/");
    }
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={t("schedule")}
      footer={
        <Btn size="lg" className="w-full" icon={<CalendarClock />} onClick={confirm}>
          {t("schedule")}
        </Btn>
      }
    >
      <div className="space-y-5 px-4 pt-1 pb-4">
        {chosen.length > 0 && (
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {chosen.map((p) => (
              <span key={p.id} className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                <Image src={p.thumb} alt="" fill sizes="64px" className="object-cover" />
              </span>
            ))}
          </div>
        )}
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-muted-foreground">
            {t("suggested")} • {t("kuwaitTime")}
          </legend>
          <div className="divide-y overflow-hidden rounded-2xl border">
            {options.map((iso, i) => (
              <Radio key={iso} checked={choice === String(i)} onSelect={() => setChoice(String(i))}>
                <span className="flex-1 text-[15px]">{when(iso, lang)}</span>
                {i === 0 && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-semibold text-brand-ink">
                    <Sparkles className="size-3" /> {t("bestTime")}
                  </span>
                )}
              </Radio>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend className="mb-2 text-[13px] font-semibold text-muted-foreground">{t("pickTime")}</legend>
          <div className="overflow-hidden rounded-2xl border">
            <Radio checked={choice === "custom"} onSelect={() => setChoice("custom")}>
              <div className="flex flex-1 gap-2">
                <input
                  type="date"
                  value={customDate}
                  aria-label={t("date")}
                  onChange={(e) => (setCustomDate(e.target.value), setChoice("custom"))}
                  className="h-10 min-w-0 flex-1 rounded-lg bg-muted px-2 text-[14px]"
                />
                <input
                  type="time"
                  value={customTime}
                  aria-label={t("time")}
                  onChange={(e) => (setCustomTime(e.target.value), setChoice("custom"))}
                  className="h-10 w-28 rounded-lg bg-muted px-2 text-[14px]"
                />
              </div>
            </Radio>
          </div>
        </fieldset>
      </div>
    </Sheet>
  );
}

function Radio({ checked, onSelect, children }: { checked: boolean; onSelect: () => void; children: React.ReactNode }) {
  return (
    <div
      role="radio"
      aria-checked={checked}
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === " " || e.key === "Enter") && (e.preventDefault(), onSelect())}
      className="flex min-h-12 cursor-pointer items-center gap-3 px-4 py-2 hover:bg-muted/50"
    >
      <span className={cn("grid size-5 shrink-0 place-items-center rounded-full border-2", checked ? "border-brand bg-brand" : "border-foreground/25")}>
        {checked && <span className="size-2 rounded-full bg-white" />}
      </span>
      {children}
    </div>
  );
}

/* ---------- Add to album ---------- */

export function AlbumSheet() {
  const { open, data, close } = useSheet("album");
  const { t } = useT();
  const albums = useAlbums();
  const photos = usePhotos();
  const [name, setName] = useState("");

  const add = (albumId: string, albumName: string) => {
    if (!data) return;
    useStore.getState().addToAlbum(data.photoIds, albumId);
    toast.success(t("addedToAlbum", { album: albumName }));
    close();
  };

  return (
    <Sheet open={open} onClose={close} title={t("addToAlbum")}>
      <div className="px-4 pb-5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const n = name.trim();
            if (!n) return;
            const id = useStore.getState().createAlbum(n);
            setName("");
            add(id, n);
          }}
          className="mb-4 flex gap-2"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("albumName")}
            aria-label={t("albumName")}
            className="h-11 min-w-0 flex-1 rounded-xl bg-muted px-3 text-[15px] outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Btn type="submit" disabled={!name.trim()} icon={<FolderPlus />}>
            {t("createAlbum")}
          </Btn>
        </form>
        <div className="divide-y overflow-hidden rounded-2xl border">
          <button
            type="button"
            className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-muted/50"
            onClick={() => {
              if (!data) return;
              useStore.getState().toggleFavorite(data.photoIds, true);
              toast.success(t("addedToFavorites"));
              close();
            }}
          >
            <span className="grid size-11 place-items-center rounded-lg bg-muted">
              <Heart className="size-5" />
            </span>
            <span className="flex-1 text-[15px]">{t("favorites")}</span>
          </button>
          {albums.map((a) => {
            const cover = photos.find((p) => p.albums.includes(a.id));
            return (
              <button key={a.id} type="button" onClick={() => add(a.id, a.name)} className="flex w-full items-center gap-3 px-3 py-2.5 text-start hover:bg-muted/50">
                <span className="relative grid size-11 place-items-center overflow-hidden rounded-lg bg-muted">
                  {cover ? <Image src={cover.thumb} alt="" fill sizes="44px" className="object-cover" /> : <Images className="size-5" />}
                </span>
                <span className="flex-1 truncate text-[15px]">{a.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    </Sheet>
  );
}

/* ---------- Upload (mock file picker) ---------- */

export function UploadSheet() {
  const { open, close } = useSheet("upload");
  const { t, l, lang } = useT();
  const accountId = useStore((s) => s.activeAccountId) as AccountId;
  const photos = usePhotos();
  const [selected, setSelected] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const roll = (cameraRoll(accountId) ?? []).filter((r) => !photos.some((p) => p.src === r.src));

  const done = (n: number) => {
    toast.success(n === 1 ? t("uploadedOne") : t("uploaded", { n: num(n, lang) }));
    setSelected([]);
    close();
  };

  const upload = () => {
    const items = roll.filter((r) => selected.includes(r.src));
    useStore.getState().uploadPhotos(items.map(({ src, thumb, dish, credit }) => ({ src, thumb, dish, credit })));
    done(items.length);
  };

  const fromDevice = (files: FileList | null) => {
    if (!files?.length) return;
    // Object URLs stay in this browser tab; nothing leaves the device.
    const items = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => {
        const url = URL.createObjectURL(f);
        const name = f.name.replace(/\.[^.]+$/, "");
        return { src: url, thumb: url, dish: { en: name, ar: name }, credit: { author: "You", link: "" } };
      });
    useStore.getState().uploadPhotos(items);
    done(items.length);
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={t("uploadPhotos")}
      footer={
        <Btn size="lg" className="w-full" icon={<ImageUp />} disabled={selected.length === 0} onClick={upload}>
          {t("upload")}
          {selected.length > 0 && ` (${num(selected.length, lang)})`}
        </Btn>
      }
    >
      <div className="pb-4">
        <p className="px-4 pb-2 text-[13px] font-semibold text-muted-foreground">{t("cameraRoll")}</p>
        {roll.length === 0 ? (
          <p className="px-4 pb-4 text-[14px] text-muted-foreground">{t("allCaughtUp")}</p>
        ) : (
          <div className="grid grid-cols-3 gap-[2px] sm:grid-cols-4">
            {roll.map((r) => {
              const on = selected.includes(r.src);
              return (
                <button
                  key={r.src}
                  type="button"
                  aria-pressed={on}
                  aria-label={l(r.dish)}
                  onClick={() => setSelected((s) => (on ? s.filter((x) => x !== r.src) : [...s, r.src]))}
                  className="relative aspect-square bg-muted"
                >
                  <Image src={r.thumb} alt="" fill sizes="33vw" className={cn("object-cover transition-transform", on && "scale-[0.94] opacity-80")} />
                  <span
                    className={cn(
                      "absolute end-1.5 bottom-1.5 grid size-[22px] place-items-center rounded-full border-[1.5px] border-white shadow",
                      on ? "bg-brand" : "bg-black/20",
                    )}
                  >
                    {on && <Check className="size-3.5 text-white" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className="px-4 pt-4">
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => fromDevice(e.target.files)} />
          <Btn variant="outline" className="w-full" icon={<Images />} onClick={() => fileRef.current?.click()}>
            {t("browseFiles")}
          </Btn>
          <p className="mt-2 text-center text-[12px] text-muted-foreground">{t("browseNote")}</p>
        </div>
      </div>
    </Sheet>
  );
}

/* ---------- Post performance ---------- */

export function PerformanceSheet() {
  const { open, data, close } = useSheet("performance");
  const { t, l, lang } = useT();
  const photos = usePhotos();
  const photo = data ? photos.find((p) => p.id === data.photoId) : undefined;
  const published = photos.filter((p) => p.status === "published" && p.metrics);
  const avgReach = published.reduce((s, p) => s + p.metrics!.reach, 0) / Math.max(1, published.length);
  const m = photo?.metrics;

  return (
    <Sheet open={open} onClose={close} title={t("postPerformance")} tall>
      {photo && m && (
        <div className="space-y-5 px-4 pb-6">
          <div className="flex items-center gap-3">
            <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-muted">
              <Image src={photo.thumb} alt="" fill sizes="64px" className="object-cover" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-[16px] font-semibold">{l(photo.dish)}</p>
              <p className="text-[13px] text-muted-foreground">
                {t("publishedOn", { when: when(photo.publishedAt!, lang) })}
                {photo.postType && ` • ${t(photo.postType)}`}
                {photo.promoted && ` • ${t("promoted")}`}
              </p>
              <div className="mt-1 flex items-center gap-1.5 text-[12px]">
                <Delta value={((m.reach - avgReach) / avgReach) * 100} lang={lang} />
                <span className="text-muted-foreground">{t("performanceVsAvg")}</span>
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {(
              [
                ["likes", m.likes],
                ["comments", m.comments],
                ["reach", m.reach],
                ["saves", m.saves],
                ["shares", m.shares],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="rounded-xl bg-muted p-3">
                <dt className="text-[12px] text-muted-foreground">{t(k)}</dt>
                <dd className="text-[18px] font-bold">{compact(v, lang)}</dd>
              </div>
            ))}
          </dl>
          <div>
            <h3 className="mb-3 text-[13px] font-semibold text-muted-foreground">{t("reachOverTime")}</h3>
            <BarChart
              title={t("reachOverTime")}
              values={m.reachByDay}
              labels={m.reachByDay.map((_, i) => t("dayN", { n: num(i + 1, lang) }))}
              tickLabels={m.reachByDay.map((_, i) => num(i + 1, lang))}
              format={(v) => num(v, lang)}
              height={120}
            />
          </div>
          {photo.caption && (
            <p className="rounded-xl border p-3 text-[13.5px] leading-snug whitespace-pre-line text-muted-foreground" dir="auto">
              {l(photo.caption)}
            </p>
          )}
          <p className="text-[11px] text-muted-foreground">
            {time(photo.publishedAt!, lang)} • {t("kuwaitTime")}
          </p>
        </div>
      )}
    </Sheet>
  );
}
