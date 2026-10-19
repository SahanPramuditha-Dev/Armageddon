import React, { useState, useEffect } from 'react'
import { Compass, Gauge, ArrowUpRight, CheckCircle2 } from 'lucide-react'
import { useCombatStore } from '../store/combatStore'

export const HelmControl: React.FC = () => {
  const { tacticalState, selectedShipId, orderManeuver } = useCombatStore()

  const selectedShip = tacticalState?.friendly_fleet.find(s => s.id === selectedShipId)

  const [headingInput, setHeadingInput] = useState<number>(0)
  const [speedInput, setSpeedInput] = useState<number>(15)

  useEffect(() => {
    if (selectedShip) {
      setHeadingInput(Math.round(selectedShip.heading))
      setSpeedInput(Math.round(selectedShip.speed))
    }
  }, [selectedShip?.id])

  if (!selectedShip) {
    return (
      <div className="tactical-panel p-4 rounded text-center text-slate-500 font-mono-tech text-xs">
        NO FRIENDLY VESSEL SELECTED
      </div>
    )
  }

  const handleApply = () => {
    orderManeuver(selectedShip.id, headingInput, speedInput)
  }

  return (
    <div className="tactical-panel p-4 rounded border border-cyan-800/60 bg-slate-950/80">
      <div className="flex items-center justify-between border-b border-cyan-900/60 pb-2 mb-3">
        <div className="flex items-center gap-2 text-cyan-300 font-mono-tech text-xs font-bold">
          <Compass className="w-4 h-4 text-cyan-400" />
          HELM & PROPULSION CONTROL
        </div>
        <div className="text-[11px] font-mono-tech text-slate-400">
          PROPULSION: <span className="text-emerald-400 font-bold">{selectedShip.subsystems.propulsion.toFixed(0)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Heading Slider & Presets */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono-tech mb-1">
            <span className="text-slate-300">ORDERED HEADING:</span>
            <span className="text-cyan-400 font-bold">{String(headingInput).padStart(3, '0')}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="359"
            value={headingInput}
            onChange={(e) => setHeadingInput(Number(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between gap-1 mt-2">
            {[0, 90, 180, 270].map((deg) => (
              <button
                key={deg}
                onClick={() => setHeadingInput(deg)}
                className="flex-1 py-0.5 text-[10px] font-mono-tech bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 rounded text-slate-300"
              >
                {deg === 0 ? '000° N' : deg === 90 ? '090° E' : deg === 180 ? '180° S' : '270° W'}
              </button>
            ))}
          </div>
        </div>

        {/* Speed Slider & Throttle Presets */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono-tech mb-1">
            <span className="text-slate-300">ORDERED SPEED:</span>
            <span className="text-cyan-400 font-bold">{speedInput} KTS</span>
          </div>
          <input
            type="range"
            min="0"
            max={Math.round(selectedShip.max_speed)}
            value={speedInput}
            onChange={(e) => setSpeedInput(Number(e.target.value))}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between gap-1 mt-2">
            {[
              { label: 'STOP', val: 0 },
              { label: '1/3', val: Math.round(selectedShip.max_speed * 0.33) },
              { label: 'STD', val: Math.round(selectedShip.max_speed * 0.66) },
              { label: 'FLANK', val: Math.round(selectedShip.max_speed) }
            ].map((p) => (
              <button
                key={p.label}
                onClick={() => setSpeedInput(p.val)}
                className="flex-1 py-0.5 text-[10px] font-mono-tech bg-slate-900 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 rounded text-slate-300"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={handleApply}
        className="mt-3 w-full py-1.5 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-200 rounded font-mono-tech text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_10px_rgba(0,229,255,0.2)]"
      >
        <ArrowUpRight className="w-3.5 h-3.5" />
        TRANSMIT HELM ORDERS
      </button>
    </div>
  )
}
