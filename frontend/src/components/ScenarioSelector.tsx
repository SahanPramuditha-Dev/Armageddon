import React, { useEffect } from 'react'
import { X, Layers, Skull, Shield, Crosshair, Award } from 'lucide-react'
import { useCombatStore } from '../store/combatStore'

export const ScenarioSelector: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    scenarios,
    loadScenarios,
    startScenario
  } = useCombatStore()

  useEffect(() => {
    if (activeModal === 'SCENARIOS' && scenarios.length === 0) {
      loadScenarios()
    }
  }, [activeModal, scenarios.length, loadScenarios])

  if (activeModal !== 'SCENARIOS') return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="tactical-panel w-full max-w-3xl border border-cyan-500/80 rounded-lg p-6 bg-slate-950 shadow-[0_0_30px_rgba(0,229,255,0.25)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-cyan-900 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h2 className="font-mono-tech font-bold text-base text-cyan-300">
              MISSION OPERATIONS // THEATER SELECTION
            </h2>
          </div>
          <button
            onClick={() => setActiveModal('NONE')}
            className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map(sc => {
            const isApoc = sc.threat_rating === 'APOCALYPTIC'
            const isExtreme = sc.threat_rating === 'EXTREME'

            return (
              <div
                key={sc.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-cyan-400 rounded-lg p-4 flex flex-col justify-between transition-all hover:shadow-[0_0_15px_rgba(0,229,255,0.15)]"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono-tech px-2 py-0.5 rounded bg-slate-950 text-cyan-400 border border-cyan-900">
                      {sc.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono-tech font-bold px-2 py-0.5 rounded ${
                        isApoc
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : isExtreme
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {sc.threat_rating}
                    </span>
                  </div>

                  <h3 className="font-mono-tech font-bold text-sm text-slate-100 mb-2">
                    {sc.title}
                  </h3>

                  <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                    {sc.description}
                  </p>

                  <div className="space-y-1 text-[11px] font-mono-tech text-slate-400 border-t border-slate-800 pt-2 mb-4">
                    <div>COMMAND: <span className="text-cyan-300">{sc.player_faction}</span></div>
                    <div>OPFOR: <span className="text-red-400">{sc.enemy_faction}</span></div>
                  </div>
                </div>

                <button
                  onClick={() => startScenario(sc.id)}
                  className="w-full py-2 bg-cyan-950 hover:bg-cyan-900 border border-cyan-500 text-cyan-200 rounded font-mono-tech text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.2)]"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  DEPLOY THEATER
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
