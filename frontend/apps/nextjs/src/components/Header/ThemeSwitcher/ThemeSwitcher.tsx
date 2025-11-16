"use client"

import dynamic from "next/dynamic"

import { ThemeSwitcherTriggerButton } from "./ThemeSwitcherTriggerButton"

// Import dynamically with exactly same looking disabled button
// theme is resolved client-side only
const ThemesSwitcherMenu = dynamic(
  () => import("./ThemeSwitcherMenu").then((mod) => mod.ThemeSwitcherMenu),
  { ssr: false, loading: () => <ThemeSwitcherTriggerButton disabled /> },
)

export const ThemeSwitcher = () => <ThemesSwitcherMenu />
