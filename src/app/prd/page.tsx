"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"
import { INFO_BAR_HEIGHT, PLATFORM_BG, PLATFORM_COLOR, ROLE_LABEL, iframeConfig, nodeH, nodeW } from "@/features/prd/constants"
import { INITIAL_FLOWS, PAGE_OPTIONS, TREE } from "@/features/prd/data"
import type { ConnectionSide, FlowEdge, NavItem, ProductFlow, ScreenNode } from "@/features/prd/types"

let idCounter = 0

function createId(prefix: string) {
  idCounter += 1
  return `${prefix}-${idCounter}`
}

function getInitialCanvasView(flow: ProductFlow) {
  if (typeof window === "undefined" || flow.screens.length === 0) {
    return { pan: { x: 60, y: 60 }, zoom: 0.85 }
  }

  const leftPanelWidth = 208
  const rightPanelWidth = 256
  const toolbarHeight = 40
  const viewportW = Math.max(360, window.innerWidth - leftPanelWidth - rightPanelWidth)
  const viewportH = Math.max(360, window.innerHeight - toolbarHeight)
  const padding = 96

  const bounds = flow.screens.reduce(
    (acc, screen) => ({
      minX: Math.min(acc.minX, screen.x),
      minY: Math.min(acc.minY, screen.y),
      maxX: Math.max(acc.maxX, screen.x + nodeW(screen)),
      maxY: Math.max(acc.maxY, screen.y + nodeH(screen) + INFO_BAR_HEIGHT),
    }),
    { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity }
  )

  const boundsW = Math.max(1, bounds.maxX - bounds.minX)
  const boundsH = Math.max(1, bounds.maxY - bounds.minY)
  const fitZoom = Math.min(
    0.9,
    Math.max(0.35, Math.min((viewportW - padding * 2) / boundsW, (viewportH - padding * 2) / boundsH))
  )

  return {
    zoom: fitZoom,
    pan: {
      x: (viewportW - boundsW * fitZoom) / 2 - bounds.minX * fitZoom,
      y: (viewportH - boundsH * fitZoom) / 2 - bounds.minY * fitZoom,
    },
  }
}

// ─── Nav Tree ─────────────────────────────────────────────────────────────────

