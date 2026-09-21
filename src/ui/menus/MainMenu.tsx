"use client";
/**
 * MAIN MENU (spec §29, rebuilt P5): the full landing page per the user's UI
 * reference image. Implementation lives in src/ui/landing/*; this file keeps
 * the shell contract (page.tsx imports MainMenu for MAIN_MENU and
 * MISSION_SELECT phases — MissionSelect still overlays on top of it).
 */
import { Landing } from "@/ui/landing/Landing";

export function MainMenu() {
  return <Landing />;
}
