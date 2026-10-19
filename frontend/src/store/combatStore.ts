import { create } from 'zustand'
import type {
  TacticalState,
  ScenarioInfo,
  Vector2D,
  Faction,
  FleetDraftConfig
} from '../types/combat'
import {
  startNewMatch,
  fetchScenarios,
  fetchHarborCatalog,
  type HarborCatalogResponse
} from '../services/api'
import { CombatWebSocket, type ConnectionStatus, type ActionFeedbackMessage } from '../services/websocket'
import { tacticalAudio } from '../services/audio'

interface CombatStore {
  matchId: string
  connectionStatus: ConnectionStatus
  tacticalState: TacticalState | null
  selectedShipId: string | null
  targetContactId: string | null
  targetCoordinates: Vector2D | null
  targetMode: 'NONE' | 'ATTACK' | 'WAYPOINT'
  pendingWeaponId: string | null
  activeModal: 'NONE' | 'SCENARIOS' | 'HARBOR'
  isMuted: boolean
  feedbackMessage: string | null
  scenarios: ScenarioInfo[]
  harborCatalog: HarborCatalogResponse | null
  activeThreatWarning: string | null

  // Actions
  initCombat: (matchId?: string) => void
  setSelectedShipId: (id: string | null) => void
  setTargetContactId: (id: string | null) => void
  setTargetCoordinates: (pos: Vector2D | null) => void
  setTargetMode: (mode: 'NONE' | 'ATTACK' | 'WAYPOINT', weaponId?: string | null) => void
  setActiveModal: (modal: 'NONE' | 'SCENARIOS' | 'HARBOR') => void
  toggleAudio: () => void
  orderAttack: (attackerId: string, weaponId: string, targetPos: Vector2D, targetShipId?: string) => void
  orderCountermeasure: (shipId: string, cmId: string) => void
  orderManeuver: (shipId: string, heading?: number, speed?: number) => void
  startScenario: (scenarioId: string, playerFaction?: Faction, customFleet?: FleetDraftConfig) => Promise<void>
  loadScenarios: () => Promise<void>
  loadHarborCatalog: () => Promise<void>
}

let wsClient: CombatWebSocket | null = null
let lastEventCount = 0

export const useCombatStore = create<CombatStore>((set, get) => ({
  matchId: 'match_armageddon_alpha',
  connectionStatus: 'DISCONNECTED',
  tacticalState: null,
  selectedShipId: null,
  targetContactId: null,
  targetCoordinates: null,
  targetMode: 'NONE',
  pendingWeaponId: null,
  activeModal: 'NONE',
  isMuted: false,
  feedbackMessage: null,
  scenarios: [],
  harborCatalog: null,
  activeThreatWarning: null,

  initCombat: (matchId?: string) => {
    const currentMatchId = matchId || get().matchId
    set({ matchId: currentMatchId })

    if (wsClient) {
      wsClient.disconnect()
    }

    wsClient = new CombatWebSocket(currentMatchId)

    wsClient.onStatusChange = (status) => {
      set({ connectionStatus: status })
    }

    wsClient.onFeedback = (feedback: ActionFeedbackMessage) => {
      set({ feedbackMessage: `${feedback.action}: ${feedback.message}` })
      tacticalAudio.playOrderAck()
      setTimeout(() => {
        set((state) => (state.feedbackMessage === `${feedback.action}: ${feedback.message}` ? { feedbackMessage: null } : {}))
      }, 4000)
    }

    wsClient.onTacticalTick = (state: TacticalState) => {
      // Check for incoming threats to friendly fleet
      const friendlyIds = new Set(state.friendly_fleet.map(s => s.id))
      const incomingThreats = state.projectiles.filter(
        p => !p.resolved && !p.intercepted && p.target_ship_id && friendlyIds.has(p.target_ship_id)
      )

      let threatWarning: string | null = null
      if (incomingThreats.length > 0) {
        threatWarning = `WARNING: ${incomingThreats.length} INBOUND HOSTILE PROJECTILE(S) TRACKING FRIENDLY VESSEL`
        tacticalAudio.playThreatAlarm()
      }

      // Check new combat events to trigger procedural audio
      if (state.recent_events.length > lastEventCount) {
        const newest = state.recent_events[state.recent_events.length - 1]
        if (newest) {
          if (newest.event_type === 'ATTACK_HIT' || newest.event_type === 'VESSEL_SUNK') {
            tacticalAudio.playExplosion()
          } else if (newest.event_type === 'ATTACK_INTERCEPTED') {
            tacticalAudio.playCIWSBurst()
          } else if (newest.event_type === 'ATTACK_LAUNCHED') {
            tacticalAudio.playMissileLaunch()
          }
        }
      }
      lastEventCount = state.recent_events.length

      set((curr) => {
        // Auto-select first alive friendly ship if none selected
        let selected = curr.selectedShipId
        if (!selected && state.friendly_fleet.length > 0) {
          selected = state.friendly_fleet[0].id
        }
        return {
          tacticalState: state,
          selectedShipId: selected,
          activeThreatWarning: threatWarning
        }
      })
    }

    wsClient.connect()
  },

  setSelectedShipId: (id) => set({ selectedShipId: id }),
  setTargetContactId: (id) => set({ targetContactId: id }),
  setTargetCoordinates: (pos) => set({ targetCoordinates: pos }),
  setTargetMode: (mode, weaponId = null) => set({ targetMode: mode, pendingWeaponId: weaponId }),
  setActiveModal: (modal) => set({ activeModal: modal }),

  toggleAudio: () => {
    const nextMuted = !get().isMuted
    tacticalAudio.setMuted(nextMuted)
    set({ isMuted: nextMuted })
  },

  orderAttack: (attackerId, weaponId, targetPos, targetShipId) => {
    if (wsClient) {
      wsClient.sendAttack(attackerId, weaponId, targetPos, targetShipId)
      tacticalAudio.playOrderAck()
      set({ targetMode: 'NONE', pendingWeaponId: null })
    }
  },

  orderCountermeasure: (shipId, cmId) => {
    if (wsClient) {
      wsClient.sendCountermeasure(shipId, cmId)
      tacticalAudio.playOrderAck()
    }
  },

  orderManeuver: (shipId, heading, speed) => {
    if (wsClient) {
      wsClient.sendManeuver(shipId, heading, speed)
      tacticalAudio.playOrderAck()
      set({ targetMode: 'NONE' })
    }
  },

  startScenario: async (scenarioId, playerFaction = 'PACIFIC_FLEET', customFleet) => {
    try {
      const res = await startNewMatch(scenarioId, playerFaction, customFleet)
      set({ activeModal: 'NONE' })
      get().initCombat(res.match_id)
      tacticalAudio.playSonarPing()
    } catch (err) {
      console.error('[ARMAGEDDON] Failed to start scenario', err)
      set({ feedbackMessage: `Error starting match: ${err instanceof Error ? err.message : String(err)}` })
    }
  },

  loadScenarios: async () => {
    try {
      const data = await fetchScenarios()
      set({ scenarios: data })
    } catch (err) {
      console.error('[ARMAGEDDON] Failed to load scenarios', err)
    }
  },

  loadHarborCatalog: async () => {
    try {
      const data = await fetchHarborCatalog()
      set({ harborCatalog: data })
    } catch (err) {
      console.error('[ARMAGEDDON] Failed to load harbor catalog', err)
    }
  }
}))