function NavNode({
  item, depth, expanded, selected, onToggle, onSelect,
}: {
  item: NavItem; depth: number
  expanded: Set<string>; selected: string | null
  onToggle: (id: string) => void; onSelect: (item: NavItem) => void
}) {
  const hasChildren = !!item.children?.length
  const isOpen = expanded.has(item.id)
  const isSelected = selected === item.id
  const isLeaf = item.type === "flow" || item.type === "doc"

  return (
    <>
      <button
        onClick={() => {
          if (hasChildren) onToggle(item.id)
          else onSelect(item)
        }}
        className={`w-full flex items-center gap-1.5 text-left px-2 py-1.5 rounded-lg text-[13px] transition-colors
          ${isSelected ? "bg-blue-50 text-blue-700 font-medium" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
        style={{ paddingLeft: depth * 14 + 8 }}
      >
        {hasChildren ? (
          <span className={`text-gray-400 text-[10px] transition-transform duration-150 ${isOpen ? "rotate-90" : ""}`}>▶</span>
        ) : (
          <span className="w-2.5 shrink-0" />
        )}
        {item.emoji && <span className="text-[13px]">{item.emoji}</span>}
        <span className="truncate">{item.label}</span>
        {isLeaf && item.type === "flow" && (
          <span className="ml-auto text-[9px] text-gray-300 uppercase tracking-wide shrink-0">flow</span>
        )}
      </button>
      {isOpen && item.children?.map(child => (
        <NavNode key={child.id} item={child} depth={depth + 1}
          expanded={expanded} selected={selected} onToggle={onToggle} onSelect={onSelect} />
      ))}
    </>
  )
}

function findNavItem(items: NavItem[], predicate: (item: NavItem) => boolean): NavItem | null {
  for (const item of items) {
    if (predicate(item)) return item
    const found = item.children ? findNavItem(item.children, predicate) : null
    if (found) return found
  }
  return null
}

type DraftConnection = {
  from: string
  fromSide: ConnectionSide
  x1: number
  y1: number
  x2: number
  y2: number
}

function nodeRect(node: ScreenNode) {
  const width = nodeW(node)
  const height = nodeH(node) + INFO_BAR_HEIGHT
  return {
    left: node.x,
    top: node.y,
    right: node.x + width,
    bottom: node.y + height,
    cx: node.x + width / 2,
    cy: node.y + height / 2,
    width,
    height,
  }
}

function anchorPoint(node: ScreenNode, side: ConnectionSide) {
  const rect = nodeRect(node)
  if (side === "top") return { x: rect.cx, y: rect.top }
  if (side === "right") return { x: rect.right, y: rect.cy }
  if (side === "bottom") return { x: rect.cx, y: rect.bottom }
  return { x: rect.left, y: rect.cy }
}

function oppositeSide(side: ConnectionSide): ConnectionSide {
  if (side === "top") return "bottom"
  if (side === "right") return "left"
  if (side === "bottom") return "top"
  return "right"
}

function nearestSide(node: ScreenNode, point: { x: number; y: number }): ConnectionSide {
  const rect = nodeRect(node)
  const distances: Record<ConnectionSide, number> = {
    top: Math.abs(point.y - rect.top),
    right: Math.abs(point.x - rect.right),
    bottom: Math.abs(point.y - rect.bottom),
    left: Math.abs(point.x - rect.left),
  }
  return (Object.entries(distances) as [ConnectionSide, number][]).sort((a, b) => a[1] - b[1])[0][0]
}

function autoSides(from: ScreenNode, to: ScreenNode): { fromSide: ConnectionSide; toSide: ConnectionSide } {
  const fromRect = nodeRect(from)
  const toRect = nodeRect(to)
  const dx = toRect.cx - fromRect.cx
  const dy = toRect.cy - fromRect.cy
  const fromSide: ConnectionSide = Math.abs(dx) >= Math.abs(dy)
    ? dx >= 0 ? "right" : "left"
    : dy >= 0 ? "bottom" : "top"
  return { fromSide, toSide: oppositeSide(fromSide) }
}

function connectionPath(start: { x: number; y: number }, end: { x: number; y: number }, fromSide: ConnectionSide, toSide: ConnectionSide) {
  if ((fromSide === "left" || fromSide === "right") && (toSide === "left" || toSide === "right")) {
    const mx = (start.x + end.x) / 2
    return `M${start.x},${start.y} H${mx} V${end.y} H${end.x}`
  }
  if ((fromSide === "top" || fromSide === "bottom") && (toSide === "top" || toSide === "bottom")) {
    const my = (start.y + end.y) / 2
    return `M${start.x},${start.y} V${my} H${end.x} V${end.y}`
  }
  const firstHorizontal = fromSide === "left" || fromSide === "right"
  return firstHorizontal
    ? `M${start.x},${start.y} H${end.x} V${end.y}`
    : `M${start.x},${start.y} V${end.y} H${end.x}`
}

// ─── Screen Card (iframe node) ────────────────────────────────────────────────

function ScreenCard({
  node, isSelected, isConnectSource, connectMode,
  onPointerDown, onStartConnection, onSelect,
}: {
  node: ScreenNode
  isSelected: boolean
  isConnectSource: boolean
  connectMode: boolean
  onPointerDown: (e: React.PointerEvent, id: string) => void
  onStartConnection: (e: React.PointerEvent, id: string, side: ConnectionSide) => void
  onSelect: (id: string) => void
}) {
  const cfg = iframeConfig(node)
  const { tw: w, th: h, fw: frameW, fh: frameH, scale } = cfg
  const color = PLATFORM_COLOR[node.platform]

  return (
    <div
      data-node-id={node.id}
      style={{
        position: "absolute",
        left: node.x,
        top: node.y,
        width: w,
        cursor: connectMode ? "crosshair" : "grab",
        userSelect: "none",
      }}
      onPointerDown={e => onPointerDown(e, node.id)}
      onClick={e => { e.stopPropagation(); onSelect(node.id) }}
    >
      {/* Iframe thumbnail */}
      <div style={{
        width: w, height: h,
        overflow: "hidden",
        borderRadius: 10,
        border: isSelected ? `2px solid #3B82F6` : isConnectSource ? `2px solid #F59E0B` : `1.5px solid #E5E7EB`,
        boxShadow: isSelected ? "0 0 0 3px #BFDBFE" : "0 2px 12px rgba(0,0,0,0.10)",
        position: "relative",
        backgroundColor: "#f8f9fa",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}>
        <iframe
          src={`${node.href}${node.href.includes("?") ? "&" : "?"}embed=1`}
          style={{
            width: frameW,
            height: frameH,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            pointerEvents: "none",
            border: "none",
            display: "block",
          }}
          loading="lazy"
          tabIndex={-1}
          title={node.title}
        />
      </div>

      {(isSelected || isConnectSource) && (
        <>
          {([
            { side: "top" as const, className: "left-1/2 -top-2 -translate-x-1/2" },
            { side: "right" as const, className: "-right-2 top-1/2 -translate-y-1/2" },
            { side: "bottom" as const, className: "left-1/2 -translate-x-1/2", style: { top: nodeH(node) + INFO_BAR_HEIGHT - 8 } },
            { side: "left" as const, className: "-left-2 top-1/2 -translate-y-1/2" },
          ]).map(handle => (
            <button
              key={handle.side}
              aria-label={`Connect ${handle.side} from ${node.title}`}
              title={`從${handle.side}拉線`}
              onPointerDown={e => onStartConnection(e, node.id, handle.side)}
              className={`absolute z-10 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white bg-blue-500 shadow-sm transition-transform hover:scale-125 ${handle.className}`}
              style={{ cursor: "crosshair", ...handle.style }}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </button>
          ))}
        </>
      )}

      {/* Info bar */}
      <div style={{
        width: w, height: INFO_BAR_HEIGHT,
        backgroundColor: "#fff",
        borderRadius: "0 0 10px 10px",
        border: "1px solid #E5E7EB",
        borderTop: "none",
        padding: "6px 8px 6px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 2,
      }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#111827", lineHeight: 1.2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {node.title}
        </p>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <span style={{ fontSize: 9, fontWeight: 600, color: color, backgroundColor: PLATFORM_BG[node.platform], borderRadius: 4, padding: "1px 5px" }}>
            {node.platform}
          </span>
          <span style={{ fontSize: 9, color: "#9CA3AF" }}>{ROLE_LABEL[node.role]}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Arrows (SVG layer, orthogonal routing) ──────────────────────────────────

function Arrows({
  screens, edges, selectedEdgeId, draftConnection, onSelectEdge,
}: {
  screens: ScreenNode[]; edges: FlowEdge[]
  selectedEdgeId: string | null
  draftConnection: DraftConnection | null
  onSelectEdge: (id: string) => void
}) {
  const nodeMap = Object.fromEntries(screens.map(s => [s.id, s]))

  return (
    <svg style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <marker id="arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#94A3B8" />
        </marker>
        <marker id="arrow-sel" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L7,3 z" fill="#3B82F6" />
        </marker>
      </defs>
      {edges.map(edge => {
        const src = nodeMap[edge.from]
        const tgt = nodeMap[edge.to]
        if (!src || !tgt) return null
        const sides = edge.fromSide && edge.toSide ? { fromSide: edge.fromSide, toSide: edge.toSide } : autoSides(src, tgt)
        const start = anchorPoint(src, sides.fromSide)
        const end = anchorPoint(tgt, sides.toSide)
        const path = connectionPath(start, end, sides.fromSide, sides.toSide)
        const lx = (start.x + end.x) / 2; const ly = (start.y + end.y) / 2
        const isSel = selectedEdgeId === edge.id
        const stroke = isSel ? "#3B82F6" : "#94A3B8"
        const labelText = edge.label || (isSel ? "加字" : "")
        const labelW = Math.max(44, Math.min(120, labelText.length * 12 + 24))
        return (
          <g key={edge.id} onClick={() => onSelectEdge(edge.id)} style={{ cursor: "pointer" }}>
            {/* Fat invisible hitbox */}
            <path d={path} fill="none" stroke="transparent" strokeWidth="12" />
            <path d={path} fill="none" stroke={stroke} strokeWidth={isSel ? 2 : 1.5}
              strokeLinejoin="round" markerEnd={isSel ? "url(#arrow-sel)" : "url(#arrow)"} />
            {labelText && (
              <>
                <rect x={lx - labelW / 2} y={ly - 10} width={labelW} height={20} rx={5}
                  fill={isSel ? "#EFF6FF" : "white"} stroke={isSel ? "#BFDBFE" : "#E5E7EB"} strokeWidth="1" />
                <text x={lx} y={ly + 4} textAnchor="middle" fontSize={9}
                  fill={edge.label ? (isSel ? "#3B82F6" : "#64748B") : "#94A3B8"} fontFamily="system-ui">{labelText}</text>
              </>
            )}
          </g>
        )
      })}
      {draftConnection && (
        <path
          d={connectionPath(
            { x: draftConnection.x1, y: draftConnection.y1 },
            { x: draftConnection.x2, y: draftConnection.y2 },
            draftConnection.fromSide,
            oppositeSide(draftConnection.fromSide)
          )}
          fill="none"
          stroke="#3B82F6"
          strokeDasharray="5 5"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          markerEnd="url(#arrow-sel)"
          style={{ pointerEvents: "none" }}
        />
      )}
    </svg>
  )
}

// ─── Canvas Area ──────────────────────────────────────────────────────────────

function CanvasArea({
  flow, selectedId, selectedEdgeId, connectMode, connectFrom,
  onSelectScreen, onSelectEdge, onConnectScreen, onCreateConnection, onUpdatePositions,
}: {
  flow: ProductFlow
  selectedId: string | null
  selectedEdgeId: string | null
  connectMode: boolean
  connectFrom: string | null
  onSelectScreen: (id: string | null) => void
  onSelectEdge: (id: string) => void
  onConnectScreen: (id: string) => void
  onCreateConnection: (from: string, to: string, fromSide?: ConnectionSide, toSide?: ConnectionSide) => void
  onUpdatePositions: (updates: Record<string, { x: number; y: number }>) => void
}) {
  const [pan, setPan] = useState({ x: 60, y: 60 })
  const [zoom, setZoom] = useState(0.85)
  const [isPanningCanvas, setIsPanningCanvas] = useState(false)
  const [draftConnection, setDraftConnection] = useState<DraftConnection | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const isPanning = useRef(false)
  const panStart = useRef({ mx: 0, my: 0, px: 0, py: 0 })
  const zoomRef = useRef(zoom)
  const panRef = useRef(pan)

  useEffect(() => {
    zoomRef.current = zoom
    panRef.current = pan
  }, [pan, zoom])

  useEffect(() => {
    let cancelled = false
    queueMicrotask(() => {
      if (cancelled) return
      const nextView = getInitialCanvasView(flow)
      setPan(nextView.pan)
      setZoom(nextView.zoom)
    })

    return () => {
      cancelled = true
    }
  }, [flow])

  // Wheel zoom (non-passive)
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const mx = e.clientX - rect.left
      const my = e.clientY - rect.top
      const dz = e.deltaY * -0.001
      const curZ = zoomRef.current
      const nz = Math.max(0.25, Math.min(2, curZ + dz * curZ))
      setPan(p => ({
        x: mx - (mx - p.x) * (nz / curZ),
        y: my - (my - p.y) * (nz / curZ),
      }))
      setZoom(nz)
    }
    el.addEventListener("wheel", handler, { passive: false })
    return () => el.removeEventListener("wheel", handler)
  }, [])

  const handleBgPointerDown = useCallback((e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest("[data-node-id]")) return
    isPanning.current = true
    setIsPanningCanvas(true)
    panStart.current = { mx: e.clientX, my: e.clientY, px: panRef.current.x, py: panRef.current.y }
    containerRef.current?.setPointerCapture(e.pointerId)
    onSelectScreen(null)
  }, [onSelectScreen])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isPanning.current) return
    setPan({ x: panStart.current.px + e.clientX - panStart.current.mx, y: panStart.current.py + e.clientY - panStart.current.my })
  }, [])

  const handlePointerUp = useCallback(() => {
    isPanning.current = false
    setIsPanningCanvas(false)
  }, [])

  const toWorldPoint = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left - panRef.current.x) / zoomRef.current,
      y: (clientY - rect.top - panRef.current.y) / zoomRef.current,
    }
  }, [])

  const handleStartConnection = useCallback((e: React.PointerEvent, nodeId: string, side: ConnectionSide) => {
    e.preventDefault()
    e.stopPropagation()

    const node = flow.screens.find(s => s.id === nodeId)
    if (!node) return

    const start = anchorPoint(node, side)
    const current = toWorldPoint(e.clientX, e.clientY)

    setDraftConnection({ from: nodeId, fromSide: side, x1: start.x, y1: start.y, x2: current.x, y2: current.y })

    const onMove = (me: PointerEvent) => {
      const point = toWorldPoint(me.clientX, me.clientY)
      setDraftConnection(prev => prev ? { ...prev, x2: point.x, y2: point.y } : prev)
    }

    const onUp = (pe: PointerEvent) => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)

      const target = document.elementFromPoint(pe.clientX, pe.clientY)?.closest("[data-node-id]")
      const targetId = target?.getAttribute("data-node-id")
      const targetNode = flow.screens.find(s => s.id === targetId)
      if (targetId && targetNode && targetId !== nodeId) {
        onCreateConnection(nodeId, targetId, side, nearestSide(targetNode, toWorldPoint(pe.clientX, pe.clientY)))
      }
      setDraftConnection(null)
    }

    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [flow.screens, onCreateConnection, toWorldPoint])

  // Node drag
  const handleNodePointerDown = useCallback((e: React.PointerEvent, nodeId: string) => {
    if (connectMode) { onConnectScreen(nodeId); return }
    e.stopPropagation()
    const node = flow.screens.find(s => s.id === nodeId)
    if (!node) return
    const startX = node.x, startY = node.y
    const startMX = e.clientX, startMY = e.clientY
    const curZ = zoomRef.current
    let moved = false

    const onMove = (me: PointerEvent) => {
      moved = true
      const dx = (me.clientX - startMX) / curZ
      const dy = (me.clientY - startMY) / curZ
      onUpdatePositions({ [nodeId]: { x: startX + dx, y: startY + dy } })
    }
    const onUp = () => {
      document.removeEventListener("pointermove", onMove)
      document.removeEventListener("pointerup", onUp)
      if (!moved) onSelectScreen(nodeId)
    }
    document.addEventListener("pointermove", onMove)
    document.addEventListener("pointerup", onUp)
  }, [flow.screens, connectMode, onConnectScreen, onSelectScreen, onUpdatePositions])

  return (
    <div style={{
      flex: 1,
      overflow: "clip",
      overscrollBehavior: "none",
      touchAction: "none",
      position: "relative",
      background: "#f8fafc",
      cursor: isPanningCanvas ? "grabbing" : "default",
    }}
      ref={containerRef}
      onPointerDown={handleBgPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Dot grid */}
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: "radial-gradient(circle, #cbd5e1 1.2px, transparent 1.2px)",
        backgroundSize: `${28 * zoom}px ${28 * zoom}px`,
        backgroundPosition: `${pan.x % (28 * zoom)}px ${pan.y % (28 * zoom)}px`,
      }} />

      {/* Canvas world */}
      <div style={{
        position: "absolute", top: 0, left: 0,
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: "0 0",
        width: 3200, height: 2000,
      }}>
        <Arrows screens={flow.screens} edges={flow.edges}
          selectedEdgeId={selectedEdgeId} draftConnection={draftConnection} onSelectEdge={onSelectEdge} />
        {flow.screens.map(node => (
          <ScreenCard
            key={node.id}
            node={node}
            isSelected={selectedId === node.id}
            isConnectSource={connectFrom === node.id}
            connectMode={connectMode}
            onPointerDown={handleNodePointerDown}
            onStartConnection={handleStartConnection}
            onSelect={id => { if (!connectMode) onSelectScreen(id) }}
          />
        ))}
      </div>

      {/* Zoom controls */}
      <div style={{ position: "absolute", bottom: 16, left: 16, display: "flex", alignItems: "flex-end", gap: 8 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[
            { label: "+", action: () => setZoom(z => Math.min(2, z * 1.2)) },
            { label: "−", action: () => setZoom(z => Math.max(0.25, z / 1.2)) },
            { label: "⊡", action: () => {
              const nextView = getInitialCanvasView(flow)
              setPan(nextView.pan)
              setZoom(nextView.zoom)
            } },
          ].map(btn => (
            <button key={btn.label} onClick={btn.action}
              className="w-8 h-8 bg-white border border-gray-200 rounded-lg text-gray-600 text-sm font-mono flex items-center justify-center hover:bg-gray-50 shadow-sm">
              {btn.label}
            </button>
          ))}
        </div>
        <span className="bg-white/90 border border-gray-200 rounded-lg px-2 py-1 text-xs text-gray-500 font-mono shadow-sm">
          {Math.round(zoom * 100)}%
        </span>
      </div>
    </div>
  )
}

