"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { accounts as mockAccounts } from "@/mock/accounts";
import type { ChatMode } from "@/mock/ai-chat";
import { NOW } from "@/mock/clock";
import { competitorSuggestions, competitors as mockCompetitors } from "@/mock/competitors";
import { seedChats, type AiChat, type AiMsg } from "@/mock/ai-studio";
import { buildEngagement } from "@/mock/engagement";
import { insights as mockInsights, recommendations as mockRecs } from "@/mock/insights";
import { notifications as mockNotifications } from "@/mock/notifications";
import { initialPhotos, seeded } from "@/mock/photos";
import type {
  Account,
  AccountId,
  AppNotification,
  Competitor,
  CustomAlbum,
  EngagementItem,
  L,
  Lang,
  Photo,
  Recommendation,
  RecStatus,
  SentAs,
} from "@/mock/types";

export type Theme = "light" | "dark" | "system";
/** Demo switch: AI as a center tab (default) or as the footer pop-up with the Create tab. */
export type AiLayout = "tab" | "footer";

export type SheetState =
  | { type: "accounts" }
  | { type: "notifications" }
  | { type: "ai" }
  | { type: "schedule"; photoIds: string[]; caption?: L; suggested?: string }
  | { type: "album"; photoIds: string[] }
  | { type: "upload" }
  | { type: "performance"; photoId: string }
  | { type: "addCompetitor" }
  | { type: "competitor"; id: string }
  | { type: "addAccount" }
  | { type: "editProfile" }
  | { type: "plan" }
  | { type: "help" }
  | { type: "report" }
  | { type: "logout" };

type PerAccount<T> = Record<string, T>;

interface DemoData {
  accounts: Account[];
  photos: PerAccount<Photo[]>;
  albums: PerAccount<CustomAlbum[]>;
  engagement: PerAccount<EngagementItem[]>;
  recs: PerAccount<Recommendation[]>;
  competitors: PerAccount<Competitor[]>;
  notifications: PerAccount<AppNotification[]>;
  chats: PerAccount<AiChat[]>;
  lastAnalysis: PerAccount<string | undefined>;
}

interface State extends DemoData {
  lang: Lang;
  theme: Theme;
  activeAccountId: AccountId;
  notificationPrefs: Record<string, boolean>;
  planId: "starter" | "growth" | "pro";
  setPlan: (id: State["planId"]) => void;
  loggedOut: boolean;
  sheet: SheetState | null;
  viewer: { ids: string[]; index: number } | null;
  draft: { photoIds: string[]; caption?: L; time?: string };
  chatMode: ChatMode;
  aiLayout: AiLayout;
  /** Open AI chat; null shows a new, empty chat. */
  activeChatId: string | null;
  /** What's in the AI chat input: text and attached photos. */
  composer: { text: string; photoIds: string[] };
  /** Gallery select mode: its toolbar takes the AI banner's place. */
  selecting: boolean;
  setSelecting: (value: boolean) => void;
  /** Bumped on account switch so screens can show a short skeleton. */
  switchTick: number;

  setLang: (lang: Lang) => void;
  setTheme: (theme: Theme) => void;
  switchAccount: (id: AccountId) => void;
  openSheet: (sheet: SheetState) => void;
  closeSheet: () => void;
  openViewer: (ids: string[], index: number) => void;
  setViewerIndex: (index: number) => void;
  closeViewer: () => void;
  setDraft: (draft: State["draft"]) => void;

  toggleFavorite: (ids: string[], value?: boolean) => void;
  deletePhotos: (ids: string[]) => Photo[];
  restorePhotos: (photos: Photo[]) => void;
  createAlbum: (name: string) => string;
  addToAlbum: (ids: string[], albumId: string) => void;
  uploadPhotos: (items: Pick<Photo, "src" | "thumb" | "dish" | "credit">[]) => void;
  schedulePhotos: (ids: string[], at: string, caption?: L) => void;
  publishPhotos: (ids: string[], caption: L) => void;
  saveDraftPhotos: (ids: string[], caption: L) => void;

  markEngagementRead: (id: string) => void;
  sendReply: (id: string, text: string, as: SentAs) => void;

  setRecStatus: (id: string, status: RecStatus) => void;
  runAnalysis: () => void;

  addCompetitor: (handle: string) => string;
  finishCompetitor: (id: string) => void;
  removeCompetitor: (id: string) => Competitor | undefined;
  restoreCompetitor: (c: Competitor) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  setChatMode: (mode: ChatMode) => void;
  setAiLayout: (layout: AiLayout) => void;
  setComposer: (composer: Partial<State["composer"]>) => void;
  newChat: () => void;
  openChat: (id: string) => void;
  /** Adds messages to the open chat, starting a new chat if none is open. Returns the chat id. */
  pushAi: (msgs: AiMsg[], opts?: { title?: L; chatId?: string }) => string;
  updateAiMsg: (msgId: string, patch: Partial<AiMsg>) => void;

