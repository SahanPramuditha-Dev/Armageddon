export type Faction = 'PACIFIC_FLEET' | 'EURASIAN_UNION' | 'THE_HARVESTERS';

export type ShipType = 
  | 'DESTROYER'
  | 'CRUISER'
  | 'CARRIER'
  | 'SUBMARINE'
  | 'FRIGATE_SUPPORT'
  | 'ALIEN_SCOUT'
  | 'ALIEN_CORVETTE'
  | 'ALIEN_LEVIATHAN';

export type DamageState = 
  | 'OPERATIONAL'
  | 'DAMAGED'
  | 'CRITICAL'
  | 'DISABLED'
  | 'SINKING';

export type BattlePhase = 
  | 'HARBOR_PREPARATION'
  | 'DEPARTURE_TRANSIT'
  | 'TRANSIT_RECON'
  | 'CONTACT_IDENTIFIED'
  | 'ENGAGEMENT_TARGETING'
  | 'COMBAT_RESOLUTION'
  | 'BATTLE_DECISIONS'
  | 'RETREATING'
  | 'MISSION_OUTCOME'
  | 'DEBRIEF_RECOVERY';

export type ContactClassification = 
  | 'UNKNOWN'
  | 'SUSPECTED_HOSTILE'
  | 'CONFIRMED_HOSTILE'
  | 'LOST_CONTACT'
  | 'DECOY';

export type WeaponLifecycleState = 
  | 'AVAILABLE'
  | 'VALIDATION'
  | 'COMMITTED'
  | 'LAUNCH_ACTIVATION'
  | 'IN_PROGRESS'
  | 'RESOLUTION'
  | 'COMPLETED';

export type AttackOutcomeType = 
  | 'SUCCESSFUL_IMPACT'
  | 'MISS'
  | 'INTERCEPTION'
  | 'DECOY_RESPONSE'
  | 'ABORTED_EVENT'
  | 'SPECIAL_OUTCOME';

export type MissionOutcomeType = 
  | 'VICTORY'
  | 'DEFEAT'
  | 'PARTIAL_SUCCESS'
  | 'WITHDRAWAL'
  | 'DRAW_INCONCLUSIVE'
  | 'ABANDONED';

export type WeaponType = 
  | 'NAVAL_GUN_RAILGUN'
  | 'CRUISE_MISSILE'
  | 'ANTI_SHIP_BALLISTIC'
  | 'HEAVY_TORPEDO'
  | 'ALIEN_PLASMA_LANCE'
  | 'ALIEN_KINETIC_SPIKE';

export type CountermeasureType = 
  | 'CIWS_INTERCEPTOR'
  | 'CHAFF_FLARE_DECOY'
  | 'ELECTRONIC_JAMMING'
  | 'EVASIVE_MANEUVER'
  | 'DAMAGE_CONTROL';

export interface Vector2D {
  x: number;
  y: number;
}

export interface SubsystemStatus {
  hull: number;
  propulsion: number;
  radar: number;
  fire_control: number;
  countermeasure_launcher: number;
}

export interface WeaponMount {
  id: string;
  weapon_type: WeaponType;
  name: string;
  damage: number;
  max_range: number;
  min_range: number;
  cooldown_seconds: number;
  current_cooldown: number;
  ammo_remaining: number;
  max_ammo: number;
  projectile_speed: number;
  accuracy_base: number;
  trajectory_type: string;
}

export interface CountermeasureMount {
  id: string;
  countermeasure_type: CountermeasureType;
  name: string;
  charges_remaining: number;
  max_charges: number;
  cooldown_seconds: number;
  current_cooldown: number;
  effectiveness: number;
}

export interface ShipState {
  id: string;
  name: string;
  faction: Faction;
  ship_type: ShipType;
  role?: string;
  position: Vector2D;
  heading: number;
  target_heading: number;
  speed: number;
  max_speed: number;
  max_hull: number;
  damage_state: DamageState;
  subsystems: SubsystemStatus;
  weapons: WeaponMount[];
  countermeasures: CountermeasureMount[];
  radar_signature: number;
  acoustic_signature: number;
  is_evading: boolean;
  is_jamming: boolean;
  is_retreating?: boolean;
  is_rescued?: boolean;
}

export interface SensorContact {
  id: string;
  estimated_position: Vector2D;
  confidence_radius: number;
  confidence_level: number;
  classification?: ContactClassification;
  apparent_type: ShipType | null;
  apparent_faction: Faction | null;
  last_detected_at: number;
  last_known_heading?: number;
  speed_estimate: number;
  is_false_alarm: boolean;
}

