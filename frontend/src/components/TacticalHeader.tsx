import React from 'react'
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Radio,
  Crosshair,
  Compass,
  Anchor,
  Layers
} from 'lucide-react'
import { useCombatStore } from '../store/combatStore'

export const TacticalHeader: React.FC = () => {
  const {
    matchId,
    connectionStatus,
    tacticalState,
    isMuted,
    toggleAudio,
    targetMode,
    setTargetMode,
    setActiveModal,
    activeThreatWarning
  } = useCombatStore()

  const simTime = tacticalState?.simulation_time ?? 0
  const minutes = Math.floor(simTime / 60)
  const seconds = Math.floor(simTime % 60)
  const timeFormatted = `T+ ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  return (
    <header className="tactical-panel border-b border-cyan-800/60 px-4 py-2 flex flex-wrap items-center justify-between gap-3 text-sm z-30 select-none">
      {/* Brand & Project Identity */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded border border-cyan-400 bg-cyan-950/80 flex items-center justify-center text-cyan-400 font-bold text-base shadow-[0_0_12px_rgba(0,229,255,0.4)]">
          ⚓
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono-tech tracking-wider text-cyan-300 font-bold text-base">
              ARMAGEDDON
            </span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-700/60 text-cyan-400 font-mono-tech">
              TACTICAL KERNEL v3.4
            </span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono-tech">
            SECTOR DEFENSE & GLOBAL MARITIME THEATER
          </div>
        </div>
      </div>

      {/* Target Mode Active Warning */}
      {targetMode !== 'NONE' && (
        <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/90 border border-amber-500 text-amber-300 rounded text-xs animate-pulse">
          <Crosshair className="w-4 h-4" />
          <span className="font-mono-tech font-bold">
            {targetMode === 'ATTACK' ? 'FIRE CONTROL: DESIGNATE TARGET ON RADAR' : 'NAVIGATION: SELECT WAYPOINT ON RADAR'}
          </span>
          <button
            onClick={() => setTargetMode('NONE')}
            className="ml-2 text-[10px] bg-amber-900 hover:bg-amber-800 px-1.5 py-0.5 rounded text-white"
          >
            CANCEL
          </button>
        </div>
      )}

      {/* Center Telemetry & Clock */}
      <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800 rounded px-3 py-1 font-mono-tech text-xs">
        <div className="flex items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${
              connectionStatus === 'CONNECTED'
                ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]'
                : connectionStatus === 'CONNECTING'
                ? 'bg-amber-400 animate-ping'
                : 'bg-red-500'
            }`}
          />
          <span className="text-slate-300">{connectionStatus}</span>
        </div>

        <div className="h-3 w-[1px] bg-slate-700" />

        <div className="text-cyan-400 font-bold">{timeFormatted}</div>

        <div className="h-3 w-[1px] bg-slate-700" />

        <div className="text-slate-400">
          MATCH: <span className="text-slate-200">{matchId}</span>
        </div>
      </div>

      {/* Controls & Modals */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setActiveModal('SCENARIOS')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-700/50 hover:border-cyan-400 text-cyan-300 text-xs font-mono-tech transition-all cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          title="Select combat scenario or campaign"
        >
          <Layers className="w-3.5 h-3.5" />
          MISSIONS
        </button>

        <button
          onClick={() => setActiveModal('HARBOR')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-cyan-950 border border-cyan-700/50 hover:border-cyan-400 text-cyan-300 text-xs font-mono-tech transition-all cursor-pointer shadow-[0_0_10px_rgba(0,0,0,0.5)]"
          title="Fleet Drydock loadout builder"
        >
          <Anchor className="w-3.5 h-3.5" />
          DRYDOCK
        </button>

        <button
          onClick={toggleAudio}
          className={`p-1.5 rounded border transition-colors cursor-pointer ${
            isMuted
              ? 'bg-red-950/60 border-red-800 text-red-400 hover:bg-red-900'
              : 'bg-slate-900 border-slate-700 text-cyan-400 hover:border-cyan-400'
          }`}
          title={isMuted ? 'Tactical Audio Muted' : 'Tactical Audio Active'}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </header>
  )
}
