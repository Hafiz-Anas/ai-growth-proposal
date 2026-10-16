"use client";

import { CalendarClock, ChevronLeft, FolderPlus, Heart, ImagePlus, Images, SquarePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Btn, EmptyState, IconBtn, Segmented, Skel } from "@/components/kit";
import { date, daysFromNow, num } from "@/lib/format";
import { useFakeLoading, useT } from "@/lib/hooks";
import { useAlbums, usePhotos, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { Lang, Photo } from "@/mock/types";
import { SMART_ALBUMS } from "./albums";
import { PhotoTile } from "./photo-tile";
import { usePhotoActions } from "./use-photo-actions";

type Tab = "library" | "albums";

export function GalleryScreen() {
  const { t, lang } = useT();
  const photos = usePhotos();
  const customAlbums = useAlbums();
  const loading = useFakeLoading();
  const selecting = useStore((s) => s.selecting);
  const setSelecting = useStore((s) => s.setSelecting);
  const openSheet = useStore((s) => s.openSheet);
  const [tab, setTab] = useState<Tab>("library");
  const [albumId, setAlbumId] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  const album = albumId ? (SMART_ALBUMS.find((a) => a.id === albumId) ?? customAlbums.find((a) => a.id === albumId)) : null;
  const albumName = album ? ("key" in album ? t(album.key) : album.name) : "";
  const visible = useMemo(() => {
    if (!albumId) return photos;
    const smart = SMART_ALBUMS.find((a) => a.id === albumId);
    return smart ? photos.filter(smart.filter) : photos.filter((p) => p.albums.includes(albumId));
  }, [albumId, photos]);

  const exitSelect = useCallback(() => {
    setSelecting(false);
    setSelected([]);
  }, [setSelecting]);
  useEffect(() => () => setSelecting(false), [setSelecting]);

  const toggle = useCallback((id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id])), []);
  const open = useCallback(
    (id: string) => {
      const ids = visible.map((p) => p.id);
      useStore.getState().openViewer(ids, ids.indexOf(id));
    },
    [visible],
  );

  const showGrid = tab === "library" || albumId;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-1 pb-3 lg:px-0 lg:pt-4">
        {albumId ? (
          <>
            <IconBtn label={t("back")} onClick={() => (setAlbumId(null), exitSelect())} className="-ms-2">
              <ChevronLeft className="rtl:rotate-180" />
            </IconBtn>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[22px] leading-tight font-bold tracking-tight">{albumName}</h1>
              <p className="text-xs text-muted-foreground">{t("photosCount", { n: num(visible.length, lang) })}</p>
            </div>
          </>
        ) : (
          <Segmented
            label={t("gallery")}
            value={tab}
            onChange={(v) => (setTab(v), exitSelect())}
            options={[
              { value: "library", label: t("library") },
              { value: "albums", label: t("albums") },
            ]}
            className="w-full max-w-[260px]"
          />
        )}
        {!albumId && <div className="flex-1" />}
        {showGrid && visible.length > 0 && (
          <Btn
            variant={selecting ? "primary" : "secondary"}
            size="sm"
            className="rounded-full"
            onClick={() => (selecting ? exitSelect() : setSelecting(true))}
          >
            {selecting ? t("cancel") : t("select")}
          </Btn>
        )}
        {!selecting && (
          <Btn variant="secondary" size="sm" className="rounded-full" icon={<ImagePlus />} onClick={() => openSheet({ type: "upload" })}>
            <span className="max-sm:sr-only">{t("upload")}</span>
          </Btn>
        )}
      </div>

      {loading ? (
        <GridSkeleton />
      ) : showGrid ? (
        visible.length === 0 ? (
          albumId ? (
            <EmptyState icon={<Images />} title={t("emptyAlbumTitle")} body={t("emptyAlbumBody")} />
          ) : (
            <EmptyState
              icon={<ImagePlus />}
              title={t("emptyLibraryTitle")}
              body={t("emptyLibraryBody")}
              action={<Btn onClick={() => openSheet({ type: "upload" })}>{t("uploadPhotos")}</Btn>}
            />
          )
        ) : albumId ? (
          <Grid photos={visible} selecting={selecting} selected={selected} onOpen={open} onToggle={toggle} />
        ) : (
          <GroupedGrid photos={visible} lang={lang} selecting={selecting} selected={selected} onOpen={open} onToggle={toggle} />
        )
      ) : (
        <AlbumsView photos={photos} onOpen={setAlbumId} />
      )}

      {selecting && <SelectionBar ids={selected} onDone={exitSelect} onSelectAll={() => setSelected(visible.map((p) => p.id))} />}
    </div>
  );
}

/* ---------- Grids ---------- */

type GridProps = { photos: Photo[]; selecting: boolean; selected: string[]; onOpen: (id: string) => void; onToggle: (id: string) => void };

function Grid({ photos, selecting, selected, onOpen, onToggle, offset = 0 }: GridProps & { offset?: number }) {
  return (
    <div className="grid grid-cols-3 gap-[2px] sm:grid-cols-4 lg:grid-cols-5 lg:gap-1">
      {photos.map((p, i) => (
        <PhotoTile key={p.id} photo={p} selecting={selecting} selected={selected.includes(p.id)} onOpen={onOpen} onToggle={onToggle} priority={offset + i < 9} />
      ))}
    </div>
  );
}

function bucket(iso: string, lang: Lang, t: ReturnType<typeof useT>["t"]) {
  const d = daysFromNow(iso);
  if (d >= -6) return t("thisWeek");
  if (d >= -13) return t("lastWeek");
  return date(iso, lang, { month: "long", year: "numeric" });
}

