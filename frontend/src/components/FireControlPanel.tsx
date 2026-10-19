import React from 'react'
import {
  Crosshair,
  Shield,
  Zap,
  Flame,
  AlertTriangle,
  Target,
  Wrench,
  Activity
} from 'lucide-react'
import { useCombatStore } from '../store/combatStore'
import type { WeaponMount, CountermeasureMount } from '../types/combat'

export const FireControlPanel: React.FC = () => {
  const {
    tacticalState,
    selectedShipId,
    targetContactId,
    targetMode,
    pendingWeaponId,
    setTargetMode,
    orderAttack,
    orderCountermeasure
  } = useCombatStore()

  const selectedShip = tacticalState?.friendly_fleet.find(s => s.id === selectedShipId)
  const targetContact = tacticalState?.sensor_contacts.find(c => c.id === targetContactId)

  if (!selectedShip) {
    return (
      <div className="tactical-panel p-4 rounded text-center text-slate-500 font-mono-tech text-xs">
        NO COMBAT VESSEL SELECTED
      </div>
    )
  }

  // Calculate distance to target contact if present
  let targetDistance = 0
  if (targetContact) {
    targetDistance = Math.hypot(
      targetContact.estimated_position.x - selectedShip.position.x,
      targetContact.estimated_position.y - selectedShip.position.y
    )
  }

  const handleWeaponClick = (weapon: WeaponMount) => {
    if (weapon.ammo_remaining <= 0 || weapon.current_cooldown > 0) return

    if (targetContact) {
      // Direct attack order against target contact
      orderAttack(
        selectedShip.id,
        weapon.id,
        targetContact.estimated_position,
        targetContact.id
      )
    } else {
      // Enter targeting mode to click anywhere on radar
      setTargetMode('ATTACK', weapon.id)
    }
  }

  return (
    <div className="tactical-panel p-4 rounded border border-cyan-800/60 bg-slate-950/80 flex flex-col gap-4">
      {/* Vessel Header & Status */}
      <div className="border-b border-cyan-900/60 pb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tech font-bold text-sm text-cyan-300">
              {selectedShip.name}
            </span>
            <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono-tech">
              {selectedShip.ship_type}
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono-tech mt-0.5">
            POS: ({selectedShip.position.x.toFixed(1)}, {selectedShip.position.y.toFixed(1)}) | SPEED: {selectedShip.speed.toFixed(0)} KTS
          </div>
        </div>

        {/* Damage State Badge */}
        <div
          className={`px-2.5 py-1 rounded text-xs font-mono-tech font-bold border ${
            selectedShip.damage_state === 'OPERATIONAL'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-400'
              : selectedShip.damage_state === 'DAMAGED'
              ? 'bg-amber-950/80 border-amber-500 text-amber-400'
              : selectedShip.damage_state === 'CRITICAL'
              ? 'bg-orange-950/80 border-orange-500 text-orange-400'
              : 'bg-red-950/80 border-red-500 text-red-400 animate-pulse'
          }`}
        >
          {selectedShip.damage_state}
        </div>
      </div>

      {/* Subsystem Health Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono-tech text-[11px]">
        {[
          { label: 'HULL', val: selectedShip.subsystems.hull, max: selectedShip.max_hull },
          { label: 'ENGINE', val: selectedShip.subsystems.propulsion, max: 100 },
          { label: 'RADAR', val: selectedShip.subsystems.radar, max: 100 },
          { label: 'FCS', val: selectedShip.subsystems.fire_control, max: 100 },
          { label: 'CM LAUNCH', val: selectedShip.subsystems.countermeasure_launcher, max: 100 }
        ].map(sub => {
          const pct = Math.max(0, Math.min(100, (sub.val / sub.max) * 100))
          return (
            <div key={sub.label} className="bg-slate-900/90 border border-slate-800 rounded p-1.5">
              <div className="flex justify-between text-slate-400 mb-1">
                <span>{sub.label}</span>
                <span className={pct > 50 ? 'text-cyan-300' : pct > 20 ? 'text-amber-400' : 'text-red-400'}>
                  {pct.toFixed(0)}%
                </span>
              </div>
              <div className="w-full bg-slate-800 h-1 rounded overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    pct > 50 ? 'bg-cyan-400' : pct > 20 ? 'bg-amber-400' : 'bg-red-500'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Target Acquisition Status Bar */}
      <div className="bg-slate-900/80 border border-cyan-900/50 rounded p-2.5 flex items-center justify-between text-xs font-mono-tech">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-cyan-400" />
          <span className="text-slate-400">DESIGNATED TARGET:</span>
          {targetContact ? (
            <span className="text-amber-300 font-bold">
              {targetContact.apparent_type || 'UNIDENTIFIED'} ({targetDistance.toFixed(1)} NMI)
            </span>
          ) : (
            <span className="text-slate-500 italic">None (click radar contact or map)</span>
          )}
        </div>
        {targetContact && (
          <span className="text-[11px] text-emerald-400 font-mono-tech">LOCKED</span>
        )}
      </div>

      {/* Weapon Arsenal */}
      <div>
        <div className="text-xs font-mono-tech text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5" />
          OFFENSIVE BATTERY
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {selectedShip.weapons.map(weapon => {
            const isReady = weapon.ammo_remaining > 0 && weapon.current_cooldown <= 0
            const inRange = targetContact ? targetDistance <= weapon.max_range && targetDistance >= weapon.min_range : true
            const isPending = pendingWeaponId === weapon.id

            return (
              <div
                key={weapon.id}
                className={`p-2.5 rounded border transition-all ${
                  isPending
                    ? 'bg-amber-950/70 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                    : isReady
                    ? 'bg-slate-900/90 border-cyan-800/60 hover:border-cyan-400'
                    : 'bg-slate-950/80 border-slate-800 opacity-60'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <div className="font-mono-tech font-bold text-xs text-slate-200">
                      {weapon.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono-tech">
                      TYPE: {weapon.weapon_type} | DMG: {weapon.damage}
                    </div>
                  </div>
                  <div className="text-right font-mono-tech text-[11px]">
                    <span className={weapon.ammo_remaining > 0 ? 'text-cyan-300' : 'text-red-400 font-bold'}>
                      {weapon.ammo_remaining}
                    </span>
                    <span className="text-slate-500">/{weapon.max_ammo}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono-tech mt-2">
                  <span>RANGE: {weapon.min_range}-{weapon.max_range} NMI</span>
                  <span>VEL: {weapon.projectile_speed} KTS</span>
                </div>

                {weapon.current_cooldown > 0 && (
                  <div className="mt-1.5 text-[10px] text-amber-400 font-mono-tech">
                    RELOAD: {weapon.current_cooldown.toFixed(1)}s
                  </div>
                )}

                <button
                  disabled={!isReady}
                  onClick={() => handleWeaponClick(weapon)}
                  className={`mt-2 w-full py-1 rounded text-xs font-mono-tech font-bold transition-all cursor-pointer ${
                    isPending
                      ? 'bg-amber-500 text-slate-950 animate-pulse'
                      : isReady && inRange
                      ? 'bg-cyan-950 hover:bg-cyan-800 text-cyan-200 border border-cyan-500'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  }`}
                >
                  {isPending
                    ? 'SELECT TARGET ON RADAR'
                    : targetContact
                    ? `FIRE AT TARGET [${targetDistance.toFixed(1)} NMI]`
                    : 'TARGET & FIRE'}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Defensive Countermeasures */}
      <div>
        <div className="text-xs font-mono-tech text-cyan-400 font-bold mb-2 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" />
          ACTIVE DEFENSES & COUNTERMEASURES
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {selectedShip.countermeasures.map(cm => {
            const isReady = cm.charges_remaining > 0 && cm.current_cooldown <= 0
            return (
              <div
                key={cm.id}
                className="bg-slate-900/90 border border-slate-800 rounded p-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between text-xs font-mono-tech mb-1">
                    <span className="text-slate-300 font-bold truncate">{cm.name}</span>
                    <span className="text-cyan-400">{cm.charges_remaining}/{cm.max_charges}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono-tech">
                    EFF: {(cm.effectiveness * 100).toFixed(0)}%
                  </div>
                </div>

                <button
                  disabled={!isReady}
                  onClick={() => orderCountermeasure(selectedShip.id, cm.id)}
                  className={`mt-2 py-1 rounded text-[11px] font-mono-tech font-bold transition-colors cursor-pointer ${
                    isReady
                      ? 'bg-cyan-950 hover:bg-cyan-800 text-cyan-200 border border-cyan-600'
                      : 'bg-slate-950 text-slate-600 cursor-not-allowed border border-slate-800'
                  }`}
                >
                  {cm.current_cooldown > 0 ? `RECHARGE ${cm.current_cooldown.toFixed(1)}s` : 'DEPLOY'}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
