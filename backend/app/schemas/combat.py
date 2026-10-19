from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field

class Faction(str, Enum):
    PACIFIC_FLEET = "PACIFIC_FLEET"          # Fictional US / Allied Pacific defense
    EURASIAN_UNION = "EURASIAN_UNION"        # Fictional Eurasian naval power
    THE_HARVESTERS = "THE_HARVESTERS"        # Unidentified extraterrestrial aquatic force

class ShipType(str, Enum):
    DESTROYER = "DESTROYER"           # Guided missile screen, high CIWS
    CRUISER = "CRUISER"               # Heavy missile battery, area air defense
    AIRCRAFT_CARRIER = "CARRIER"      # Recon drones, long-range cruise strike
    SUBMARINE = "SUBMARINE"           # Stealth, heavy acoustic torpedoes
    FRIGATE_SUPPORT = "FRIGATE_SUPPORT" # Rescue, towing, damage control tenders
    ALIEN_SCOUT = "ALIEN_SCOUT"       # High-speed recon, withdraws when threatened
    ALIEN_CORVETTE = "ALIEN_CORVETTE" # Frontline biomechanical combat vessel
    ALIEN_LEVIATHAN = "ALIEN_LEVIATHAN" # Armored command mothership with kinetic spikes

class ShipRole(str, Enum):
    COMBAT = "COMBAT"
    RECONNAISSANCE = "RECONNAISSANCE"
    SUPPORT = "SUPPORT"
    SPECIALIZED = "SPECIALIZED"

class DamageState(str, Enum):
    OPERATIONAL = "OPERATIONAL"   # 100% - 75%
    DAMAGED = "DAMAGED"           # 74% - 40% (smoke, reduced speed)
    CRITICAL = "CRITICAL"         # 39% - 15% (fire, disabled weapon slots)
    DISABLED = "DISABLED"         # 14% - 1% (dead in water, burning, eligible for rescue/repair)
    SINKING = "SINKING"           # 0% (cinematic listing & sinking - terminal loss)

class BattlePhase(str, Enum):
    HARBOR_PREPARATION = "HARBOR_PREPARATION"     # Stage 01: Fleet and loadout setup
    DEPARTURE_TRANSIT = "DEPARTURE_TRANSIT"       # Stage 02: Deployment lock & departure
    TRANSIT_RECONNAISSANCE = "TRANSIT_RECON"      # Stage 03: Moving through mission area
    CONTACT_IDENTIFIED = "CONTACT_IDENTIFIED"     # Stage 04: Classifying tracks
    ENGAGEMENT_TARGETING = "ENGAGEMENT_TARGETING" # Stage 05: Validating solutions
    COMBAT_RESOLUTION = "COMBAT_RESOLUTION"       # Stage 06: Firing & intercepting
    BATTLEFIELD_DECISIONS = "BATTLE_DECISIONS"    # Stage 07: Continue, rescue, or retreat
    RETREATING = "RETREATING"                     # Withdrawal in progress
    MISSION_OUTCOME = "MISSION_OUTCOME"           # Stage 08: Evaluating victory / defeat
    DEBRIEF_RECOVERY = "DEBRIEF_RECOVERY"         # Stage 09: Post-battle casualties & repairs

class ContactClassification(str, Enum):
    UNKNOWN = "UNKNOWN"                     # Unidentified signal / anomaly
    SUSPECTED_HOSTILE = "SUSPECTED_HOSTILE" # Probable hostile unit
    CONFIRMED_HOSTILE = "CONFIRMED_HOSTILE" # Visually or radar-confirmed enemy
    LOST_CONTACT = "LOST_CONTACT"           # Ghost blip with last known position & timestamp
    DECOY = "DECOY"                         # Active chaff or electronic decoy

