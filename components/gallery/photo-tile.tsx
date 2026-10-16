"use client";

import { CalendarClock, Check, CircleCheck, Heart, PencilLine, Sparkles } from "lucide-react";
import Image from "next/image";
import { memo } from "react";
import { useT } from "@/lib/hooks";
import { cn } from "@/lib/utils";
import type { Photo } from "@/mock/types";

export const StatusBadge = memo(function StatusBadge({ photo, className }: { photo: Photo; className?: string }) {
  const { t } = useT();
  const badge =
    photo.status === "published"
      ? { icon: CircleCheck, label: t("published") }
      : photo.status === "scheduled"
        ? { icon: CalendarClock, label: t("scheduled") }
        : photo.status === "draft"
          ? { icon: PencilLine, label: t("draft") }
          : photo.source === "ai"
            ? { icon: Sparkles, label: t("ai") }
            : null;
  if (!badge) return null;
  const Icon = badge.icon;
  return (
    <span
      title={badge.label}
      className={cn(
        "grid size-[22px] place-items-center rounded-full bg-black/45 text-white backdrop-blur-sm",
        photo.status === "scheduled" && "bg-brand/90",
        className,
      )}
    >
      <Icon className="size-3.5" strokeWidth={2.4} aria-hidden />
      <span className="sr-only">{badge.label}</span>
    </span>
  );
});

export const PhotoTile = memo(function PhotoTile({
  photo,
  selecting,
  selected,
  onOpen,
  onToggle,
  priority,
}: {
  photo: Photo;
  selecting: boolean;
  selected: boolean;
  onOpen: (id: string) => void;
  onToggle: (id: string) => void;
  priority?: boolean;
}) {
  const { l } = useT();
  return (
    <button
      type="button"
      onClick={() => (selecting ? onToggle(photo.id) : onOpen(photo.id))}
      aria-pressed={selecting ? selected : undefined}
      aria-label={l(photo.dish)}
      className="group relative aspect-square overflow-hidden bg-muted outline-offset-[-2px] focus-visible:rounded-none focus-visible:outline-[3px]"
    >
      <Image
        src={photo.thumb}
        alt=""
        fill
        sizes="(min-width: 1024px) 180px, 33vw"
        priority={priority}
        className={cn("object-cover transition-[transform,opacity] duration-200", selected && "scale-[0.94] rounded-sm opacity-80")}
      />
      <StatusBadge photo={photo} className="absolute end-1.5 top-1.5" />
      {photo.favorite && !selecting && (
        <Heart className="absolute start-1.5 bottom-1.5 size-4 fill-white text-white drop-shadow" aria-hidden />
      )}
      {selecting && (
        <span
          className={cn(
            "absolute end-1.5 bottom-1.5 grid size-[22px] place-items-center rounded-full border-[1.5px] border-white shadow",
            selected ? "bg-brand" : "bg-black/20",
          )}
        >
          {selected && <Check className="size-3.5 text-white" strokeWidth={3} />}
        </span>
      )}
    </button>
  );
});
