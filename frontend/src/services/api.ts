import type {
  ScenarioInfo,
  ShipClassTemplate,
  WeaponMount,
  CountermeasureMount,
  FleetDraftConfig,
  FleetValidationResult,
  TacticalState,
  Faction
} from '../types/combat'

const API_BASE = 'http://127.0.0.1:8000'

export interface HarborCatalogResponse {
  ship_templates: Record<string, ShipClassTemplate>
  weapons: Record<string, WeaponMount>
  countermeasures: Record<string, CountermeasureMount>
}

export interface StartMatchResponse {
  match_id: string
  scenario_id: string
  player_faction: string
  status: string
}

export async function fetchHealth(): Promise<{ status: string; simulation_kernel: string }> {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error('Simulation kernel unreachable')
  return res.json()
}

export async function fetchScenarios(): Promise<ScenarioInfo[]> {
  const res = await fetch(`${API_BASE}/api/scenarios`)
  if (!res.ok) throw new Error('Failed to fetch scenarios')
  return res.json()
}

export async function fetchHarborCatalog(): Promise<HarborCatalogResponse> {
  const res = await fetch(`${API_BASE}/api/harbor/catalog`)
  if (!res.ok) throw new Error('Failed to fetch harbor catalog')
  return res.json()
}

export async function validateFleetConfig(config: FleetDraftConfig): Promise<FleetValidationResult> {
  const res = await fetch(`${API_BASE}/api/harbor/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail || 'Fleet validation failed')
  }
  return res.json()
}

export async function startNewMatch(
  scenarioId: string = 'SCENARIO_A',
  playerFaction: Faction = 'PACIFIC_FLEET',
  customFleet?: FleetDraftConfig
): Promise<StartMatchResponse> {
  const body: Record<string, unknown> = {
    scenario_id: scenarioId,
    player_faction: playerFaction
  }
  if (customFleet) {
    body.custom_fleet = customFleet
  }

  const res = await fetch(`${API_BASE}/api/matches/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail ? JSON.stringify(err.detail) : 'Failed to start combat match')
  }
  return res.json()
}

export async function fetchMatchState(matchId: string, faction: Faction = 'PACIFIC_FLEET'): Promise<TacticalState> {
  const res = await fetch(`${API_BASE}/api/matches/${matchId}/state?faction=${faction}`)
  if (!res.ok) throw new Error('Failed to retrieve tactical snapshot')
  return res.json()
}