class WeaponLifecycleState(str, Enum):
    AVAILABLE = "AVAILABLE"                 # Ready in mount
    VALIDATION = "VALIDATION"               # Checking range, rules & ammo
    COMMITTED = "COMMITTED"                 # Ammo deducted, event logged
    LAUNCH_ACTIVATION = "LAUNCH_ACTIVATION" # Booster ignition & visual trail start
    IN_PROGRESS = "IN_PROGRESS"             # Flight trajectory active
    RESOLUTION = "RESOLUTION"               # Interception, hit or miss roll
    COMPLETED = "COMPLETED"                 # Impact aftermath & damage recorded

class AttackOutcomeType(str, Enum):
    SUCCESSFUL_IMPACT = "SUCCESSFUL_IMPACT"
    MISS = "MISS"
    INTERCEPTION = "INTERCEPTION"
    DECOY_RESPONSE = "DECOY_RESPONSE"
    ABORTED_EVENT = "ABORTED_EVENT"
    SPECIAL_OUTCOME = "SPECIAL_OUTCOME"

class MissionOutcomeType(str, Enum):
    VICTORY = "VICTORY"
    DEFEAT = "DEFEAT"
    PARTIAL_SUCCESS = "PARTIAL_SUCCESS"
    WITHDRAWAL = "WITHDRAWAL"
    DRAW_INCONCLUSIVE = "DRAW_INCONCLUSIVE"
    ABANDONED = "ABANDONED"

class WeaponType(str, Enum):
    NAVAL_GUN_RAILGUN = "NAVAL_GUN_RAILGUN"
    CRUISE_MISSILE = "CRUISE_MISSILE"
    ANTI_SHIP_BALLISTIC = "ANTI_SHIP_BALLISTIC"
    HEAVY_TORPEDO = "HEAVY_TORPEDO"
    ALIEN_PLASMA_LANCE = "ALIEN_PLASMA_LANCE"
    ALIEN_KINETIC_SPIKE = "ALIEN_KINETIC_SPIKE"

class CountermeasureType(str, Enum):
    CIWS_INTERCEPTOR = "CIWS_INTERCEPTOR"
    CHAFF_FLARE_DECOY = "CHAFF_FLARE_DECOY"
    ELECTRONIC_JAMMING = "ELECTRONIC_JAMMING"
    EVASIVE_MANEUVER = "EVASIVE_MANEUVER"
    DAMAGE_CONTROL = "DAMAGE_CONTROL"

class Vector2D(BaseModel):
    x: float
    y: float

class SubsystemStatus(BaseModel):
    hull: float = Field(100.0, ge=0.0, le=1000.0)
    propulsion: float = Field(100.0, ge=0.0, le=100.0)
    radar: float = Field(100.0, ge=0.0, le=100.0)
    fire_control: float = Field(100.0, ge=0.0, le=100.0)
    countermeasure_launcher: float = Field(100.0, ge=0.0, le=100.0)

class WeaponMount(BaseModel):
    id: str
    weapon_type: WeaponType
    name: str
    damage: float
    max_range: float
    min_range: float = 0.0
    cooldown_seconds: float
    current_cooldown: float = 0.0
    ammo_remaining: int
    max_ammo: int
    projectile_speed: float
    accuracy_base: float
    trajectory_type: str

class CountermeasureMount(BaseModel):
    id: str
    countermeasure_type: CountermeasureType
    name: str
    charges_remaining: int
    max_charges: int
    cooldown_seconds: float
    current_cooldown: float = 0.0
    effectiveness: float

class ShipState(BaseModel):
    id: str
    name: str
    faction: Faction
    ship_type: ShipType
    role: ShipRole = ShipRole.COMBAT
    position: Vector2D
    heading: float = 0.0
    target_heading: float = 0.0
    speed: float = 0.0
    max_speed: float = 30.0
    max_hull: float = 100.0
    damage_state: DamageState = DamageState.OPERATIONAL
    subsystems: SubsystemStatus = Field(default_factory=SubsystemStatus)
    weapons: List[WeaponMount] = Field(default_factory=list)
    countermeasures: List[CountermeasureMount] = Field(default_factory=list)
    radar_signature: float = 1.0
    acoustic_signature: float = 1.0
    is_evading: bool = False
    is_jamming: bool = False
    is_retreating: bool = False
    is_rescued: bool = False

