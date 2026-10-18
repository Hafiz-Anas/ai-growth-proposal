"use client";

import { useMemo, useState } from "react";
import { num } from "@/lib/format";
import { translate, type MessageKey } from "@/lib/i18n";
import { useInsights } from "@/lib/hooks";
import { useAccount, useCompetitors, usePhotos, useStore } from "@/lib/store";
import { matchQuestion, type ChatContext } from "@/mock/ai-chat";
import {
  DIRECTION_LABEL,
  PHOTO_STEPS,
  STYLE_LABEL,
  directions,
  findSource,
  inspiredPost,
  photoPost,
  productPhotos,
  productsFor,
  unposted,
  type AiMsg,
  type Product,
} from "@/mock/ai-studio";
import { ownComparison } from "@/mock/competitors";
import type { AccountId, L, Lang } from "@/mock/types";

let uid = 0;
const id = () => `ai-${Date.now().toString(36)}-${uid++}`;

/** The same message in both languages. */
const both = (key: MessageKey, vars?: (lang: Lang) => Record<string, string | number>): L => ({
  en: translate("en", key, vars?.("en")),
  ar: translate("ar", key, vars?.("ar")),
});
const same = (text: string): L => ({ en: text, ar: text });

/** Typing delay before the assistant starts answering. */
const DELAY = 550;

export function useChatContext(): ChatContext {
  const account = useAccount();
  const photos = usePhotos();
  const insights = useInsights();
  const competitors = useCompetitors();
  return useMemo(
    () => ({ account, photos, insights, competitors, own: ownComparison[account.id as AccountId] ?? ownComparison.mathanet }),
    [account, photos, insights, competitors],
  );
}