function GroupedGrid({ photos, lang, ...rest }: GridProps & { lang: Lang }) {
  const { t } = useT();
  const groups = useMemo(() => {
    const out: { title: string; photos: Photo[] }[] = [];
    for (const p of photos) {
      const title = bucket(p.takenAt, lang, t);
      const last = out[out.length - 1];
      if (last?.title === title) last.photos.push(p);
      else out.push({ title, photos: [p] });
    }
    return out;
  }, [photos, lang, t]);

  let offset = 0;
  return (
    <div className="space-y-5">
      {groups.map((g) => {
        const start = offset;
        offset += g.photos.length;
        return (
          <section key={g.title} aria-label={g.title}>
            <h2 className="px-4 pb-2 text-[15px] font-semibold lg:px-0">{g.title}</h2>
            <Grid photos={g.photos} offset={start} {...rest} />
          </section>
        );
      })}
    </div>
  );
}

function GridSkeleton() {
  return (
    <div aria-busy className="space-y-5">
      <Skel className="mx-4 h-4 w-24 lg:mx-0" />
      <div className="grid grid-cols-3 gap-[2px] sm:grid-cols-4 lg:grid-cols-5 lg:gap-1">
        {Array.from({ length: 15 }, (_, i) => (
          <Skel key={i} className="aspect-square rounded-none" />
        ))}
      </div>
    </div>
  );
}

/* ---------- Albums ---------- */

function AlbumsView({ photos, onOpen }: { photos: Photo[]; onOpen: (id: string) => void }) {
  const { t, lang } = useT();
  const custom = useAlbums();
  const smart = SMART_ALBUMS.map((a) => ({ id: a.id, name: t(a.key), icon: a.icon, items: photos.filter(a.filter) }));
  const mine = custom.map((a) => ({ id: a.id, name: a.name, icon: Images, items: photos.filter((p) => p.albums.includes(a.id)) }));
  const card = (a: (typeof smart)[number]) => (
    <button key={a.id} type="button" onClick={() => onOpen(a.id)} className="group min-w-0 rounded-xl text-start">
      <span className="relative block aspect-square overflow-hidden rounded-xl bg-muted">
        {a.items[0] ? (
          <Image src={a.items[0].thumb} alt="" fill sizes="(min-width: 1024px) 220px, 45vw" className="object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
        ) : (
          <span className="grid size-full place-items-center text-muted-foreground">
            <a.icon className="size-9" strokeWidth={1.5} />
          </span>
        )}
      </span>
      <span className="mt-1.5 block truncate text-sm font-medium">{a.name}</span>
      <span className="block text-[13px] text-muted-foreground">{num(a.items.length, lang)}</span>
    </button>
  );
  return (
    <div className="space-y-6 px-4 lg:px-0">
      <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">{smart.map(card)}</div>
      {mine.length > 0 && (
        <div>
          <h2 className="mb-3 text-[17px] font-semibold">{t("myAlbums")}</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">{mine.map(card)}</div>
        </div>
      )}
    </div>
  );
}

/* ---------- Select mode toolbar ---------- */

function SelectionBar({ ids, onDone, onSelectAll }: { ids: string[]; onDone: () => void; onSelectAll: () => void }) {
  const { t, lang } = useT();
  const actions = usePhotoActions();
  const photos = usePhotos();
  const none = ids.length === 0;
  const allFavorite = !none && ids.every((id) => photos.find((p) => p.id === id)?.favorite);
  const act = (f: () => void, done = true) => () => {
    f();
    if (done) onDone();
  };
  return (
    <div className="fixed inset-x-0 bottom-[calc(52px+env(safe-area-inset-bottom))] z-30 px-3 pb-2 lg:start-[244px] lg:bottom-5 lg:flex lg:justify-center lg:px-8">
      <div className="flex items-center gap-1 rounded-2xl border bg-elevated/95 p-1.5 shadow-[0_8px_30px_-10px_rgb(0_0_0/0.3)] backdrop-blur-xl lg:w-[560px]">
        <button type="button" onClick={onSelectAll} className="min-w-0 flex-1 truncate rounded-xl px-2 text-start text-[13px] font-semibold">
          {none ? t("selectPhotos") : t("selectedCount", { n: num(ids.length, lang) })}
        </button>
        <BarBtn label={t("createPost")} disabled={none} onClick={act(() => actions.createPost(ids))}>
          <SquarePlus />
        </BarBtn>
        <BarBtn label={t("schedule")} disabled={none} onClick={act(() => actions.schedule(ids))}>
          <CalendarClock />
        </BarBtn>
        <BarBtn label={t("addToAlbum")} disabled={none} onClick={act(() => actions.addToAlbum(ids))}>
          <FolderPlus />
        </BarBtn>
        <BarBtn label={allFavorite ? t("unfavorite") : t("favorite")} disabled={none} onClick={act(() => actions.favorite(ids, !allFavorite))}>
          <Heart className={cn(allFavorite && "fill-current")} />
        </BarBtn>
        <BarBtn label={t("delete")} disabled={none} onClick={act(() => actions.remove(ids))} className="text-destructive">
          <Trash2 />
        </BarBtn>
      </div>
    </div>
  );
}

function BarBtn({ label, children, className, ...props }: { label: string; children: ReactNode; className?: string; disabled?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn("grid size-10 shrink-0 place-items-center rounded-xl hover:bg-muted disabled:opacity-35 [&_svg]:size-[22px]", className)}
      {...props}
    >
      {children}
    </button>
  );
}
