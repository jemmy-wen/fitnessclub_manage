"use client"

import { createContext, useContext } from "react"

export const ViewModeContext = createContext<{ isMobile: boolean }>({ isMobile: false })

export function useViewMode() {
  return useContext(ViewModeContext)
}