// ─── Right Panel ──────────────────────────────────────────────────────────────

function RightPanel({
  flow, selectedId, selectedEdgeId, onUpdate, onUpdateEdge, onDeleteScreen, onDeleteEdge,
}: {
  flow: ProductFlow | null
  selectedId: string | null
  selectedEdgeId: string | null
  onUpdate: (nodeId: string, updates: Partial<ScreenNode>) => void
  onUpdateEdge: (edgeId: string, updates: Partial<FlowEdge>) => void
  onDeleteScreen: (id: string) => void
  onDeleteEdge: (id: string) => void
}) {
  const node = flow?.screens.find(s => s.id === selectedId) ?? null
  const selectedEdge = flow?.edges.find(e => e.id === selectedEdgeId) ?? null
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingPurpose, setEditingPurpose] = useState(false)
  const [selectedState, setSelectedState] = useState("default")

  if (selectedEdge) {
    const src = flow?.screens.find(s => s.id === selectedEdge.from)
    const tgt = flow?.screens.find(s => s.id === selectedEdge.to)
    return (
      <div className="w-64 shrink-0 border-l border-gray-200 bg-white p-5 overflow-y-auto">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-3">CONNECTION</p>
        <div className="space-y-2 mb-4">
          <div className="text-xs text-gray-700">{src?.title} <span className="text-gray-400">→</span> {tgt?.title}</div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-widest pt-2">
            連線文字
          </label>
          <input
            autoFocus
            key={selectedEdge.id}
            defaultValue={selectedEdge.label}
            placeholder="例如：送出成功、點擊綁定"
            className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-blue-400"
            onBlur={e => onUpdateEdge(selectedEdge.id, { label: e.target.value })}
            onKeyDown={e => {
              if (e.key === "Enter") {
                onUpdateEdge(selectedEdge.id, { label: e.currentTarget.value })
                e.currentTarget.blur()
              }
            }}
          />
        </div>
        <button onClick={() => onDeleteEdge(selectedEdge.id)}
          className="w-full text-xs font-medium text-red-500 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition-colors">
          Delete Connection
        </button>
      </div>
    )
  }

  if (!node) {
    return (
      <div className="w-64 shrink-0 border-l border-gray-200 bg-white p-5 overflow-y-auto">
        {flow ? (
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">FLOW</p>
              <p className="text-base font-bold text-gray-900 leading-snug">{flow.title}</p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">{flow.description}</p>
            </div>
            <div className="border-t border-gray-100 pt-4 space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">SCREENS</p>
              <p className="text-2xl font-bold text-gray-900">{flow.screens.length}</p>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-3">CONNECTIONS</p>
              <p className="text-2xl font-bold text-gray-900">{flow.edges.length}</p>
            </div>
            <p className="text-[11px] text-gray-400 border-t border-gray-100 pt-4">點選 canvas 上的 screen 查看詳細資訊</p>
          </div>
        ) : (
          <p className="text-sm text-gray-400">從左側選擇一個 Flow</p>
        )}
      </div>
    )
  }

  const color = PLATFORM_COLOR[node.platform]
  const activeState = node.states.includes(selectedState) ? selectedState : node.states[0] ?? "default"

  return (
    <div className="w-64 shrink-0 border-l border-gray-200 bg-white overflow-y-auto text-sm">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">SCREEN</p>
        {editingTitle ? (
          <input
            autoFocus
            defaultValue={node.title}
            onBlur={e => { onUpdate(node.id, { title: e.target.value }); setEditingTitle(false) }}
            onKeyDown={e => { if (e.key === "Enter") { onUpdate(node.id, { title: e.currentTarget.value }); setEditingTitle(false) } }}
            className="text-xl font-bold text-gray-900 w-full border-b-2 border-blue-400 outline-none bg-transparent"
          />
        ) : (
          <h2 className="text-xl font-bold text-gray-900 cursor-text hover:text-blue-600 transition-colors" onClick={() => setEditingTitle(true)}>{node.title}</h2>
        )}
        <p className="text-[11px] text-gray-400 mt-0.5 font-mono">{node.id}</p>
      </div>

      <div className="px-5 py-4 space-y-5">
        {/* Purpose */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">PURPOSE</p>
          {editingPurpose ? (
            <textarea
              autoFocus
              defaultValue={node.purpose}
              rows={3}
              onBlur={e => { onUpdate(node.id, { purpose: e.target.value }); setEditingPurpose(false) }}
              className="w-full text-xs text-gray-700 leading-relaxed border border-blue-300 rounded-lg p-2 outline-none resize-none"
            />
          ) : (
            <p className="text-xs text-gray-600 leading-relaxed cursor-text hover:text-blue-600 transition-colors" onClick={() => setEditingPurpose(true)}>{node.purpose}</p>
          )}
        </div>

        {/* Platform + Role */}
        <div className="flex gap-2">
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full" style={{ color, backgroundColor: PLATFORM_BG[node.platform] }}>{node.platform}</span>
          <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">{ROLE_LABEL[node.role]}</span>
        </div>

        {/* Link */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">PROTOTYPE</p>
          <a href={node.href} target="_blank" rel="noreferrer"
            className="text-xs text-blue-500 hover:text-blue-700 font-mono flex items-center gap-1 group">
            {node.href}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity">↗</span>
          </a>
        </div>

        {/* States */}
        <div>
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">STATE</p>
          <div className="flex flex-wrap gap-1.5">
            {node.states.map(s => (
              <button key={s} onClick={() => setSelectedState(s)}
                className={`text-[11px] px-2.5 py-1 rounded-full font-medium transition-colors ${
                  activeState === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Transitions */}
        {(() => {
          const outgoing = flow?.edges.filter(e => e.from === node.id) ?? []
          if (outgoing.length === 0) return null
          return (
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">TRANSITIONS · {outgoing.length}</p>
              <div className="space-y-1.5">
                {outgoing.map(edge => {
                  const target = flow?.screens.find(s => s.id === edge.to)
                  return (
                    <div key={edge.id} className="flex items-center gap-2 text-[11px] bg-gray-50 rounded-lg px-3 py-2">
                      <span className="text-gray-400 font-medium truncate flex-1">{edge.label || "tap"} → {target?.title}</span>
                      <button onClick={() => onDeleteEdge(edge.id)} className="text-gray-300 hover:text-red-400 transition-colors shrink-0 text-base leading-none">×</button>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}

        {/* Delete */}
        <div className="border-t border-gray-100 pt-4 mt-2">
          <button onClick={() => onDeleteScreen(node.id)}
            className="w-full text-[12px] font-medium text-red-500 border border-red-200 rounded-lg py-2 hover:bg-red-50 transition-colors">
            Delete Screen
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Doc View ─────────────────────────────────────────────────────────────────

function DocView({ docId }: { docId: string }) {
  if (docId === "competitive") {
    const items = [
      { name: "Super 8", tag: "基礎設施", color: "bg-blue-100 text-blue-700", desc: "LINE CRM 與行銷自動化，跨產業通用型。與 FitFlo 較接近基礎設施層，非直接競品。" },
      { name: "17FIT",   tag: "中大型場館", color: "bg-orange-100 text-orange-700", desc: "台灣健身美業主流管理系統，市佔最高（1,200 間以上）。LINE 互動以單向通知為主。" },
      { name: "BookFast",tag: "中大型場館", color: "bg-orange-100 text-orange-700", desc: "積極發展 LINE Mini APP，功能涵蓋 IoT 門禁、候補名單。主打中大型場館。" },
      { name: "FitFlo",  tag: "小型工作室", color: "bg-green-100 text-green-700", desc: "專為小型運動工作室設計，以 LINE OA 為核心入口，AI 語意分析取代關鍵字觸發。" },
    ]
    const rows = [
      { f: "LINE OA 串接",      v: ["✓（核心）","✓（外掛）","✓（Mini APP）","✓"] },
      { f: "學員雙向互動",      v: ["✗","✗","✗","✓"] },
      { f: "AI 語意分析",       v: ["✗","✗","✗","✓ 核心"] },
      { f: "課程排程管理",      v: ["✗","✓","✓","✓（輕量）"] },
      { f: "學員堂數追蹤",      v: ["✗","✓（付費）","✓","✓"] },
      { f: "請假補課流程",      v: ["✗","✓","✓","✓"] },
      { f: "自動推播通知",      v: ["✓","✓（Email）","✓","✓（LINE）"] },
      { f: "金流整合",          v: ["✗","✓","✓","✗（MVP 排除）"] },
      { f: "目標場館規模",      v: ["跨產業","中大型","中大型","小型工作室"] },
    ]
    return (
      <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
        <div className="max-w-3xl mx-auto space-y-6">
          <h2 className="text-xl font-bold text-gray-900">競品分析</h2>
          <div className="grid grid-cols-2 gap-3">
            {items.map(c => (
              <div key={c.name} className={`bg-white rounded-2xl p-4 shadow-sm ${c.name === "FitFlo" ? "ring-2 ring-green-400" : ""}`}>
                <div className="flex justify-between items-center mb-2">
                  <p className="font-bold text-gray-900">{c.name}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.color}`}>{c.tag}</span>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-gray-400 font-semibold uppercase tracking-wider">功能</th>
                  {["Super 8","17FIT","BookFast"].map(h => <th key={h} className="px-3 py-3 text-gray-400 font-semibold text-center">{h}</th>)}
                  <th className="px-3 py-3 text-green-600 font-bold text-center bg-green-50/40">FitFlo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map(r => (
                  <tr key={r.f} className="hover:bg-gray-50/50">
                    <td className="px-4 py-2.5 text-gray-700 font-medium">{r.f}</td>
                    {r.v.map((v, i) => (
                      <td key={i} className={`px-3 py-2.5 text-center ${v.startsWith("✓") ? "text-green-600" : v === "✗" ? "text-gray-200" : "text-gray-500"} ${i === 3 ? "bg-green-50/30 font-semibold" : ""}`}>{v}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-2">
        <p className="text-3xl">📄</p>
        <p className="text-gray-600 font-medium">{docId === "design" ? "設計規範" : "文件"}</p>
        <p className="text-sm text-gray-400">Markdown 編輯功能開發中</p>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PRDPage() {
  const [flows, setFlows] = useState<ProductFlow[]>(INITIAL_FLOWS)
  const [activeFlowId, setActiveFlowId] = useState<string | null>("onboarding")
  const [activeDocId, setActiveDocId] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null)
  const [connectMode, setConnectMode] = useState(false)
  const [connectFrom, setConnectFrom] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Set<string>>(new Set(["flows-root", "role-student"]))
  const [showAddModal, setShowAddModal] = useState(false)

  const activeFlow = flows.find(f => f.id === activeFlowId) ?? null

  function updateNode(nodeId: string, updates: Partial<ScreenNode>) {
    setFlows(prev => prev.map(f => ({
      ...f,
      screens: f.screens.map(s => s.id === nodeId ? { ...s, ...updates } : s),
    })))
  }

  function updateEdge(edgeId: string, updates: Partial<FlowEdge>) {
    setFlows(prev => prev.map(f => ({
      ...f,
      edges: f.edges.map(e => e.id === edgeId ? { ...e, ...updates } : e),
    })))
  }

  function updatePositions(updates: Record<string, { x: number; y: number }>) {
    setFlows(prev => prev.map(f => ({
      ...f,
      screens: f.screens.map(s => updates[s.id] ? { ...s, ...updates[s.id] } : s),
    })))
  }

  function addScreen(optionIdx: number) {
    if (!activeFlowId) return
    const opt = PAGE_OPTIONS[optionIdx]
    const id = createId("screen")
    const newScreen: ScreenNode = {
      id, title: opt.label, href: opt.href,
      type: opt.type, platform: opt.platform, role: opt.role,
      purpose: "點擊右側面板編輯說明",
      states: ["default"], x: 200, y: 200,
    }
    setFlows(prev => prev.map(f => f.id === activeFlowId ? { ...f, screens: [...f.screens, newScreen] } : f))
    setSelectedId(id)
    setSelectedEdgeId(null)
    setShowAddModal(false)
  }

  function deleteScreen(nodeId: string) {
    setFlows(prev => prev.map(f => ({
      ...f,
      screens: f.screens.filter(s => s.id !== nodeId),
      edges: f.edges.filter(e => e.from !== nodeId && e.to !== nodeId),
    })))
    setSelectedId(null)
    setSelectedEdgeId(null)
  }

  function deleteEdge(edgeId: string) {
    setFlows(prev => prev.map(f => ({ ...f, edges: f.edges.filter(e => e.id !== edgeId) })))
    setSelectedEdgeId(null)
  }

  function createConnection(from: string, to: string, fromSide?: ConnectionSide, toSide?: ConnectionSide) {
    if (!activeFlowId || from === to) return
    let selectedEdge = ""
    setFlows(prev => prev.map(f => {
      if (f.id !== activeFlowId) return f
      const source = f.screens.find(s => s.id === from)
      const target = f.screens.find(s => s.id === to)
      if (!source || !target) return f
      const resolvedSides = fromSide && toSide ? { fromSide, toSide } : autoSides(source, target)
      const existing = f.edges.find(e => e.from === from && e.to === to && e.fromSide === resolvedSides.fromSide && e.toSide === resolvedSides.toSide)
      if (existing) {
        selectedEdge = existing.id
        return f
      }
      const edgeId = createId("edge")
      selectedEdge = edgeId
      return { ...f, edges: [...f.edges, { id: edgeId, from, to, label: "", ...resolvedSides }] }
    }))
    setSelectedId(null)
    setSelectedEdgeId(selectedEdge)
    setConnectFrom(null)
    setConnectMode(false)
  }

  function handleConnectScreen(nodeId: string) {
    if (!connectFrom) {
      setConnectFrom(nodeId)
    } else if (connectFrom !== nodeId && activeFlowId) {
      createConnection(connectFrom, nodeId)
    } else {
      setConnectFrom(null)
      setConnectMode(false)
    }
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleNavSelect(item: NavItem) {
    if (item.type === "flow" && item.flowId) {
      setActiveFlowId(item.flowId)
      setActiveDocId(null)
      setSelectedId(null)
      setSelectedEdgeId(null)
      setConnectMode(false)
      setConnectFrom(null)
    } else if (item.type === "doc" && item.docId) {
      setActiveDocId(item.docId)
      setActiveFlowId(null)
      setSelectedId(null)
      setSelectedEdgeId(null)
      setConnectMode(false)
      setConnectFrom(null)
    }
  }

  const activeNavId = activeDocId
    ? findNavItem(TREE, item => item.docId === activeDocId)?.id ?? null
    : findNavItem(TREE, item => item.flowId === activeFlowId)?.id ?? null

  return (
    <div className="h-screen flex overflow-hidden bg-white font-sans">
      {/* Left panel */}
      <div className="w-52 shrink-0 border-r border-gray-200 flex flex-col overflow-hidden">
        {/* Project header */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 bg-[#06C755] rounded-md flex items-center justify-center">
              <span className="text-white text-[9px] font-bold">F</span>
            </div>
            <span className="text-[13px] font-semibold text-gray-900">FitFlo</span>
          </div>
          <p className="text-[11px] text-gray-400">Product Spec Tool</p>
        </div>

        {/* Nav tree */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          {TREE.map(item => (
            <NavNode key={item.id} item={item} depth={0}
              expanded={expanded} selected={activeNavId}
              onToggle={toggleExpand} onSelect={handleNavSelect} />
          ))}
        </div>
      </div>

      {/* Center */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="h-10 border-b border-gray-200 bg-white flex items-center gap-2 px-4 shrink-0">
          {activeFlow ? (
            <>
              <span className="text-[13px] font-medium text-gray-700 truncate">{activeFlow.title}</span>
              <div className="flex-1" />
              <div className="relative">
                <button onClick={() => setShowAddModal(v => !v)}
                  className="flex items-center gap-1.5 text-[12px] font-medium text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors">
                  + Add Screen
                </button>
                {showAddModal && (
                  <div className="absolute top-8 right-0 z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-52">
                    {PAGE_OPTIONS.map((opt, i) => (
                      <button key={opt.href} onClick={() => addScreen(i)}
                        className="w-full text-left px-3 py-2 text-[12px] text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ color: PLATFORM_COLOR[opt.platform], backgroundColor: PLATFORM_BG[opt.platform] }}>
                          {opt.platform}
                        </span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => { setConnectMode(v => !v); setConnectFrom(null) }}
                className={`flex items-center gap-1.5 text-[12px] font-medium border rounded-lg px-2.5 py-1 transition-colors ${
                  connectMode ? "bg-amber-50 border-amber-300 text-amber-700" : "text-gray-600 border-gray-200 hover:bg-gray-50"
                }`}>
                ↗ {connectMode ? (connectFrom ? "選擇目標…" : "選擇起點…") : "Connect"}
              </button>
              {connectMode && (
                <button onClick={() => { setConnectMode(false); setConnectFrom(null) }}
                  className="text-[11px] text-gray-400 hover:text-gray-600 px-2">✕ 取消</button>
              )}
            </>
          ) : activeDocId ? (
            <span className="text-[13px] font-medium text-gray-700">
              {activeDocId === "competitive" ? "競品分析" : "設計規範"}
            </span>
          ) : (
            <span className="text-[13px] text-gray-400">從左側選擇一個 Flow</span>
          )}
        </div>

        {/* Canvas or Doc */}
        <div className="flex-1 overflow-hidden flex">
          {activeFlow ? (
            <CanvasArea
              key={activeFlow.id}
              flow={activeFlow}
              selectedId={selectedId}
              selectedEdgeId={selectedEdgeId}
              connectMode={connectMode}
              connectFrom={connectFrom}
              onSelectScreen={id => { setSelectedId(id); setSelectedEdgeId(null); setShowAddModal(false) }}
              onSelectEdge={id => { setSelectedEdgeId(id); setSelectedId(null) }}
              onConnectScreen={handleConnectScreen}
              onCreateConnection={createConnection}
              onUpdatePositions={updatePositions}
            />
          ) : activeDocId ? (
            <DocView docId={activeDocId} />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center space-y-2">
                <p className="text-4xl">⬡</p>
                <p className="text-gray-500 font-medium">從左側選擇一個 Flow 開始</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right panel */}
      <RightPanel
        flow={activeFlow}
        selectedId={selectedId}
        selectedEdgeId={selectedEdgeId}
        onUpdate={updateNode}
        onUpdateEdge={updateEdge}
        onDeleteScreen={deleteScreen}
        onDeleteEdge={deleteEdge}
      />
    </div>
  )
}
