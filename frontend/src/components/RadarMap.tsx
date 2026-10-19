import React, { useRef, useEffect, useState, useCallback } from 'react'
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Crosshair,
  Navigation,
  Shield,
  Radio,
  Compass
} from 'lucide-react'
import { useCombatStore } from '../store/combatStore'
import type { Vector2D, ShipState, SensorContact, InFlightProjectile } from '../types/combat'

export const RadarMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const {
    tacticalState,
    selectedShipId,
    targetContactId,
    targetMode,
    pendingWeaponId,
    setSelectedShipId,
    setTargetContactId,
    setTargetCoordinates,
    setTargetMode,
    orderAttack,
    orderManeuver
  } = useCombatStore()

  // Viewport transformation: scale (pixels per map unit) and offset in world units
  const [scale, setScale] = useState<number>(5.5)
  const [offset, setOffset] = useState<Vector2D>({ x: 0, y: -25 })
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [dragStart, setDragStart] = useState<Vector2D>({ x: 0, y: 0 })
  const [cursorWorldPos, setCursorWorldPos] = useState<Vector2D>({ x: 0, y: 0 })

  // Radar sweep animation angle
  const sweepAngleRef = useRef<number>(0)

  // Convert canvas screen coords to world map coords
  const screenToWorld = useCallback((screenX: number, screenY: number, width: number, height: number): Vector2D => {
    const cx = width / 2
    const cy = height / 2
    return {
      x: (screenX - cx) / scale + offset.x,
      y: -(screenY - cy) / scale + offset.y
    }
  }, [scale, offset])

  // Convert world map coords to canvas screen coords
  const worldToScreen = useCallback((wx: number, wy: number, width: number, height: number) => {
    const cx = width / 2
    const cy = height / 2
    return {
      x: cx + (wx - offset.x) * scale,
      y: cy - (wy - offset.y) * scale
    }
  }, [scale, offset])

  // Mouse move handler
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top

    if (isDragging) {
      const dx = (sx - dragStart.x) / scale
      const dy = -(sy - dragStart.y) / scale
      setOffset(prev => ({ x: prev.x - dx, y: prev.y - dy }))
      setDragStart({ x: sx, y: sy })
    }

    const world = screenToWorld(sx, sy, canvas.width, canvas.height)
    setCursorWorldPos(world)
    if (targetMode !== 'NONE') {
      setTargetCoordinates(world)
    }
  }

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsDragging(true)
      const rect = e.currentTarget.getBoundingClientRect()
      setDragStart({ x: e.clientX - rect.left, y: e.clientY - rect.top })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
    setScale(prev => Math.min(25, Math.max(1.8, prev * zoomFactor)))
  }

  // Handle map click for selection, targeting, or maneuvering
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || !tacticalState) return
    const rect = canvas.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const clickedWorld = screenToWorld(sx, sy, canvas.width, canvas.height)

    // Check if clicked close to a friendly vessel
    const clickedFriendly = tacticalState.friendly_fleet.find(ship => {
      const dist = Math.hypot(ship.position.x - clickedWorld.x, ship.position.y - clickedWorld.y)
      return dist < (18 / scale)
    })

    // Check if clicked close to a sensor contact
    const clickedContact = tacticalState.sensor_contacts.find(contact => {
      const dist = Math.hypot(contact.estimated_position.x - clickedWorld.x, contact.estimated_position.y - clickedWorld.y)
      return dist < Math.max(contact.confidence_radius, 20 / scale)
    })

    if (targetMode === 'ATTACK') {
      if (selectedShipId && pendingWeaponId) {
        orderAttack(
          selectedShipId,
          pendingWeaponId,
          clickedWorld,
          clickedContact?.id
        )
      }
      setTargetMode('NONE')
      return
    }

    if (targetMode === 'WAYPOINT') {
      if (selectedShipId) {
        const selectedShip = tacticalState.friendly_fleet.find(s => s.id === selectedShipId)
        if (selectedShip) {
          const dx = clickedWorld.x - selectedShip.position.x
          const dy = clickedWorld.y - selectedShip.position.y
          // Convert cartesian to bearing (0 is North/Y, 90 is East/X)
          let bearing = (Math.atan2(dx, dy) * 180) / Math.PI
          if (bearing < 0) bearing += 360
          orderManeuver(selectedShipId, bearing, selectedShip.speed || 15)
        }
      }
      setTargetMode('NONE')
      return
    }

    // Default selection mode
    if (clickedFriendly) {
      setSelectedShipId(clickedFriendly.id)
    } else if (clickedContact) {
      setTargetContactId(clickedContact.id)
    } else {
      // Deselect target contact if clicked into empty water
      setTargetContactId(null)
    }
  }

  // Canvas render loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationFrameId: number

    const render = () => {
      sweepAngleRef.current = (sweepAngleRef.current + 0.02) % (Math.PI * 2)

      const width = canvas.width
      const height = canvas.height
      const cx = width / 2
      const cy = height / 2

      ctx.clearRect(0, 0, width, height)

      // Background: Deep ocean tactical dark
      ctx.fillStyle = '#050913'
      ctx.fillRect(0, 0, width, height)

      // Draw Grid Lines (every 20 nmi)
      const gridSize = 20
      const startX = Math.floor((offset.x - (cx / scale)) / gridSize) * gridSize
      const endX = Math.ceil((offset.x + (cx / scale)) / gridSize) * gridSize
      const startY = Math.floor((offset.y - (cy / scale)) / gridSize) * gridSize
      const endY = Math.ceil((offset.y + (cy / scale)) / gridSize) * gridSize

      ctx.strokeStyle = 'rgba(14, 116, 144, 0.12)'
      ctx.lineWidth = 1

      for (let gx = startX; gx <= endX; gx += gridSize) {
        const p1 = worldToScreen(gx, startY, width, height)
        const p2 = worldToScreen(gx, endY, width, height)
        ctx.beginPath()
        ctx.moveTo(p1.x, 0)
        ctx.lineTo(p1.x, height)
        ctx.stroke()
      }

      for (let gy = startY; gy <= endY; gy += gridSize) {
        const p = worldToScreen(0, gy, width, height)
        ctx.beginPath()
        ctx.moveTo(0, p.y)
        ctx.lineTo(width, p.y)
        ctx.stroke()
      }

      // Draw Concentric Range Rings from Map Origin (0,0)
      const rangeRings = [10, 25, 50, 75, 100]
      const originScreen = worldToScreen(0, 0, width, height)

      rangeRings.forEach(radius => {
        const screenRadius = radius * scale
        ctx.beginPath()
        ctx.arc(originScreen.x, originScreen.y, screenRadius, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(14, 116, 144, 0.22)'
        ctx.setLineDash([4, 6])
        ctx.stroke()
        ctx.setLineDash([])

        // Distance text badge
        ctx.fillStyle = 'rgba(0, 229, 255, 0.4)'
        ctx.font = '10px monospace'
        ctx.fillText(`${radius} NMI`, originScreen.x + 6, originScreen.y - screenRadius + 12)
      })

      // Rotating Radar Sweep Line
      const sweepLen = Math.max(width, height)
      ctx.beginPath()
      ctx.moveTo(originScreen.x, originScreen.y)
      ctx.lineTo(
        originScreen.x + Math.cos(sweepAngleRef.current) * sweepLen,
        originScreen.y + Math.sin(sweepAngleRef.current) * sweepLen
      )
      const sweepGrad = ctx.createLinearGradient(
        originScreen.x,
        originScreen.y,
        originScreen.x + Math.cos(sweepAngleRef.current) * sweepLen,
        originScreen.y + Math.sin(sweepAngleRef.current) * sweepLen
      )
      sweepGrad.addColorStop(0, 'rgba(0, 229, 255, 0.35)')
      sweepGrad.addColorStop(1, 'rgba(0, 229, 255, 0.0)')
      ctx.strokeStyle = sweepGrad
      ctx.lineWidth = 2
      ctx.stroke()

      if (tacticalState) {
        // Draw Active Decoys & Electronic Jamming Fields
        tacticalState.active_decoys?.forEach((decoy: any) => {
          const pos = decoy.position || { x: 0, y: 0 }
          const p = worldToScreen(pos.x, pos.y, width, height)
          ctx.beginPath()
          ctx.arc(p.x, p.y, (decoy.radius || 15) * scale, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(0, 229, 255, 0.06)'
          ctx.fill()
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.35)'
          ctx.setLineDash([2, 4])
          ctx.stroke()
          ctx.setLineDash([])
          ctx.fillStyle = 'rgba(0, 229, 255, 0.7)'
          ctx.font = '9px monospace'
          ctx.fillText(`[DECOY: ${decoy.type || 'CHAFF'}]`, p.x + 8, p.y - 8)
        })

        // Draw Sensor Contacts (Fog of war & Unknowns)
        tacticalState.sensor_contacts.forEach(contact => {
          const p = worldToScreen(contact.estimated_position.x, contact.estimated_position.y, width, height)
          const confRadius = Math.max(6, contact.confidence_radius * scale)

          const isTargeted = contact.id === targetContactId
          const isAlien = contact.apparent_faction === 'THE_HARVESTERS'

          // Confidence circle / Fog-of-war uncertainty bubble
          ctx.beginPath()
          ctx.arc(p.x, p.y, confRadius, 0, Math.PI * 2)
          ctx.fillStyle = isAlien ? 'rgba(255, 59, 48, 0.08)' : 'rgba(255, 179, 0, 0.08)'
          ctx.fill()
          ctx.strokeStyle = isAlien ? 'rgba(255, 59, 48, 0.45)' : 'rgba(255, 179, 0, 0.45)'
          ctx.lineWidth = 1
          ctx.stroke()

          // Contact Diamond Marker
          const size = 7
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(Math.PI / 4)
          ctx.fillStyle = isAlien ? '#ff3b30' : '#ffb300'
          ctx.fillRect(-size, -size, size * 2, size * 2)
          ctx.restore()

          // Label
          ctx.fillStyle = isAlien ? '#ff857f' : '#ffe082'
          ctx.font = '10px monospace'
          const label = contact.apparent_type || 'UNIDENTIFIED'
          ctx.fillText(`${label} [${(contact.confidence_level * 100).toFixed(0)}%]`, p.x + 12, p.y - 4)

          // If targeted, draw combat lock-on reticle
          if (isTargeted) {
            ctx.strokeStyle = '#ff3b30'
            ctx.lineWidth = 2
            const r = confRadius + 8
            ctx.beginPath()
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
            ctx.stroke()

            // Corner brackets
            ctx.beginPath()
            ctx.moveTo(p.x - r - 6, p.y)
            ctx.lineTo(p.x - r, p.y)
            ctx.moveTo(p.x + r, p.y)
            ctx.lineTo(p.x + r + 6, p.y)
            ctx.moveTo(p.x, p.y - r - 6)
            ctx.lineTo(p.x, p.y - r)
            ctx.moveTo(p.x, p.y + r)
            ctx.lineTo(p.x, p.y + r + 6)
            ctx.stroke()
          }
        })

        // Draw In-Flight Projectiles with Trajectory Trails
        tacticalState.projectiles.forEach(proj => {
          if (proj.resolved) return

          const curr = worldToScreen(proj.current_position.x, proj.current_position.y, width, height)
          const orig = worldToScreen(proj.origin.x, proj.origin.y, width, height)

          // Draw tracer line from origin to current position
          ctx.beginPath()
          ctx.moveTo(orig.x, orig.y)
          ctx.lineTo(curr.x, curr.y)

          if (proj.weapon_type === 'NAVAL_GUN_RAILGUN') {
            ctx.strokeStyle = 'rgba(0, 229, 255, 0.75)'
            ctx.lineWidth = 2
          } else if (proj.weapon_type === 'CRUISE_MISSILE' || proj.weapon_type === 'ANTI_SHIP_BALLISTIC') {
            ctx.strokeStyle = 'rgba(255, 179, 0, 0.8)'
            ctx.lineWidth = 2.5
          } else if (proj.weapon_type === 'HEAVY_TORPEDO') {
            ctx.strokeStyle = 'rgba(14, 165, 233, 0.7)'
            ctx.setLineDash([4, 4])
            ctx.lineWidth = 2
          } else if (proj.weapon_type === 'ALIEN_PLASMA_LANCE') {
            ctx.strokeStyle = 'rgba(217, 70, 239, 0.9)'
            ctx.lineWidth = 3
          } else {
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
            ctx.lineWidth = 2
          }
          ctx.stroke()
          ctx.setLineDash([])

          // Glowing Projectile Head
          ctx.beginPath()
          ctx.arc(curr.x, curr.y, 4, 0, Math.PI * 2)
          ctx.fillStyle = proj.weapon_type.startsWith('ALIEN') ? '#f43f5e' : '#00e5ff'
          ctx.shadowBlur = 8
          ctx.shadowColor = ctx.fillStyle
          ctx.fill()
          ctx.shadowBlur = 0
        })

        // Draw Friendly Fleet Ships
        tacticalState.friendly_fleet.forEach(ship => {
          const p = worldToScreen(ship.position.x, ship.position.y, width, height)
          const isSelected = ship.id === selectedShipId

          // Velocity vector
          const headingRad = (ship.heading * Math.PI) / 180
          const velLen = Math.max(10, ship.speed * 1.5)
          const vx = p.x + Math.sin(headingRad) * velLen
          const vy = p.y - Math.cos(headingRad) * velLen

          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(vx, vy)
          ctx.strokeStyle = 'rgba(0, 229, 255, 0.8)'
          ctx.lineWidth = 1.5
          ctx.stroke()

          // Ship icon / chevron
          ctx.save()
          ctx.translate(p.x, p.y)
          ctx.rotate(headingRad)

          // Hull body
          ctx.beginPath()
          ctx.moveTo(0, -10)
          ctx.lineTo(6, 8)
          ctx.lineTo(0, 5)
          ctx.lineTo(-6, 8)
          ctx.closePath()

          ctx.fillStyle = ship.damage_state === 'OPERATIONAL' ? '#00e5ff' : ship.damage_state === 'DAMAGED' ? '#f59e0b' : '#ef4444'
          ctx.fill()
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 1
          ctx.stroke()
          ctx.restore()

          // Health / Hull integrity ring
          const healthRatio = Math.max(0, ship.subsystems.hull / ship.max_hull)
          ctx.beginPath()
          ctx.arc(p.x, p.y, 14, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * healthRatio)
          ctx.strokeStyle = healthRatio > 0.5 ? '#10b981' : healthRatio > 0.25 ? '#f59e0b' : '#ef4444'
          ctx.lineWidth = 2
          ctx.stroke()

          // Ship Label
          ctx.fillStyle = '#e2e8f0'
          ctx.font = '10px monospace'
          ctx.fillText(ship.name, p.x + 16, p.y - 2)
          ctx.fillStyle = '#94a3b8'
          ctx.font = '9px monospace'
          ctx.fillText(`${ship.speed.toFixed(0)} kts | HDG ${ship.heading.toFixed(0)}°`, p.x + 16, p.y + 10)

          // Selection Ring
          if (isSelected) {
            ctx.beginPath()
            ctx.arc(p.x, p.y, 22, 0, Math.PI * 2)
            ctx.strokeStyle = '#00e5ff'
            ctx.lineWidth = 2
            ctx.setLineDash([4, 4])
            ctx.stroke()
            ctx.setLineDash([])
          }
        })
      }

      // Cursor Coordinates & Targeting Reticle overlay
      if (targetMode !== 'NONE') {
        const cScreen = worldToScreen(cursorWorldPos.x, cursorWorldPos.y, width, height)
        ctx.strokeStyle = targetMode === 'ATTACK' ? '#ff3b30' : '#00e5ff'
        ctx.lineWidth = 1.5

        ctx.beginPath()
        ctx.arc(cScreen.x, cScreen.y, 16, 0, Math.PI * 2)
        ctx.moveTo(cScreen.x - 24, cScreen.y)
        ctx.lineTo(cScreen.x + 24, cScreen.y)
        ctx.moveTo(cScreen.x, cScreen.y - 24)
        ctx.lineTo(cScreen.x, cScreen.y + 24)
        ctx.stroke()
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [tacticalState, selectedShipId, targetContactId, targetMode, offset, scale, cursorWorldPos, worldToScreen, screenToWorld])

  // Handle Canvas Resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        canvasRef.current.width = containerRef.current.clientWidth
        canvasRef.current.height = containerRef.current.clientHeight
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div ref={containerRef} className="relative w-full h-full min-h-[460px] bg-slate-950 overflow-hidden select-none border border-cyan-900/60 rounded">
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleCanvasClick}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Floating Tactical Overlay Controls */}
      <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
        <button
          onClick={() => setScale(prev => Math.min(25, prev * 1.25))}
          className="p-2 bg-slate-900/90 hover:bg-cyan-950 border border-cyan-700/60 text-cyan-400 rounded transition-colors shadow-md"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setScale(prev => Math.max(1.8, prev * 0.8))}
          className="p-2 bg-slate-900/90 hover:bg-cyan-950 border border-cyan-700/60 text-cyan-400 rounded transition-colors shadow-md"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setScale(5.5)
            setOffset({ x: 0, y: -25 })
          }}
          className="p-2 bg-slate-900/90 hover:bg-cyan-950 border border-cyan-700/60 text-cyan-400 rounded transition-colors shadow-md"
          title="Reset Tactical Center"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mode Toggles */}
      <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
        <button
          onClick={() => setTargetMode(targetMode === 'WAYPOINT' ? 'NONE' : 'WAYPOINT')}
          className={`px-3 py-1.5 rounded border text-xs font-mono-tech flex items-center gap-1.5 transition-all shadow-md ${
            targetMode === 'WAYPOINT'
              ? 'bg-cyan-500 text-slate-950 border-cyan-300 font-bold'
              : 'bg-slate-900/90 border-cyan-800 text-cyan-300 hover:border-cyan-400'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          SET WAYPOINT
        </button>
      </div>

      {/* Bottom Coordinates & Scale Bar */}
      <div className="absolute bottom-3 left-3 bg-slate-950/85 border border-slate-800 rounded px-2.5 py-1 text-[11px] font-mono-tech text-slate-400 z-10 flex items-center gap-3">
        <div>
          GRID: <span className="text-cyan-300">X: {cursorWorldPos.x.toFixed(1)} NMI, Y: {cursorWorldPos.y.toFixed(1)} NMI</span>
        </div>
        <div className="h-2.5 w-[1px] bg-slate-700" />
        <div>
          ZOOM: <span className="text-slate-300">{scale.toFixed(1)}x</span>
        </div>
      </div>
    </div>
  )
}
