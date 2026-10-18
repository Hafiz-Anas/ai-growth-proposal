"use client";

import { useRouter } from "next/navigation";
import { translate } from "@/lib/i18n";
import { useStore } from "@/lib/store";

/**
 * Opens the AI chat the way the current demo layout shows it: the AI tab, or the footer pop-up sheet.
 * With photos, starts a new chat with them attached and a ready prompt, so one tap sends.
 */
export function useOpenAi() {
  const router = useRouter();
  return (photoIds?: string[]) => {
    const s = useStore.getState();
    if (photoIds?.length) {
      s.newChat();
      s.setChatMode("post");
      s.setComposer({ photoIds, text: translate(s.lang, photoIds.length > 1 ? "photosPrompt" : "photoPrompt") });
    }
    s.closeViewer();
    s.setSelecting(false);
    if (s.aiLayout === "tab") {
      s.closeSheet();
      router.push("/ai");
    } else s.openSheet({ type: "ai" });
  };
}