class SensorContact(BaseModel):
    id: str
    estimated_position: Vector2D
    confidence_radius: float
    confidence_level: float
    classification: ContactClassification = ContactClassification.UNKNOWN
    apparent_type: Optional[ShipType] = None
    apparent_faction: Optional[Faction] = None
    last_detected_at: float
    last_known_heading: float = 0.0
    speed_estimate: float = 0.0
    is_false_alarm: bool = False

class InFlightProjectile(BaseModel):
    id: str
    weapon_type: WeaponType
    lifecycle_state: WeaponLifecycleState = WeaponLifecycleState.COMMITTED
    attacker_ship_id: str
    attacker_faction: Faction
    target_ship_id: Optional[str]
    origin: Vector2D
    target_position: Vector2D
    current_position: Vector2D
    speed: float
    trajectory_type: str
    total_travel_time: float
    elapsed_time: float = 0.0
    detected_by_target: bool = False
    intercepted: bool = False
    outcome: Optional[AttackOutcomeType] = None
    resolved: bool = False

class MissionObjective(BaseModel):
    id: str
    title: str
    description: str
    is_mandatory: bool = True
    is_completed: bool = False
    is_failed: bool = False
    target_id: Optional[str] = None
    current_progress: float = 0.0
    target_progress: float = 1.0

class RetreatOrder(BaseModel):
    faction: Faction
    ship_id: Optional[str] = None # None means entire fleet
    status: str = "ORDERED" # ORDERED, IN_PROGRESS, WITHDRAWN_SAFE, FAILED
    ordered_at: float
    exit_boundary_y: float = -25.0

class BattleReport(BaseModel):
    match_id: str
    scenario_id: str
    player_faction: Faction
    outcome: MissionOutcomeType
    duration_seconds: float
    objectives: List[MissionObjective]
    ships_deployed: int
    ships_survived: int
    ships_damaged: int
    ships_disabled: int
    ships_lost: int
    ships_rescued: int
    hostiles_neutralized: int
    ammo_consumed: int
    ciws_interceptions: int
    tactical_credits_earned: int
    debrief_notes: List[str]

class CombatEventType(str, Enum):
    ATTACK_LAUNCHED = "ATTACK_LAUNCHED"
    THREAT_DETECTED = "THREAT_DETECTED"
    COUNTERMEASURE_DEPLOYED = "COUNTERMEASURE_DEPLOYED"
    ATTACK_INTERCEPTED = "ATTACK_INTERCEPTED"
    ATTACK_HIT = "ATTACK_HIT"
    ATTACK_MISSED = "ATTACK_MISSED"
    VESSEL_DAMAGED = "VESSEL_DAMAGED"
    VESSEL_CRITICAL = "VESSEL_CRITICAL"
    VESSEL_DISABLED = "VESSEL_DISABLED"
    VESSEL_SUNK = "VESSEL_SUNK"
    DAMAGE_CONTROL_APPLIED = "DAMAGE_CONTROL_APPLIED"
    RETREAT_ORDERED = "RETREAT_ORDERED"
    SHIP_WITHDRAWN = "SHIP_WITHDRAWN"
    RESCUE_COMPLETED = "RESCUE_COMPLETED"
    OBJECTIVE_COMPLETED = "OBJECTIVE_COMPLETED"
    MISSION_OUTCOME_DECLARED = "MISSION_OUTCOME_DECLARED"

class CombatEvent(BaseModel):
    id: str
    timestamp: float
    event_type: CombatEventType
    source_ship_id: Optional[str] = None
    target_ship_id: Optional[str] = None
    projectile_id: Optional[str] = None
    details: Dict[str, str | float | int | bool] = Field(default_factory=dict)
    message: str
