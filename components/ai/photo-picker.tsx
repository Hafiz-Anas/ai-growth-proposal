"use client";

import { ChevronLeft, Images, Paperclip } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { Btn, EmptyState, IconBtn, Segmented } from "@/components/kit";
import { SMART_ALBUMS } from "@/components/gallery/albums";
import { PhotoTile } from "@/components/gallery/photo-tile";
import { Sheet } from "@/components/sheet";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { useAlbums, usePhotos } from "@/lib/store";
import type { Photo } from "@/mock/types";

/** Gallery picker for the AI chat's "+": Library and Albums, pick one photo or several for a carousel. */
export function PhotoPicker({ open, initial, onClose, onAttach }: { open: boolean; initial: string[]; onClose: () => void; onAttach: (ids: string[]) => void }) {
  const { t, lang } = useT();
  const [selected, setSelected] = useState<string[]>(initial);
  const [tab, setTab] = useState<"library" | "albums">("library");
  const [albumId, setAlbumId] = useState<string | null>(null);
  // Start from what's attached each time the picker opens.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSelected(initial);
      setAlbumId(null);
    }
  }

  const photos = usePhotos();
  const custom = useAlbums();
  const albums = [
    ...SMART_ALBUMS.map((a) => ({ id: a.id, name: t(a.key), icon: a.icon, items: photos.filter(a.filter) })),
    ...custom.map((a) => ({ id: a.id, name: a.name, icon: Images, items: photos.filter((p) => p.albums.includes(a.id)) })),
  ];
  const album = albums.find((a) => a.id === albumId);
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id].slice(-10)));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      tall
      title={album ? album.name : t("attachPhotos")}
      start={
        album ? (
          <IconBtn label={t("back")} onClick={() => setAlbumId(null)} className="size-9 [&_svg]:size-5">
            <ChevronLeft className="rtl:rotate-180" />
          </IconBtn>
        ) : null
      }
      footer={
        <Btn size="lg" className="w-full" icon={<Paperclip />} disabled={selected.length === 0} onClick={() => onAttach(selected)}>
          {selected.length ? t("attachN", { n: num(selected.length, lang) }) : t("attachPhotos")}
        </Btn>
      }
    >
      {!album && (
        <div className="sticky top-0 z-10 bg-elevated px-4 pb-3">
          <Segmented
            label={t("gallery")}
            value={tab}
            onChange={setTab}
            options={[
              { value: "library", label: t("library") },
              { value: "albums", label: t("albums") },
            ]}
          />
        </div>
      )}
      {album ? (
        album.items.length ? (
          <Grid photos={album.items} selected={selected} onToggle={toggle} />
        ) : (
          <EmptyState icon={<Images />} title={t("emptyAlbumTitle")} body={t("emptyAlbumBody")} />
        )
      ) : tab === "library" ? (
        <Grid photos={photos} selected={selected} onToggle={toggle} />
      ) : (
        <div className="grid grid-cols-3 gap-x-3 gap-y-4 px-4 pb-4">
          {albums.map((a) => (
            <button key={a.id} type="button" onClick={() => setAlbumId(a.id)} className="min-w-0 text-start">
              <span className="relative block aspect-square overflow-hidden rounded-xl bg-muted">
                {a.items[0] ? (
                  <Image src={a.items[0].thumb} alt="" fill sizes="160px" className="object-cover" />
                ) : (
                  <span className="grid size-full place-items-center text-muted-foreground">
                    <a.icon className="size-8" strokeWidth={1.5} />
                  </span>
                )}
              </span>
              <span className="mt-1.5 block truncate text-[13px] font-medium">{a.name}</span>
              <span className="block text-[12px] text-muted-foreground">{num(a.items.length, lang)}</span>
            </button>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function Grid({ photos, selected, onToggle }: { photos: Photo[]; selected: string[]; onToggle: (id: string) => void }) {
  return (
    <div className="grid grid-cols-3 gap-[2px] pb-2 sm:grid-cols-4">
      {photos.map((p, i) => (
        <PhotoTile key={p.id} photo={p} selecting selected={selected.includes(p.id)} onOpen={() => {}} onToggle={onToggle} priority={i < 12} />
      ))}
    </div>
  );
}