export interface InFlightProjectile {
  id: string;
  weapon_type: WeaponType;
  lifecycle_state?: WeaponLifecycleState;
  attacker_ship_id: string;
  attacker_faction: Faction;
  target_ship_id: string | null;
  origin: Vector2D;
  target_position: Vector2D;
  current_position: Vector2D;
  speed: number;
  trajectory_type: string;
  total_travel_time: number;
  elapsed_time: number;
  detected_by_target: boolean;
  intercepted: boolean;
  outcome?: AttackOutcomeType;
  resolved: boolean;
}

export interface MissionObjective {
  id: string;
  title: string;
  description: string;
  is_mandatory: boolean;
  is_completed: boolean;
  is_failed: boolean;
  target_id?: string | null;
  current_progress: number;
  target_progress: number;
}

export interface BattleReport {
  match_id: string;
  scenario_id: string;
  player_faction: Faction;
  outcome: MissionOutcomeType;
  duration_seconds: number;
  objectives: MissionObjective[];
  ships_deployed: number;
  ships_survived: number;
  ships_damaged: number;
  ships_disabled: number;
  ships_lost: number;
  ships_rescued: number;
  hostiles_neutralized: number;
  ammo_consumed: number;
  ciws_interceptions: number;
  tactical_credits_earned: number;
  debrief_notes: string[];
}

export type CombatEventType = 
  | 'ATTACK_LAUNCHED'
  | 'THREAT_DETECTED'
  | 'COUNTERMEASURE_DEPLOYED'
  | 'ATTACK_INTERCEPTED'
  | 'ATTACK_HIT'
  | 'ATTACK_MISSED'
  | 'VESSEL_DAMAGED'
  | 'VESSEL_CRITICAL'
  | 'VESSEL_DISABLED'
  | 'VESSEL_SUNK'
  | 'DAMAGE_CONTROL_APPLIED'
  | 'RETREAT_ORDERED'
  | 'SHIP_WITHDRAWN'
  | 'RESCUE_COMPLETED'
  | 'OBJECTIVE_COMPLETED'
  | 'MISSION_OBJECTIVE_UPDATE'
  | 'MISSION_OUTCOME_DECLARED';

export interface CombatEvent {
  id: string;
  timestamp: number;
  event_type: CombatEventType;
  source_ship_id?: string | null;
  target_ship_id?: string | null;
  projectile_id?: string | null;
  details: Record<string, string | number | boolean>;
  message: string;
}

export interface TacticalViewState {
  match_id: string;
  scenario_id?: string;
  current_phase?: BattlePhase;
  simulation_time: number;
  is_finished: boolean;
  outcome?: MissionOutcomeType | null;
  winner_faction: string | null;
  friendly_fleet: ShipState[];
  sensor_contacts: SensorContact[];
  projectiles: InFlightProjectile[];
  active_decoys: Array<Record<string, unknown>>;
  objectives?: MissionObjective[];
  recent_events: CombatEvent[];
  battle_report?: BattleReport | null;
}

export type TacticalState = TacticalViewState;

export type ScreenView = 
  | 'MAIN_MENU'
  | 'HARBOR_DRYDOCK'
  | 'MISSION_BRIEFING'
  | 'LIVE_COMBAT'
  | 'INTELLIGENCE'
  | 'DAMAGE_ASSESSMENT'
  | 'MISSION_RESULTS'
  | 'SETTINGS';

export type CameraMode = 'TACTICAL_TOPDOWN' | 'TACTICAL_ORBIT' | 'ACTION_CHASE' | 'BRIDGE_FIRST_PERSON';

export interface ShipTemplate {
  ship_type: ShipType;
  name: string;
  displacement_tons: number;
  cost_credits: number;
  max_weapon_slots: number;
  max_countermeasure_slots: number;
  allowed_weapon_types: WeaponType[];
  base_hull: number;
  base_speed: number;
  radar_signature: number;
  acoustic_signature: number;
}

export type ShipClassTemplate = ShipTemplate;

export interface ScenarioInfo {
  id: string;
  title: string;
  description: string;
  threat_rating: string;
  enemy_faction: Faction;
  player_faction: Faction;
}

export interface ShipDraft {
  ship_type: ShipType;
  custom_name: string;
  equipped_weapon_ids: string[];
  equipped_countermeasure_ids: string[];
}

export interface FleetDraftConfig {
  fleet_name?: string;
  faction?: Faction;
  max_tonnage?: number;
  budget_limit?: number;
  total_budget_credits?: number;
  ships: ShipDraft[];
}

export interface FleetValidationResult {
  is_valid: boolean;
  total_tonnage?: number;
  total_cost: number;
  remaining_budget: number;
  errors: string[];
}
