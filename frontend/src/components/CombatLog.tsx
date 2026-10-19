import React, { useState, useRef, useEffect } from 'react'
import { Terminal, Shield, AlertCircle, Flame } from 'lucide-react'
import { useCombatStore } from '../store/combatStore'
import type { CombatEvent } from '../types/combat'

export const CombatLog: React.FC = () => {
  const { tacticalState } = useCombatStore()
  const [filter, setFilter] = useState<'ALL' | 'ATTACKS' | 'THREATS' | 'DAMAGE'>('ALL')
  const scrollRef = useRef<HTMLDivElement | null>(null)

  const events = tacticalState?.recent_events || []

  const filteredEvents = events.filter(evt => {
    if (filter === 'ALL') return true
    if (filter === 'ATTACKS') return evt.event_type.includes('ATTACK')
    if (filter === 'THREATS') return evt.event_type.includes('THREAT') || evt.event_type.includes('COUNTERMEASURE')
    if (filter === 'DAMAGE') return evt.event_type.includes('VESSEL') || evt.event_type.includes('HIT')
    return true
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [events.length])

  const formatTimestamp = (ts: number) => {
    const min = Math.floor(ts / 60)
    const sec = Math.floor(ts % 60)
    return `T+${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  const getEventBadge = (evt: CombatEvent) => {
    switch (evt.event_type) {
      case 'ATTACK_LAUNCHED':
        return <span className="text-cyan-400 font-bold">[LAUNCH]</span>
      case 'ATTACK_HIT':
        return <span className="text-red-400 font-bold">[HIT]</span>
      case 'ATTACK_INTERCEPTED':
        return <span className="text-emerald-400 font-bold">[INTERCEPTED]</span>
      case 'THREAT_DETECTED':
        return <span className="text-amber-400 font-bold">[THREAT]</span>
      case 'COUNTERMEASURE_DEPLOYED':
        return <span className="text-blue-400 font-bold">[DEFENSE]</span>
      case 'VESSEL_SUNK':
        return <span className="text-red-500 font-bold bg-red-950 px-1 rounded">[SUNK]</span>
      case 'MISSION_OBJECTIVE_UPDATE':
        return <span className="text-yellow-300 font-bold">[OBJECTIVE]</span>
      default:
        return <span className="text-slate-400 font-bold">[{evt.event_type}]</span>
    }
  }

  return (
    <div className="tactical-panel p-3 rounded border border-cyan-800/60 bg-slate-950/85 flex flex-col h-[280px]">
      <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-2">
        <div className="flex items-center gap-2 text-cyan-300 font-mono-tech text-xs font-bold">
          <Terminal className="w-3.5 h-3.5 text-cyan-400" />
          COMBAT TELEMETRY STREAM
        </div>

        {/* Filter buttons */}
        <div className="flex gap-1 text-[10px] font-mono-tech">
          {(['ALL', 'ATTACKS', 'THREATS', 'DAMAGE'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2 py-0.5 rounded cursor-pointer transition-colors ${
                filter === tab
                  ? 'bg-cyan-950 border border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Log Entries */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-1.5 font-mono-tech text-xs pr-1">
        {filteredEvents.length === 0 ? (
          <div className="text-slate-600 text-[11px] italic text-center py-8">
            Awaiting telemetry feed from tactical simulation kernel...
          </div>
        ) : (
          filteredEvents.map(evt => (
            <div
              key={evt.id}
              className="p-1.5 rounded bg-slate-900/60 border border-slate-800/80 flex items-start gap-2 hover:bg-slate-900 transition-colors"
            >
              <span className="text-[10px] text-slate-500 shrink-0">
                {formatTimestamp(evt.timestamp)}
              </span>
              <div className="shrink-0">{getEventBadge(evt)}</div>
              <div className="text-slate-300 text-[11px] break-words flex-1">
                {evt.message}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
