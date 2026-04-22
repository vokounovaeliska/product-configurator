"use client"

import dynamic from "next/dynamic"

import { ThemeSwitcherTriggerButton } from "./ThemeSwitcherTriggerButton"

const ThemesSwitcherMenu = dynamic(
  () => import("./ThemeSwitcherMenu").then((mod) => mod.ThemeSwitcherMenu),
  { ssr: false, loading: () => <ThemeSwitcherTriggerButton disabled /> },
)

export const ThemeSwitcher = () => <ThemesSwitcherMenu />
