"use client";

import { BarChart3, Bell, CalendarClock, CircleCheck, FileText, Lightbulb, MessageCircle, Send, Swords } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { EmptyState } from "@/components/kit";
import { Sheet } from "@/components/sheet";
import { ago, daysFromNow } from "@/lib/format";
import { useT } from "@/lib/hooks";
import { useNotifications, useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import type { AppNotification, NotificationKind } from "@/mock/types";
import { useSheet } from "./use-sheet";

const ICONS: Record<NotificationKind, typeof Bell> = {
  comment: MessageCircle,
  message: Send,
  published: CircleCheck,
  recommendation: Lightbulb,
  report: FileText,
  competitor: Swords,
  scheduled: CalendarClock,
};

export function NotificationsSheet() {
  const { open, close } = useSheet("notifications");
  const { t } = useT();
  const items = useNotifications();
  const unread = items.some((n) => !n.read);
  const today = items.filter((n) => daysFromNow(n.at) === 0);
  const earlier = items.filter((n) => daysFromNow(n.at) !== 0);

  return (
    <Sheet
      open={open}
      onClose={close}
      title={t("notifications")}
      desktop="panel"
      start={
        unread ? (
          <button
            type="button"
            onClick={() => {
              useStore.getState().markAllNotificationsRead();
              toast.success(t("markedAllRead"));
            }}
            className="rounded-lg px-1 text-[13px] font-semibold text-brand-ink"
          >
            {t("markAllRead")}
          </button>
        ) : null
      }
    >
      {items.length === 0 ? (
        <EmptyState icon={<Bell />} title={t("noNotifications")} body={t("noNotificationsBody")} />
      ) : (
        <div className="pb-4">
          {today.length > 0 && <Group title={t("today")} items={today} onDone={close} />}
          {earlier.length > 0 && <Group title={t("earlier")} items={earlier} onDone={close} />}
        </div>
      )}
    </Sheet>
  );
}

function Group({ title, items, onDone }: { title: string; items: AppNotification[]; onDone: () => void }) {
  const { l, lang } = useT();
  const router = useRouter();
  return (
    <section>
      <h3 className="px-4 pt-2 pb-1 text-[15px] font-semibold">{title}</h3>
      <ul>
        {items.map((n) => {
          const Icon = ICONS[n.kind] ?? BarChart3;
          return (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => {
                  useStore.getState().markNotificationRead(n.id);
                  onDone();
                  router.push(n.href);
                }}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-start hover:bg-muted/60"
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-full", n.read ? "bg-muted" : "bg-brand-soft text-brand-ink")}>
                  <Icon className="size-5" />
                </span>
                <span className={cn("min-w-0 flex-1 text-[14px] leading-snug", !n.read && "font-semibold")}>
                  {l(n.text)} <span className="font-normal text-muted-foreground">{ago(n.at, lang)}</span>
                </span>
                {!n.read && <span className="size-2 shrink-0 rounded-full bg-brand" aria-label="unread" />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
