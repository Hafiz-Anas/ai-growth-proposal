"use client";

import { AiChatSheet } from "@/components/ai/ai-chat-sheet";
import { AccountsSheet, AddAccountSheet, EditProfileSheet } from "./account-sheets";
import { AddCompetitorSheet, CompetitorSheet } from "./competitor-sheets";
import { HelpSheet, LogoutSheet, PlanSheet, ReportSheet } from "./misc-sheets";
import { NotificationsSheet } from "./notifications-sheet";
import { AlbumNameSheet, AlbumSheet, PerformanceSheet, PostSheet, ScheduleSheet, UploadSheet } from "./photo-sheets";

/** Every sheet lives here; which one is open comes from the store. */
export function SheetHost() {
  return (
    <>
      <AccountsSheet />
      <AddAccountSheet />
      <EditProfileSheet />
      <NotificationsSheet />
      <AiChatSheet />
      <ScheduleSheet />
      <AlbumSheet />
      <AlbumNameSheet />
      <PostSheet />
      <UploadSheet />
      <PerformanceSheet />
      <AddCompetitorSheet />
      <CompetitorSheet />
      <PlanSheet />
      <HelpSheet />
      <ReportSheet />
      <LogoutSheet />
    </>
  );
}
