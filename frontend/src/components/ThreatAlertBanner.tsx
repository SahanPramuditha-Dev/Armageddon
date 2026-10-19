import React from 'react'
import { ShieldAlert, Zap, Radio } from 'lucide-react'
import { useCombatStore } from '../store/combatStore'

export const ThreatAlertBanner: React.FC = () => {
  const { tacticalState, orderCountermeasure } = useCombatStore()

  if (!tacticalState) return null

  const friendlyFleet = tacticalState.friendly_fleet || []
  const friendlyMap = new Map(friendlyFleet.map(s => [s.id, s]))

  // Find incoming hostile projectiles targeted at friendly ships
  const threats = (tacticalState.projectiles || []).filter(
    p => !p.resolved && !p.intercepted && p.target_ship_id && friendlyMap.has(p.target_ship_id)
  )

  if (threats.length === 0) return null

  const primaryThreat = threats[0]
  const targetShip = friendlyMap.get(primaryThreat.target_ship_id!)

  const availableCMs = targetShip?.countermeasures.filter(
    cm => cm.charges_remaining > 0 && cm.current_cooldown <= 0
  ) || []

  return (
    <div className="tactical-panel-alert p-3 mb-2 rounded border border-red-500/80 bg-red-950/90 text-red-100 flex flex-wrap items-center justify-between gap-3 animate-threat-pulse shadow-[0_0_20px_rgba(255,59,48,0.4)] z-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-red-900 rounded border border-red-400">
          <ShieldAlert className="w-5 h-5 text-red-300 animate-spin" style={{ animationDuration: '4s' }} />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tech font-bold text-red-200 tracking-wider text-sm">
              🚨 THREAT WARNING: INBOUND {primaryThreat.weapon_type}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-red-900 text-red-200 font-mono-tech">
              TRAJECTORY: {primaryThreat.trajectory_type.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-red-300 font-mono-tech">
            TARGET: <span className="font-bold text-white">{targetShip?.name}</span> | SPEED: {primaryThreat.speed} kts
          </div>
        </div>
      </div>

      {/* Quick Defensive Reaction Triggers */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-red-300 font-mono-tech hidden sm:inline">DEFENSIVE WINDOW:</span>
        {availableCMs.length > 0 ? (
          availableCMs.map(cm => (
            <button
              key={cm.id}
              onClick={() => targetShip && orderCountermeasure(targetShip.id, cm.id)}
              className="px-2.5 py-1.5 bg-red-800 hover:bg-red-700 active:bg-red-900 border border-red-400 text-white rounded text-xs font-mono-tech font-bold cursor-pointer transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              DEPLOY {cm.name.split(' ')[0]} ({cm.charges_remaining})
            </button>
          ))
        ) : (
          <span className="text-xs text-red-300 font-mono-tech bg-red-950 px-2 py-1 rounded border border-red-800">
            ALL COUNTERMEASURES ON RECHARGE
          </span>
        )}
      </div>
    </div>
  )
}
