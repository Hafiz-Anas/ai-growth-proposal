"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { useStore } from "@/lib/store";

export function usePhotoActions() {
  const router = useRouter();
  const { t, lang } = useT();
  const s = useStore.getState;

  return {
    createPost(ids: string[]) {
      s().setDraft({ photoIds: ids });
      s().closeViewer();
      s().setSelecting(false);
      router.push("/create");
    },
    schedule(ids: string[]) {
      s().openSheet({ type: "schedule", photoIds: ids });
    },
    addToAlbum(ids: string[]) {
      s().openSheet({ type: "album", photoIds: ids });
    },
    favorite(ids: string[], value: boolean) {
      s().toggleFavorite(ids, value);
      toast.success(value ? t("addedToFavorites") : t("removedFromFavorites"));
    },
    remove(ids: string[]) {
      const removed = s().deletePhotos(ids);
      toast.success(ids.length > 1 ? t("deletedN", { n: num(ids.length, lang) }) : t("deleted"), {
        action: { label: t("undo"), onClick: () => s().restorePhotos(removed) },
      });
    },
  };
}