/** Turns prompts, attachments and picks into chat messages. All answers are mock data. */
export function useAiEngine(ctx: ChatContext) {
  const [typing, setTyping] = useState(false);
  const s = useStore.getState;

  /** Shows the user's message now and the assistant's reply after a short "typing" pause. */
  const exchange = (user: AiMsg | null, reply: () => AiMsg | null) => {
    const chatId = user ? s().pushAi([user], { title: user.role === "user" ? user.text : undefined }) : s().activeChatId;
    setTyping(true);
    window.setTimeout(() => {
      const msg = reply();
      if (msg) s().pushAi([msg], { chatId: chatId ?? undefined });
      setTyping(false);
    }, DELAY);
  };

  const userMsg = (text: L, extra?: { photoIds?: string[]; refThumb?: string }): AiMsg => ({ id: id(), role: "user", text, ...extra });

  const postFromPhotos = (photoIds: string[], text: L, wantsOptions = false) => {
    s().setChatMode("post");
    exchange(userMsg(text, { photoIds }), () =>
      wantsOptions
        ? { id: id(), role: "ai", kind: "directions", steps: [{ key: "look" }, { key: "directions" }], ready: false, text: both("directionsIntro"), options: directions(ctx, photoIds) }
        : { id: id(), role: "ai", kind: "post", steps: PHOTO_STEPS, ready: false, text: both("postReady"), post: photoPost(ctx, photoIds) },
    );
  };

  const nextPost = (text: L) => {
    const photo = unposted(ctx.photos)[0];
    exchange(userMsg(text), () => ({
      id: id(),
      role: "ai",
      kind: "post",
      steps: PHOTO_STEPS,
      ready: false,
      text: {
        en: `Your "${photo.dish.en}" photo hasn't been posted yet, and shots like it get more saves than average. Here's a post for tomorrow:`,
        ar: `صورة «${photo.dish.ar}» لم تُنشر بعد، وهذا النوع من الصور يحصل على حفظ أعلى من المتوسط. هذا منشور جاهز لغد:`,
      },
      post: photoPost(ctx, [photo.id]),
    }));
  };

  const directionsForNext = (text: L) => {
    const ids = unposted(ctx.photos)
      .slice(0, 3)
      .map((p) => p.id);
    exchange(userMsg(text), () => ({
      id: id(),
      role: "ai",
      kind: "directions",
      steps: [{ key: "look" }, { key: "directions" }],
      ready: false,
      text: both("directionsFor"),
      options: directions(ctx, ids),
    }));
  };

  const askInspiration = (text: L) => exchange(userMsg(text), () => ({ id: id(), role: "ai", kind: "pickInspiration" }));
  const askProduct = (text: L) => exchange(userMsg(text), () => ({ id: id(), role: "ai", kind: "pickProduct" }));

  const productDirections = (product: Product, text: L) => {
    const found = productPhotos(ctx.photos, product);
    const n = found.photos.length;
    const where = found.where === "uploads" ? "foundInUploads" : found.where === "library" ? "foundInLibrary" : "foundNone";
    exchange(userMsg(text), () => ({
      id: id(),
      role: "ai",
      kind: "directions",
      steps: [{ key: "product", v: product.name }, { key: "look" }, { key: "directions" }],
      ready: false,
      text: {
        en: `${product.name.en} · ${product.price.en} · ${product.detail.en}\n${translate("en", where, { n })} ${translate("en", "directionsIntro")}`,
        ar: `${product.name.ar} · ${product.price.ar} · ${product.detail.ar}\n${translate("ar", where, { n: num(n, "ar") })} ${translate("ar", "directionsIntro")}`,
      },
      options: directions(
        ctx,
        found.photos.map((p) => p.id),
      ),
    }));
  };

  const answer = (text: L, answerId: string) => {
    if (answerId === "post-next") return nextPost(text);
    exchange(userMsg(text), () => ({ id: id(), role: "ai", kind: "answer", answerId }));
  };

  return {
    typing,

    /** Sends what's in the composer. */
    send() {
      const { composer, chatMode } = s();
      const q = composer.text.trim();
      if (typing || (!q && composer.photoIds.length === 0)) return;
      s().setComposer({ text: "", photoIds: [] });
      const text = q ? same(q) : both(composer.photoIds.length > 1 ? "photosPrompt" : "photoPrompt");
      const lower = q.toLowerCase();
      if (composer.photoIds.length) return postFromPhotos(composer.photoIds, text, /direction|option|idea|اتجاه|خيار|أفكار/.test(lower));
      if (chatMode === "post") {
        const product = productsFor(ctx.account.id).find((p) => lower.includes(p.name.en.toLowerCase()) || q.includes(p.name.ar));
        if (product) return productDirections(product, text);
        if (/like this|style|inspir|مثل|أسلوب|إلهام/.test(lower)) return askInspiration(text);
        if (/product|منتج/.test(lower)) return askProduct(text);
        if (/direction|option|idea|اتجاه|خيار|أفكار/.test(lower)) return directionsForNext(text);
      }
      answer(text, matchQuestion(q, chatMode));
    },

    /** Suggested prompts. Returns "attach" when the photo picker should open instead. */
    prompt(promptId: string, text: L): "attach" | void {
      if (typing) return;
      if (promptId === "x-photo") return "attach";
      if (promptId === "x-like") return askInspiration(text);
      if (promptId === "x-product") return askProduct(text);
      if (promptId === "x-directions") return directionsForNext(text);
      answer(text, promptId);
    },

    pickInspiration(msgId: string, sourceId: string) {
      const source = findSource(ctx, sourceId);
      if (!source || typing) return;
      s().updateAiMsg(msgId, { chosen: sourceId });
      const post = inspiredPost(ctx, source);
      const photo = ctx.photos.find((p) => p.id === post.photoIds[0])!;
      exchange(userMsg(both("likeThisPost", () => ({ handle: source.handle })), { refThumb: source.thumb }), () => ({
        id: id(),
        role: "ai",
        kind: "post",
        steps: [{ key: "style", v: same(source.handle) }, ...PHOTO_STEPS],
        ready: false,
        text: {
          en: `@${source.handle}'s post works because it uses ${STYLE_LABEL[source.style].en}. Here's a new post in that style, on your own "${photo.dish.en}" photo:`,
          ar: `منشور ⁦@${source.handle}⁩ ناجح لأنه يستخدم ${STYLE_LABEL[source.style].ar}. هذا منشور جديد بنفس الأسلوب على صورتك «${photo.dish.ar}»:`,
        },
        post,
      }));
    },

    pickProduct(msgId: string, productId: string) {
      const product = productsFor(ctx.account.id).find((p) => p.id === productId);
      if (!product || typing) return;
      s().updateAiMsg(msgId, { chosen: productId });
      productDirections(product, both("productPrompt", (lang) => ({ product: product.name[lang] })));
    },

    chooseDirection(msgId: string, index: number) {
      const msg = s()
        .chats[s().activeAccountId]?.flatMap((c) => c.messages)
        .find((m) => m.id === msgId);
      if (!msg || msg.role !== "ai" || msg.kind !== "directions" || typing) return;
      const option = msg.options[index];
      s().updateAiMsg(msgId, { chosen: index });
      const label = DIRECTION_LABEL[option.direction ?? "warm"];
      exchange(userMsg(both("goWith", (lang) => ({ name: label[lang] }))), () => ({
        id: id(),
        role: "ai",
        kind: "post",
        steps: [{ key: "hashtags" }, { key: "time" }],
        ready: false,
        text: both("postReady"),
        post: { ...option },
      }));
    },
  };
}

export type AiEngine = ReturnType<typeof useAiEngine>;
