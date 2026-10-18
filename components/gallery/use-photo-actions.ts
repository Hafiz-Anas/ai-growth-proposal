"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { num } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { useOpenAi } from "@/components/ai/use-open-ai";

export function usePhotoActions() {
  const router = useRouter();
  const { t, lang } = useT();
  const s = useStore.getState;
  const openAi = useOpenAi();

  return {
    /** Opens the AI chat with the photos attached, ready to turn into a post. */
    createWithAi(ids: string[]) {
      openAi(ids);
    },
    /** With the AI tab, creating a post happens in the AI chat; the footer layout keeps the classic composer. */
    createPost(ids: string[]) {
      if (s().aiLayout === "tab") return openAi(ids);
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
