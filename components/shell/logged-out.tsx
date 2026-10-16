"use client";

import { Avatar, Btn, LogoMark } from "@/components/kit";
import { useT } from "@/lib/hooks";
import { useAccount, useStore } from "@/lib/store";

export function LoggedOut() {
  const { t } = useT();
  const account = useAccount();
  const setLoggedOut = useStore((s) => s.setLoggedOut);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-6 pt-safe pb-safe">
      <div className="flex flex-col items-center gap-3">
        <LogoMark className="size-16" />
        <h1 className="text-2xl font-semibold tracking-tight" dir="ltr">
          Growth Engine
        </h1>
        <p className="text-sm text-muted-foreground">{t("by")}</p>
      </div>
      <div className="flex w-full max-w-xs flex-col items-center gap-4">
        <Avatar src={account.avatar} alt={account.handle} size={88} />
        <Btn size="lg" className="w-full" onClick={() => setLoggedOut(false)}>
          <span dir="ltr">{t("continueAs", { handle: account.handle })}</span>
        </Btn>
      </div>
      <p className="max-w-xs text-center text-xs text-muted-foreground">{t("demoNote")}</p>
    </div>
  );
}
