"use client";

import { Dialog } from "@base-ui/react/dialog";
import { AnimatePresence, motion, useDragControls, type PanInfo } from "framer-motion";
import { XIcon } from "lucide-react";
import { useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useIsDesktop, useT } from "@/lib/hooks";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  /** Shown in the header before the title (e.g. a back button). */
  start?: ReactNode;
  /** Shown in the header after the title, before the close button. */
  end?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  /** On desktop: centered dialog (default) or a side panel at the end edge. */
  desktop?: "dialog" | "panel";
  /** On phones: fit content (default) or take almost the full height. */
  tall?: boolean;
  bodyClassName?: string;
}

const spring = { type: "spring", damping: 32, stiffness: 340, mass: 0.9 } as const;

/**
 * Bottom sheet on phones (drag down to close), dialog or side panel on desktop.
 * Built on Base UI Dialog for focus trapping, Escape and screen reader semantics.
 */
export function Sheet({ open, onClose, title, start, end, footer, children, desktop = "dialog", tall, bodyClassName }: SheetProps) {
  const isDesktop = useIsDesktop();
  const { t, dir } = useT();
  const drag = useDragControls();
  const popupRef = useRef<HTMLDivElement>(null);
  const mode = isDesktop ? desktop : "sheet";
  const side = dir === "rtl" ? "-100%" : "100%";

  const motionProps =
    mode === "panel"
      ? { initial: { x: side, opacity: 0.6 }, animate: { x: 0, opacity: 1 }, exit: { x: side, opacity: 0 }, transition: spring }
      : mode === "dialog"
        ? {
            initial: { opacity: 0, scale: 0.96 },
            animate: { opacity: 1, scale: 1 },
            exit: { opacity: 0, scale: 0.96 },
            transition: { duration: 0.18, ease: "easeOut" as const },
          }
        : { initial: { y: "100%", opacity: 1 }, animate: { y: 0, opacity: 1 }, exit: { y: "100%", opacity: 0.4 }, transition: spring };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) onClose();
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => !next && onClose()}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal keepMounted>
            <Dialog.Backdrop
              className="fixed inset-0 z-[70] bg-black/40 dark:bg-black/60"
              render={
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} />
              }
            />
            <Dialog.Popup
              ref={popupRef}
              initialFocus={popupRef}
              className={cn(
                "fixed z-[70] flex flex-col bg-elevated text-foreground shadow-2xl outline-none",
                mode === "sheet" && "inset-x-0 bottom-0 max-h-[92dvh] rounded-t-[22px] pb-safe",
                mode === "sheet" && tall && "h-[92dvh]",
                mode === "dialog" && "inset-0 m-auto h-fit max-h-[86dvh] w-[min(500px,calc(100vw-2rem))] rounded-2xl",
                mode === "panel" && "inset-y-0 end-0 w-[420px] border-s",
              )}
              render={
                <motion.div
                  {...motionProps}
                  drag={mode === "sheet" ? "y" : false}
                  dragControls={drag}
                  dragListener={false}
                  dragConstraints={{ top: 0, bottom: 0 }}
                  dragElastic={{ top: 0, bottom: 0.7 }}
                  onDragEnd={onDragEnd}
                />
              }
            >
              <div
                className={cn("shrink-0 touch-none", mode === "sheet" && "cursor-grab active:cursor-grabbing")}
                onPointerDown={(e) => mode === "sheet" && drag.start(e)}
              >
                {mode === "sheet" && <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 rounded-full bg-foreground/15" />}
                <div className="grid min-h-12 grid-cols-[1fr_auto_1fr] items-center gap-2 px-3">
                  <div className="flex justify-start">{start}</div>
                  <Dialog.Title className="truncate text-center text-[15px] font-semibold">{title}</Dialog.Title>
                  <div className="flex items-center justify-end gap-1">
                    {end}
                    <Dialog.Close
                      aria-label={t("close")}
                      className="grid size-9 place-items-center rounded-full text-foreground/70 hover:bg-muted hover:text-foreground"
                    >
                      <XIcon className="size-5" />
                    </Dialog.Close>
                  </div>
                </div>
              </div>
              <div className={cn("min-h-0 flex-1 overflow-y-auto overscroll-contain", bodyClassName)}>{children}</div>
              {footer && <div className="shrink-0 border-t px-4 py-3">{footer}</div>}
            </Dialog.Popup>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
