export type ScreenType = "mobile" | "desktop"
export type Platform = "LINE" | "LIFF" | "後台"
export type Role = "student" | "coach" | "admin"
export type ConnectionSide = "top" | "right" | "bottom" | "left"

export interface ScreenNode {
  id: string
  title: string
  href: string
  type: ScreenType
  platform: Platform
  role: Role
  purpose: string
  states: string[]
  x: number
  y: number
}

export interface FlowEdge {
  id: string
  from: string
  to: string
  label: string
  fromSide?: ConnectionSide
  toSide?: ConnectionSide
}

export interface ProductFlow {
  id: string
  title: string
  description: string
  screens: ScreenNode[]
  edges: FlowEdge[]
}

export interface NavItem {
  id: string
  label: string
  emoji?: string
  type: "section" | "role" | "flow" | "doc"
  children?: NavItem[]
  flowId?: string
  docId?: string
}

export type PageOption = Pick<ScreenNode, "href" | "type" | "platform" | "role"> & {
  label: string
}
