import type { Platform, Role, ScreenNode } from "./types"

export const MOBILE_FRAME_WIDTH = 375
export const MOBILE_FRAME_HEIGHT = 812
export const DESKTOP_FRAME_WIDTH = 1024
export const DESKTOP_FRAME_HEIGHT = 768
export const MOBILE_THUMB_WIDTH = 160
export const DESKTOP_THUMB_WIDTH = 252
export const INFO_BAR_HEIGHT = 44

export const PLATFORM_COLOR: Record<Platform, string> = {
  LINE: "#06C755",
  LIFF: "#3B82F6",
  後台: "#8B5CF6",
}

export const PLATFORM_BG: Record<Platform, string> = {
  LINE: "#f0fdf4",
  LIFF: "#eff6ff",
  後台: "#f5f3ff",
}

export const ROLE_LABEL: Record<Role, string> = {
  student: "學員",
  coach: "教練",
  admin: "管理者",
}

export function iframeConfig(node: ScreenNode) {
  if (node.type === "desktop") {
    const scale = DESKTOP_THUMB_WIDTH / DESKTOP_FRAME_WIDTH
    return {
      fw: DESKTOP_FRAME_WIDTH,
      fh: DESKTOP_FRAME_HEIGHT,
      scale,
      tw: DESKTOP_THUMB_WIDTH,
      th: Math.round(DESKTOP_FRAME_HEIGHT * scale),
    }
  }

  const scale = MOBILE_THUMB_WIDTH / MOBILE_FRAME_WIDTH
  return {
    fw: MOBILE_FRAME_WIDTH,
    fh: MOBILE_FRAME_HEIGHT,
    scale,
    tw: MOBILE_THUMB_WIDTH,
    th: Math.round(MOBILE_FRAME_HEIGHT * scale),
  }
}

export function nodeW(node: ScreenNode) {
  return iframeConfig(node).tw
}

export function nodeH(node: ScreenNode) {
  return iframeConfig(node).th
}