  addAccount: (handle: string) => void;
  reconnectAccount: (id: string) => void;
  updateProfile: (id: string, patch: { name: L; bio: L }) => void;
  setNotificationPref: (key: string, value: boolean) => void;
  setLoggedOut: (value: boolean) => void;
  resetDemo: () => void;
}

function freshData(): DemoData {
  const ids = ["mathanet", "qahwa", "tannour"] as const;
  const per = <T,>(f: (id: AccountId) => T) => Object.fromEntries(ids.map((id) => [id, f(id)])) as PerAccount<T>;
  return {
    accounts: structuredClone(mockAccounts),
    photos: per((id) => structuredClone(initialPhotos[id])),
    albums: per(() => []),
    engagement: per((id) => buildEngagement(id, initialPhotos[id])),
    recs: per((id) => structuredClone(mockRecs[id])),
    competitors: per((id) => structuredClone(mockCompetitors[id])),
    notifications: per((id) => structuredClone(mockNotifications[id])),
    chats: per((id) =>
      seedChats({
        account: mockAccounts.find((a) => a.id === id)!,
        photos: initialPhotos[id],
        insights: mockInsights[id],
        competitors: mockCompetitors[id],
      }),
    ),
    lastAnalysis: per(() => undefined),
  };
}

let uid = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${uid++}`;

export const useStore = create<State>()(
  persist(
    (set, get) => {
      const acc = () => get().activeAccountId;
      const mapPhotos = (ids: string[], f: (p: Photo) => Photo) =>
        set((s) => ({ photos: { ...s.photos, [acc()]: s.photos[acc()].map((p) => (ids.includes(p.id) ? f(p) : p)) } }));

      return {
        ...freshData(),
        lang: "en",
        theme: "light",
        activeAccountId: "mathanet",
        notificationPrefs: { comments: true, messages: true, recs: true, report: true, competitors: false },
        planId: "growth",
        setPlan: (planId) => set({ planId }),
        loggedOut: false,
        sheet: null,
        viewer: null,
        draft: { photoIds: [] },
        chatMode: "post",
        aiLayout: "tab",
        activeChatId: null,
        composer: { text: "", photoIds: [] },
        selecting: false,
        setSelecting: (selecting) => set({ selecting }),
        switchTick: 0,

        setLang: (lang) => set({ lang }),
        setTheme: (theme) => set({ theme }),
        switchAccount: (id) =>
          set((s) => ({ activeAccountId: id, switchTick: s.switchTick + 1, draft: { photoIds: [] }, viewer: null, activeChatId: null, composer: { text: "", photoIds: [] } })),
        openSheet: (sheet) => set({ sheet }),
        closeSheet: () => set({ sheet: null }),
        openViewer: (ids, index) => set({ viewer: { ids, index } }),
        setViewerIndex: (index) => set((s) => (s.viewer ? { viewer: { ...s.viewer, index } } : {})),
        closeViewer: () => set({ viewer: null }),
        setDraft: (draft) => set({ draft }),

        toggleFavorite: (ids, value) => mapPhotos(ids, (p) => ({ ...p, favorite: value ?? !p.favorite })),
        deletePhotos: (ids) => {
          const removed = get().photos[acc()].filter((p) => ids.includes(p.id));
          set((s) => ({
            photos: { ...s.photos, [acc()]: s.photos[acc()].filter((p) => !ids.includes(p.id)) },
            draft: { ...s.draft, photoIds: s.draft.photoIds.filter((id) => !ids.includes(id)) },
            composer: { ...s.composer, photoIds: s.composer.photoIds.filter((id) => !ids.includes(id)) },
          }));
          return removed;
        },
        restorePhotos: (photos) =>
          set((s) => ({
            photos: {
              ...s.photos,
              [acc()]: [...s.photos[acc()], ...photos].sort((a, b) => b.takenAt.localeCompare(a.takenAt)),
            },
          })),
        createAlbum: (name) => {
          const id = nextId("album");
          set((s) => ({ albums: { ...s.albums, [acc()]: [...s.albums[acc()], { id, name }] } }));
          return id;
        },
        addToAlbum: (ids, albumId) =>
          mapPhotos(ids, (p) => (p.albums.includes(albumId) ? p : { ...p, albums: [...p.albums, albumId] })),
        uploadPhotos: (items) =>
          set((s) => {
            const added: Photo[] = items.map((it, i) => ({
              ...it,
              id: nextId("upload"),
              accountId: acc(),
              takenAt: new Date(NOW.getTime() - i * 1000).toISOString(),
              status: "none",
              source: "upload",
              favorite: false,
              albums: [],
            }));
            return { photos: { ...s.photos, [acc()]: [...added, ...s.photos[acc()]] } };
          }),
        schedulePhotos: (ids, at, caption) =>
          mapPhotos(ids, (p) => ({ ...p, status: "scheduled", scheduledFor: at, caption: caption ?? p.caption })),
        publishPhotos: (ids, caption) => {
          const rand = seeded(ids.join("").length);
          mapPhotos(ids, (p) => ({
            ...p,
            status: "published",
            source: p.source === "ai" ? "ai" : "instagram",
            publishedAt: NOW.toISOString(),
            postType: ids.length > 1 ? "carousel" : "photo",
            caption,
            metrics: { likes: 0, comments: 0, reach: Math.round(40 + rand() * 60), saves: 0, shares: 0, reachByDay: [Math.round(40 + rand() * 60)] },
          }));
        },
        saveDraftPhotos: (ids, caption) => mapPhotos(ids, (p) => ({ ...p, status: p.status === "published" ? p.status : "draft", caption })),

        markEngagementRead: (id) =>
          set((s) => ({ engagement: { ...s.engagement, [acc()]: s.engagement[acc()].map((e) => (e.id === id ? { ...e, unread: false } : e)) } })),
        sendReply: (id, text, as) =>
          set((s) => ({
            engagement: {
              ...s.engagement,
              [acc()]: s.engagement[acc()].map((e) => (e.id === id ? { ...e, unread: false, sent: { text, as, at: NOW.toISOString() } } : e)),
            },
          })),

        setRecStatus: (id, status) =>
          set((s) => ({ recs: { ...s.recs, [acc()]: s.recs[acc()].map((r) => (r.id === id ? { ...r, status } : r)) } })),
        runAnalysis: () => set((s) => ({ lastAnalysis: { ...s.lastAnalysis, [acc()]: NOW.toISOString() } })),

        addCompetitor: (handle) => {
          const clean = handle.replace(/^@/, "").trim().toLowerCase();
          const id = nextId("comp");
          const suggestion = competitorSuggestions[acc()]?.find((c) => c.handle === clean);
          const rand = seeded(clean.length * 7 + clean.charCodeAt(0));
          const pool = get().competitors[acc()].flatMap((c) => c.thumbs);
          const c: Competitor = {
            id,
            handle: clean,
            name: { en: suggestion?.name ?? clean, ar: suggestion?.name ?? clean },
            avatar: suggestion?.avatar ?? pool[Math.floor(rand() * pool.length)] ?? "",
            followers: suggestion?.followers ?? Math.round(3000 + rand() * 20000),
            postsPerWeek: Math.round(2 + rand() * 5),
            engagementRate: Math.round((3 + rand() * 4) * 10) / 10,
            growth: Math.round((0.5 + rand() * 4) * 10) / 10,
            mix: { reel: 35, carousel: 30, photo: 35 },
            bestDays: { en: "Thu, Fri", ar: "الخميس، الجمعة" },
            bestTime: { en: "8 – 10 PM", ar: "٨ – ١٠ مساءً" },
            thumbs: [0, 1, 2].map((i) => pool[(Math.floor(rand() * pool.length) + i * 3) % Math.max(pool.length, 1)]).filter(Boolean),
            note: { en: "New: first analysis just finished.", ar: "جديد: اكتمل التحليل الأول للتو." },
            analyzing: true,
          };
          set((s) => ({ competitors: { ...s.competitors, [acc()]: [...s.competitors[acc()], c] } }));
          return id;
        },
        finishCompetitor: (id) =>
          set((s) => ({
            competitors: Object.fromEntries(
              Object.entries(s.competitors).map(([k, list]) => [k, list.map((c) => (c.id === id ? { ...c, analyzing: false } : c))]),
            ),
          })),
        removeCompetitor: (id) => {
          const c = get().competitors[acc()].find((x) => x.id === id);
          set((s) => ({ competitors: { ...s.competitors, [acc()]: s.competitors[acc()].filter((x) => x.id !== id) } }));
          return c;
        },
        restoreCompetitor: (c) => set((s) => ({ competitors: { ...s.competitors, [acc()]: [...s.competitors[acc()], c] } })),

        markNotificationRead: (id) =>
          set((s) => ({
            notifications: { ...s.notifications, [acc()]: s.notifications[acc()].map((n) => (n.id === id ? { ...n, read: true } : n)) },
          })),
        markAllNotificationsRead: () =>
          set((s) => ({ notifications: { ...s.notifications, [acc()]: s.notifications[acc()].map((n) => ({ ...n, read: true })) } })),

        setChatMode: (chatMode) => set({ chatMode }),
        setAiLayout: (aiLayout) => set({ aiLayout, sheet: null }),
        setComposer: (patch) => set((s) => ({ composer: { ...s.composer, ...patch } })),
        newChat: () => set({ activeChatId: null, composer: { text: "", photoIds: [] } }),
        openChat: (id) => {
          const chat = (get().chats[acc()] ?? []).find((c) => c.id === id);
          set({ activeChatId: id, chatMode: chat?.mode ?? get().chatMode, composer: { text: "", photoIds: [] } });
        },
        pushAi: (msgs, opts) => {
          const s = get();
          const list = s.chats[acc()] ?? [];
          const existing = list.find((c) => c.id === (opts?.chatId ?? s.activeChatId));
          const at = NOW.toISOString();
          const chat: AiChat = existing
            ? { ...existing, at, messages: [...existing.messages, ...msgs] }
            : { id: nextId("chat"), title: opts?.title ?? { en: "New chat", ar: "محادثة جديدة" }, mode: s.chatMode, at, messages: msgs };
          // Most recent chat first, like ChatGPT. Late answers for a chat that's no longer open don't switch to it.
          set({ activeChatId: opts?.chatId ? s.activeChatId : chat.id, chats: { ...s.chats, [acc()]: [chat, ...list.filter((c) => c.id !== chat.id)] } });
          return chat.id;
        },
        updateAiMsg: (msgId, patch) =>
          set((s) => ({
            chats: {
              ...s.chats,
              [acc()]: (s.chats[acc()] ?? []).map((c) =>
                c.messages.some((m) => m.id === msgId) ? { ...c, messages: c.messages.map((m) => (m.id === msgId ? ({ ...m, ...patch } as AiMsg) : m)) } : c,
              ),
            },
          })),

        addAccount: (handle) => {
          const clean = handle.replace(/^@/, "").trim().toLowerCase();
          set((s) => ({
            accounts: [
              ...s.accounts,
              {
                ...structuredClone(mockAccounts[0]),
                id: nextId("acct"),
                handle: clean,
                name: { en: clean, ar: clean },
                avatar: "",
                followers: 0,
                following: 0,
                posts: 0,
                connection: "pending",
              },
            ],
          }));
        },
        reconnectAccount: (id) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, connection: "connected" } : a)) })),
        updateProfile: (id, patch) => set((s) => ({ accounts: s.accounts.map((a) => (a.id === id ? { ...a, ...patch } : a)) })),
        setNotificationPref: (key, value) => set((s) => ({ notificationPrefs: { ...s.notificationPrefs, [key]: value } })),
        setLoggedOut: (loggedOut) => set({ loggedOut, sheet: null, viewer: null }),
        resetDemo: () =>
          set((s) => ({
            ...freshData(),
            switchTick: s.switchTick + 1,
            draft: { photoIds: [] },
            sheet: null,
            viewer: null,
            activeChatId: null,
            composer: { text: "", photoIds: [] },
          })),
      };
    },
    {
      name: "growth-engine-settings",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return { ...current, ...p, notificationPrefs: { ...current.notificationPrefs, ...(p.notificationPrefs ?? {}) } };
      },
      partialize: (s) => ({ lang: s.lang, theme: s.theme, activeAccountId: s.activeAccountId, notificationPrefs: s.notificationPrefs, aiLayout: s.aiLayout }),
    },
  ),
);

// ---- Selectors -------------------------------------------------------------

export const useLang = () => useStore((s) => s.lang);
export const useAccount = () => {
  const id = useStore((s) => s.activeAccountId);
  const accounts = useStore((s) => s.accounts);
  return accounts.find((a) => a.id === id) ?? accounts[0];
};
export const usePhotos = () => useStore((s) => s.photos[s.activeAccountId]);
export const useEngagement = () => useStore((s) => s.engagement[s.activeAccountId]);
export const useNotifications = () => useStore((s) => s.notifications[s.activeAccountId]);
export const useCompetitors = () => useStore((s) => s.competitors[s.activeAccountId]);
export const useRecs = () => useStore((s) => s.recs[s.activeAccountId]);
export const useAlbums = () => useStore((s) => s.albums[s.activeAccountId]);
export const useChats = () => useStore((s) => s.chats[s.activeAccountId] ?? EMPTY_CHATS);
export const useActiveChat = () => useStore((s) => (s.chats[s.activeAccountId] ?? EMPTY_CHATS).find((c) => c.id === s.activeChatId));
const EMPTY_CHATS: AiChat[] = [];

export function unreadFor(s: State, accountId: string) {
  return (s.engagement[accountId] ?? []).filter((e) => e.unread && !e.sent).length;
}
