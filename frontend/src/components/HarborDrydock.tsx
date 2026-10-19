import React, { useState, useEffect } from 'react'
import { X, Anchor, Plus, Trash2, CheckCircle2, AlertTriangle, Shield, Crosshair } from 'lucide-react'
import { useCombatStore } from '../store/combatStore'
import { validateFleetConfig } from '../services/api'
import type { ShipDraft, FleetDraftConfig, FleetValidationResult, ShipType } from '../types/combat'

export const HarborDrydock: React.FC = () => {
  const {
    activeModal,
    setActiveModal,
    harborCatalog,
    loadHarborCatalog,
    startScenario
  } = useCombatStore()

  const [fleetDrafts, setFleetDrafts] = useState<ShipDraft[]>([
    {
      ship_type: 'DESTROYER',
      custom_name: 'USS Prometheus (DDG-127)',
      equipped_weapon_ids: ['railgun_mark1', 'tomahawk_asm'],
      equipped_countermeasure_ids: ['phalanx_ciws', 'chaff_launcher']
    },
    {
      ship_type: 'CRUISER',
      custom_name: 'USS Vindicator (CG-74)',
      equipped_weapon_ids: ['railgun_mark1', 'tomahawk_asm', 'ballistic_strike'],
      equipped_countermeasure_ids: ['phalanx_ciws', 'an_slq32_ecm']
    }
  ])

  const [validation, setValidation] = useState<FleetValidationResult | null>(null)
  const [isValidating, setIsValidating] = useState<boolean>(false)

  useEffect(() => {
    if (activeModal === 'HARBOR' && !harborCatalog) {
      loadHarborCatalog()
    }
  }, [activeModal, harborCatalog, loadHarborCatalog])

  const handleValidate = async () => {
    setIsValidating(true)
    try {
      const config: FleetDraftConfig = {
        faction: 'PACIFIC_FLEET',
        total_budget_credits: 50000,
        ships: fleetDrafts
      }
      const res = await validateFleetConfig(config)
      setValidation(res)
    } catch (e) {
      setValidation({
        is_valid: false,
        total_cost: 0,
        remaining_budget: 0,
        errors: [e instanceof Error ? e.message : String(e)]
      })
    } finally {
      setIsValidating(false)
    }
  }

  const handleAddShip = (type: ShipType) => {
    const template = harborCatalog?.ship_templates[type]
    if (!template) return
    const newShip: ShipDraft = {
      ship_type: type,
      custom_name: `USS Sector Vanguard (${type})`,
      equipped_weapon_ids: template.allowed_weapon_types.slice(0, template.max_weapon_slots).map(() => 'railgun_mark1'),
      equipped_countermeasure_ids: ['phalanx_ciws']
    }
    setFleetDrafts(prev => [...prev, newShip])
    setValidation(null)
  }

  const handleRemoveShip = (idx: number) => {
    setFleetDrafts(prev => prev.filter((_, i) => i !== idx))
    setValidation(null)
  }

  const handleDeploy = async () => {
    const config: FleetDraftConfig = {
      faction: 'PACIFIC_FLEET',
      total_budget_credits: 50000,
      ships: fleetDrafts
    }
    await startScenario('SCENARIO_A', 'PACIFIC_FLEET', config)
  }

  if (activeModal !== 'HARBOR') return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="tactical-panel w-full max-w-4xl border border-cyan-500/80 rounded-lg p-6 bg-slate-950 shadow-[0_0_30px_rgba(0,229,255,0.25)] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-cyan-900 pb-3 mb-4">
          <div className="flex items-center gap-2.5">
            <Anchor className="w-5 h-5 text-cyan-400" />
            <h2 className="font-mono-tech font-bold text-base text-cyan-300">
              NAVAL DRYDOCK // FLEET ARCHITECT & ARMAMENT WORKSHOP
            </h2>
          </div>
          <button
            onClick={() => setActiveModal('NONE')}
            className="p-1 rounded hover:bg-slate-900 text-slate-400 hover:text-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hull Addition Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 border border-slate-800 rounded p-3 mb-4">
          <div className="text-xs font-mono-tech text-slate-300">
            COMMISSION NEW HULL:
          </div>
          <div className="flex flex-wrap gap-2">
            {(['DESTROYER', 'CRUISER', 'SUBMARINE', 'CARRIER'] as ShipType[]).map(type => (
              <button
                key={type}
                onClick={() => handleAddShip(type)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-cyan-950 border border-slate-700 hover:border-cyan-500 rounded text-xs font-mono-tech text-cyan-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Drafted Vessels List */}
        <div className="space-y-3 mb-6">
          {fleetDrafts.map((draft, idx) => {
            const template = harborCatalog?.ship_templates[draft.ship_type]

            return (
              <div
                key={idx}
                className="bg-slate-900/80 border border-cyan-900/50 rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={draft.custom_name}
                      onChange={(e) => {
                        const val = e.target.value
                        setFleetDrafts(prev => prev.map((s, i) => i === idx ? { ...s, custom_name: val } : s))
                        setValidation(null)
                      }}
                      className="bg-slate-950 border border-slate-700 focus:border-cyan-400 rounded px-2 py-0.5 text-xs font-mono-tech text-cyan-200 w-64"
                    />
                    <span className="text-[11px] font-mono-tech px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {draft.ship_type}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono-tech text-slate-400">
                    DISP: {template?.displacement_tons.toLocaleString()} tons | COST: ${template?.cost_credits.toLocaleString()} | MAX WEAPONS: {template?.max_weapon_slots}
                  </div>
                </div>

                <button
                  onClick={() => handleRemoveShip(idx)}
                  className="p-1.5 rounded bg-red-950/60 hover:bg-red-900 border border-red-800 text-red-300 transition-colors cursor-pointer"
                  title="Scrap vessel draft"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>

        {/* Validation Output */}
        {validation && (
          <div
            className={`p-3 rounded border mb-4 font-mono-tech text-xs ${
              validation.is_valid
                ? 'bg-emerald-950/70 border-emerald-600 text-emerald-300'
                : 'bg-red-950/70 border-red-600 text-red-300'
            }`}
          >
            <div className="flex items-center gap-2 font-bold mb-1">
              {validation.is_valid ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
              {validation.is_valid ? 'FLEET SPECIFICATION CERTIFIED' : 'LOADOUT ERROR DETECTED'}
            </div>
            <div>TOTAL FLEET COST: ${validation.total_cost.toLocaleString()} | REMAINING BUDGET: ${validation.remaining_budget.toLocaleString()}</div>
            {validation.errors?.length > 0 && (
              <ul className="list-disc list-inside mt-2 text-[11px] text-red-400">
                {validation.errors.map((err: string, i: number) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Actions Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <div className="text-xs font-mono-tech text-slate-400">
            TOTAL ACTIVE HULLS: <span className="text-cyan-300 font-bold">{fleetDrafts.length}</span> / 4
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleValidate}
              disabled={isValidating || fleetDrafts.length === 0}
              className="px-4 py-2 rounded bg-slate-900 hover:bg-slate-800 border border-cyan-700/60 text-cyan-300 font-mono-tech text-xs font-bold transition-all cursor-pointer"
            >
              VALIDATE LOADOUT
            </button>

            <button
              onClick={handleDeploy}
              disabled={validation ? !validation.is_valid : false}
              className="px-5 py-2 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-400 text-cyan-200 font-mono-tech text-xs font-bold transition-all cursor-pointer shadow-[0_0_15px_rgba(0,229,255,0.25)]"
            >
              DEPLOY CUSTOM FLEET
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
