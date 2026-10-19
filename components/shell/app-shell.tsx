"use client";

import { DirectionProvider } from "@base-ui/react/direction-provider";
import { MotionConfig } from "framer-motion";
import { usePathname } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";
import { LogoMark } from "@/components/kit";
import { PhotoViewer } from "@/components/gallery/photo-viewer";
import { SheetHost } from "@/components/sheets/sheet-host";
import { useMediaQuery, useMounted, useT } from "@/lib/hooks";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { AiBanner } from "./ai-banner";
import { EdgeSwipeBack } from "./edge-swipe";
import { LoggedOut } from "./logged-out";
import { Sidebar } from "./sidebar";
import { TabBar } from "./tab-bar";
import { TopBar } from "./top-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const mounted = useMounted();
  const { dir, lang } = useT();
  const theme = useStore((s) => s.theme);
  const loggedOut = useStore((s) => s.loggedOut);
  const aiLayout = useStore((s) => s.aiLayout);
  const onAi = usePathname() === "/ai";
  const systemDark = useMediaQuery("(prefers-color-scheme: dark)");
  const dark = theme === "dark" || (theme === "system" && systemDark);

  useEffect(() => {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = dir;
  }, [lang, dir]);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("dark", dark);
    html.style.colorScheme = dark ? "dark" : "light";
    document.querySelectorAll('meta[name="theme-color"]').forEach((m) => m.setAttribute("content", dark ? "#000000" : "#ffffff"));
  }, [dark]);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  // Everything is client-side mock data; render after mount so saved settings apply without hydration mismatches.
  if (!mounted) return <Splash />;

  return (
    <DirectionProvider direction={dir}>
      <MotionConfig reducedMotion="user">
        {loggedOut ? (
          <LoggedOut />
        ) : (
          <>
            <Sidebar />
            <div className="min-h-dvh lg:ms-[244px]">
              {/* The AI tab has its own header on phones; desktop keeps the regular one. */}
              <TopBar className={cn(onAi && "max-lg:hidden")} />
              <main
                className={cn(
                  "mx-auto w-full max-w-[935px] lg:px-8",
                  aiLayout === "footer" ? "pb-[calc(118px+env(safe-area-inset-bottom))] lg:pb-28" : "pb-[calc(76px+env(safe-area-inset-bottom))] lg:pb-12",
                )}
              >
                {children}
              </main>
            </div>
            {aiLayout === "footer" && !onAi && <AiBanner />}
            <TabBar />
            <PhotoViewer />
            <SheetHost />
            <EdgeSwipeBack />
          </>
        )}
        <Toaster
          dir={dir}
          position="top-center"
          theme={dark ? "dark" : "light"}
          offset={{ top: "calc(env(safe-area-inset-top) + 12px)" }}
          mobileOffset={{ top: "calc(env(safe-area-inset-top) + 10px)" }}
          toastOptions={{
            classNames: {
              toast: "!rounded-2xl !border !bg-elevated !text-foreground !shadow-lg !font-sans !text-[14px] !gap-2",
              actionButton: "!bg-transparent !text-brand !font-semibold",
              icon: "!text-brand",
            },
          }}
        />
      </MotionConfig>
    </DirectionProvider>
  );
}

function Splash() {
  return (
    <div className="grid min-h-dvh place-items-center">
      <LogoMark className="size-16 animate-pulse" />
    </div>
  );
}
