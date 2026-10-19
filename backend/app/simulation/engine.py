import math
import uuid
import random
from typing import Dict, List, Optional, Tuple
from app.schemas.combat import (
    ShipState, InFlightProjectile, CombatEvent, CombatEventType,
    DamageState, Vector2D, Faction, WeaponType, CountermeasureType,
    BattlePhase, WeaponLifecycleState, AttackOutcomeType, MissionOutcomeType,
    MissionObjective, RetreatOrder, BattleReport
)
from app.simulation.uncertainty import calculate_distance, SensorModel

class CombatEngine:
    """
    Authoritative Server-side Combat Simulation Engine for ARMAGEDDON.
    Strictly governs the 9-stage battle lifecycle, weapon state machines,
    deterministic target loss policies, retreat orders, and objective evaluations.
    """

    def __init__(self, match_id: str, scenario_id: str = "SCENARIO_A"):
        self.match_id = match_id
        self.scenario_id = scenario_id
        self.current_phase: BattlePhase = BattlePhase.TRANSIT_RECONNAISSANCE
        self.ships: Dict[str, ShipState] = {}
        self.projectiles: Dict[str, InFlightProjectile] = {}
        self.active_decoys: List[Dict] = []
        self.events: List[CombatEvent] = []
        self.objectives: List[MissionObjective] = []
        self.retreat_orders: List[RetreatOrder] = []
        self.simulation_time: float = 0.0
        self.is_finished: bool = False
        self.outcome: Optional[MissionOutcomeType] = None
        self.winner_faction: Optional[Faction] = None
        self.battle_report: Optional[BattleReport] = None

        # Statistics trackers for Stage 09 Debrief
        self.initial_ship_counts: Dict[str, int] = {}
        self.ammo_consumed_total: int = 0
        self.ciws_interceptions_total: int = 0
        self.damage_dealt_total: float = 0.0

    def add_ship(self, ship: ShipState):
        self.ships[ship.id] = ship
        self.initial_ship_counts[ship.faction.value] = self.initial_ship_counts.get(ship.faction.value, 0) + 1

    def add_objective(self, obj: MissionObjective):
        self.objectives.append(obj)

    def get_ship(self, ship_id: str) -> Optional[ShipState]:
        return self.ships.get(ship_id)

    # -------------------------------------------------------------
    # STAGE 05 & 06: WEAPON LIFECYCLE & ENGAGEMENT
    # -------------------------------------------------------------
    def launch_attack(
        self,
        attacker_id: str,
        weapon_id: str,
        target_pos: Vector2D,
        target_ship_id: Optional[str] = None
    ) -> Tuple[bool, str, Optional[str]]:
        attacker = self.ships.get(attacker_id)
        if not attacker:
            return False, "Attacker ship does not exist", None

        # 1. Validation Phase
        if attacker.damage_state in [DamageState.DISABLED, DamageState.SINKING]:
            return False, f"{attacker.name} is disabled or sinking and cannot fire", None

        weapon = next((w for w in attacker.weapons if w.id == weapon_id), None)
        if not weapon:
            return False, f"Weapon '{weapon_id}' not fitted on {attacker.name}", None

        if weapon.ammo_remaining <= 0:
            return False, f"All {weapon.name} rounds depleted", None

        if weapon.current_cooldown > 0:
            return False, f"{weapon.name} cooling down ({weapon.current_cooldown:.1f}s)", None

        dist = calculate_distance(attacker.position, target_pos)
        if dist > weapon.max_range:
            return False, f"Target out of maximum envelope ({dist:.1f}km > {weapon.max_range:.1f}km)", None
        if dist < weapon.min_range:
            return False, f"Target inside minimum arming range ({dist:.1f}km < {weapon.min_range:.1f}km)", None

        if (attacker.subsystems.fire_control / 100.0) <= 0.2:
            return False, "Fire control radar destroyed; cannot compute ballistic solution", None

        # 2. Commitment Phase
        weapon.ammo_remaining -= 1
        weapon.current_cooldown = weapon.cooldown_seconds
        self.ammo_consumed_total += 1

        travel_time = max(1.5, dist / weapon.projectile_speed)
        proj_id = f"proj_{uuid.uuid4().hex[:8]}"

        # 3. Launch / In Progress Phase
        projectile = InFlightProjectile(
            id=proj_id,
            weapon_type=weapon.weapon_type,
            lifecycle_state=WeaponLifecycleState.IN_PROGRESS,
            attacker_ship_id=attacker.id,
            attacker_faction=attacker.faction,
            target_ship_id=target_ship_id,
            origin=Vector2D(x=attacker.position.x, y=attacker.position.y),
            target_position=target_pos,
            current_position=Vector2D(x=attacker.position.x, y=attacker.position.y),
            speed=weapon.projectile_speed,
            trajectory_type=weapon.trajectory_type,
            total_travel_time=travel_time,
            elapsed_time=0.0
        )
        self.projectiles[proj_id] = projectile
        self.current_phase = BattlePhase.COMBAT_RESOLUTION

        event = CombatEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=self.simulation_time,
            event_type=CombatEventType.ATTACK_LAUNCHED,
            source_ship_id=attacker.id,
            target_ship_id=target_ship_id,
            projectile_id=proj_id,
            details={
                "weapon_name": weapon.name,
                "weapon_type": weapon.weapon_type.value,
                "travel_time": round(travel_time, 2),
                "distance": round(dist, 1),
            },
            message=f"{attacker.name} fired {weapon.name} toward target solution."
        )
        self.events.append(event)
        return True, "Attack launched", proj_id

    def deploy_countermeasure(self, ship_id: str, cm_id: str) -> Tuple[bool, str]:
        ship = self.ships.get(ship_id)
        if not ship:
            return False, "Ship does not exist"

        if ship.damage_state in [DamageState.DISABLED, DamageState.SINKING]:
            return False, "Vessel is disabled or sinking; defensive systems offline"

        cm = next((c for c in ship.countermeasures if c.id == cm_id), None)
        if not cm:
            return False, f"Countermeasure '{cm_id}' not fitted"

        if cm.charges_remaining <= 0:
            return False, f"All {cm.name} charges depleted"

        if cm.current_cooldown > 0:
            return False, f"{cm.name} is on cooldown ({cm.current_cooldown:.1f}s)"

        cm.charges_remaining -= 1
        cm.current_cooldown = cm.cooldown_seconds

        msg = f"{ship.name} deployed {cm.name}."

        if cm.countermeasure_type == CountermeasureType.CHAFF_FLARE_DECOY:
            self.active_decoys.append({
                "id": uuid.uuid4().hex[:6],
                "faction": ship.faction,
                "x": ship.position.x + random.uniform(-2, 2),
                "y": ship.position.y + random.uniform(-2, 2),
                "ttl": 15.0
            })
        elif cm.countermeasure_type == CountermeasureType.ELECTRONIC_JAMMING:
            ship.is_jamming = True
        elif cm.countermeasure_type == CountermeasureType.EVASIVE_MANEUVER:
            ship.is_evading = True
            ship.heading = (ship.heading + 90.0) % 360.0
            ship.speed = min(ship.max_speed, ship.speed + 10.0)
        elif cm.countermeasure_type == CountermeasureType.DAMAGE_CONTROL:
            ship.subsystems.hull = min(100.0, ship.subsystems.hull + 25.0)
            ship.subsystems.fire_control = min(100.0, ship.subsystems.fire_control + 35.0)
            ship.subsystems.propulsion = min(100.0, ship.subsystems.propulsion + 35.0)
            self._update_ship_damage_state(ship)
            msg = f"{ship.name} Damage Control teams sealed bulkheads (+25% Hull) and restored subsystems."

        self.events.append(CombatEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=self.simulation_time,
            event_type=CombatEventType.COUNTERMEASURE_DEPLOYED,
            source_ship_id=ship.id,
            details={"countermeasure": cm.name},
            message=msg
        ))
        return True, msg

    # -------------------------------------------------------------
    # STAGE 07: STRATEGIC RETREAT & RESCUE DECISIONS
    # -------------------------------------------------------------
    def order_retreat(self, faction: Faction, ship_id: Optional[str] = None) -> Tuple[bool, str]:
        """Orders tactical withdrawal towards safe extraction boundary (y <= -25.0)."""
        retreated_ships = []
        if ship_id:
            s = self.ships.get(ship_id)
            if s and s.faction == faction and s.damage_state != DamageState.SINKING:
                s.is_retreating = True
                s.heading = 180.0 # South towards safe boundary
                s.speed = s.max_speed * 0.9
                retreated_ships.append(s)
        else:
            for s in self.ships.values():
                if s.faction == faction and s.damage_state != DamageState.SINKING:
                    s.is_retreating = True
                    s.heading = 180.0
                    s.speed = s.max_speed * 0.9
                    retreated_ships.append(s)

        if not retreated_ships:
            return False, "No eligible operational ships to retreat"

        self.retreat_orders.append(RetreatOrder(
            faction=faction,
            ship_id=ship_id,
            status="IN_PROGRESS",
            ordered_at=self.simulation_time
        ))

        self.current_phase = BattlePhase.RETREATING
        names = ", ".join(s.name for s in retreated_ships)
        msg = f"TACTICAL RETREAT ORDERED: {names} steering for safe extraction corridor."

        self.events.append(CombatEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=self.simulation_time,
            event_type=CombatEventType.RETREAT_ORDERED,
            details={"faction": faction.value, "count": len(retreated_ships)},
            message=msg
        ))
        return True, msg

    def order_rescue(self, rescuer_id: str, target_disabled_id: str) -> Tuple[bool, str]:
        """Rescue a disabled vessel when within 5km proximity."""
        rescuer = self.ships.get(rescuer_id)
        target = self.ships.get(target_disabled_id)

        if not rescuer or not target:
            return False, "Rescuer or target ship not found"

        if target.damage_state != DamageState.DISABLED:
            return False, f"{target.name} is not disabled and does not require rescue"

        if target.is_rescued:
            return False, f"{target.name} has already been secured by rescue teams"

        dist = calculate_distance(rescuer.position, target.position)
        if dist > 6.0:
            return False, f"Rescuer is too far ({dist:.1f}km > 6.0km). Move closer to initiate towing/rescue."

        # Execute rescue
        target.is_rescued = True
        target.subsystems.hull = max(20.0, target.subsystems.hull + 20.0)
        target.subsystems.propulsion = 40.0
        self._update_ship_damage_state(target)

        # Check rescue objectives
        for obj in self.objectives:
            if obj.target_id == target.id and not obj.is_completed:
                obj.is_completed = True
                self.events.append(CombatEvent(
                    id=f"evt_{uuid.uuid4().hex[:8]}",
                    timestamp=self.simulation_time,
                    event_type=CombatEventType.OBJECTIVE_COMPLETED,
                    details={"objective_id": obj.id},
                    message=f"MISSION OBJECTIVE COMPLETED: {obj.title}"
                ))

        msg = f"{rescuer.name} secured towlines and deployed repair parties to {target.name}. Vessel stabilized and rescued!"
        self.events.append(CombatEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=self.simulation_time,
            event_type=CombatEventType.RESCUE_COMPLETED,
            source_ship_id=rescuer.id,
            target_ship_id=target.id,
            message=msg
        ))
        return True, msg

    # -------------------------------------------------------------
    # SIMULATION TICK LOOP
    # -------------------------------------------------------------
    def tick(self, delta_time: float):
        self.simulation_time += delta_time

        # 1. Update cooldowns and movement
        for ship in self.ships.values():
            if ship.damage_state == DamageState.SINKING:
                continue

            for w in ship.weapons:
                if w.current_cooldown > 0:
                    w.current_cooldown = max(0.0, w.current_cooldown - delta_time)

            for cm in ship.countermeasures:
                if cm.current_cooldown > 0:
                    cm.current_cooldown = max(0.0, cm.current_cooldown - delta_time)

            # Movement along heading
            if ship.speed > 0 and ship.damage_state != DamageState.DISABLED:
                eff = ship.subsystems.propulsion / 100.0
                effective_speed = ship.speed * eff
                rad = math.radians(ship.heading)
                dist_moved = (effective_speed / 3600.0) * delta_time * 15.0
                ship.position.x = round(ship.position.x + math.sin(rad) * dist_moved, 2)
                ship.position.y = round(ship.position.y + math.cos(rad) * dist_moved, 2)

                # Check if retreating ship crossed safe boundary (y <= -25.0)
                if ship.is_retreating and ship.position.y <= -25.0:
                    ship.speed = 0.0
                    self.events.append(CombatEvent(
                        id=f"evt_{uuid.uuid4().hex[:8]}",
                        timestamp=self.simulation_time,
                        event_type=CombatEventType.SHIP_WITHDRAWN,
                        source_ship_id=ship.id,
                        message=f"{ship.name} has crossed the perimeter and completed tactical withdrawal."
                    ))

        # 2. Update decoys
        for d in self.active_decoys:
            d["ttl"] -= delta_time
        self.active_decoys = [d for d in self.active_decoys if d["ttl"] > 0]

        # 3. Projectile flight & Resolution
        resolved_ids = []
        for p_id, p in self.projectiles.items():
            if p.resolved:
                resolved_ids.append(p_id)
                continue

            p.elapsed_time += delta_time
            progress = min(1.0, p.elapsed_time / p.total_travel_time)

            p.current_position.x = round(p.origin.x + (p.target_position.x - p.origin.x) * progress, 2)
            p.current_position.y = round(p.origin.y + (p.target_position.y - p.origin.y) * progress, 2)

            # Threat detection warning
            if not p.detected_by_target and p.target_ship_id:
                target_ship = self.ships.get(p.target_ship_id)
                if target_ship and target_ship.subsystems.hull > 0:
                    cur_dist = calculate_distance(p.current_position, target_ship.position)
                    if cur_dist <= 35.0 or progress >= 0.35:
                        p.detected_by_target = True
                        eta = round(p.total_travel_time - p.elapsed_time, 1)
                        self.events.append(CombatEvent(
                            id=f"evt_{uuid.uuid4().hex[:8]}",
                            timestamp=self.simulation_time,
                            event_type=CombatEventType.THREAT_DETECTED,
                            source_ship_id=p.attacker_ship_id,
                            target_ship_id=target_ship.id,
                            projectile_id=p.id,
                            details={"eta": eta, "weapon": p.weapon_type.value},
                            message=f"CRITICAL WARNING: Incoming {p.weapon_type.value} detected for {target_ship.name}! ETA {eta}s."
                        ))

            # Reached target destination
            if p.elapsed_time >= p.total_travel_time:
                self._resolve_projectile_impact(p)
                p.lifecycle_state = WeaponLifecycleState.COMPLETED
                p.resolved = True
                resolved_ids.append(p_id)

        for r_id in resolved_ids:
            if r_id in self.projectiles:
                del self.projectiles[r_id]

        # 4. Mission Outcome Evaluation
        if not self.is_finished:
            self._evaluate_mission_status()

    # -------------------------------------------------------------
    # COMMITTED ATTACK RESOLUTION & DETERMINISTIC TARGET LOSS
    # -------------------------------------------------------------
    def _resolve_projectile_impact(self, p: InFlightProjectile):
        target_ship = self.ships.get(p.target_ship_id) if p.target_ship_id else None

        # COMMITTED ATTACK POLICY: If target sunk before projectile arrived
        if not target_ship or target_ship.damage_state == DamageState.SINKING:
            p.outcome = AttackOutcomeType.MISS
            self.events.append(CombatEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                timestamp=self.simulation_time,
                event_type=CombatEventType.ATTACK_MISSED,
                source_ship_id=p.attacker_ship_id,
                projectile_id=p.id,
                details={"x": p.target_position.x, "y": p.target_position.y},
                message=f"Projectile impacted open water; original target already destroyed or out of position."
            ))
            return

        # 1. CIWS Interception
        ciws = next((c for c in target_ship.countermeasures if c.countermeasure_type == CountermeasureType.CIWS_INTERCEPTOR), None)
        if ciws and p.weapon_type in [WeaponType.CRUISE_MISSILE, WeaponType.ALIEN_KINETIC_SPIKE, WeaponType.ANTI_SHIP_BALLISTIC]:
            radar_eff = target_ship.subsystems.radar / 100.0
            if random.random() <= (ciws.effectiveness * radar_eff):
                p.intercepted = True
                p.outcome = AttackOutcomeType.INTERCEPTION
                self.ciws_interceptions_total += 1
                self.events.append(CombatEvent(
                    id=f"evt_{uuid.uuid4().hex[:8]}",
                    timestamp=self.simulation_time,
                    event_type=CombatEventType.ATTACK_INTERCEPTED,
                    source_ship_id=p.attacker_ship_id,
                    target_ship_id=target_ship.id,
                    projectile_id=p.id,
                    message=f"{target_ship.name}'s {ciws.name} successfully intercepted incoming {p.weapon_type.value}!"
                ))
                return

        # 2. Deflection & Hit Roll
        hit_prob = 0.88
        if target_ship.is_evading:
            hit_prob -= 0.35
            target_ship.is_evading = False
        if target_ship.is_jamming:
            hit_prob -= 0.40
            target_ship.is_jamming = False

        if random.random() > hit_prob:
            p.outcome = AttackOutcomeType.MISS
            self.events.append(CombatEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                timestamp=self.simulation_time,
                event_type=CombatEventType.ATTACK_MISSED,
                source_ship_id=p.attacker_ship_id,
                target_ship_id=target_ship.id,
                projectile_id=p.id,
                message=f"{p.weapon_type.value} missed {target_ship.name}! Shockwave deflected by maneuvers."
            ))
            return

        # 3. Direct Hit
        p.outcome = AttackOutcomeType.SUCCESSFUL_IMPACT
        attacker_ship = self.ships.get(p.attacker_ship_id)
        base_dmg = 70.0
        if attacker_ship:
            w_mount = next((w for w in attacker_ship.weapons if w.weapon_type == p.weapon_type), None)
            if w_mount:
                base_dmg = w_mount.damage

        self.damage_dealt_total += base_dmg
        target_ship.subsystems.hull = max(0.0, round(target_ship.subsystems.hull - base_dmg, 1))

        # Secondary casualties
        if random.random() < 0.50:
            target_ship.subsystems.propulsion = max(0.0, round(target_ship.subsystems.propulsion - random.uniform(15, 35), 1))
        if random.random() < 0.40:
            target_ship.subsystems.radar = max(0.0, round(target_ship.subsystems.radar - random.uniform(20, 45), 1))
        if random.random() < 0.35:
            target_ship.subsystems.fire_control = max(0.0, round(target_ship.subsystems.fire_control - random.uniform(25, 50), 1))

        self._update_ship_damage_state(target_ship)

        self.events.append(CombatEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=self.simulation_time,
            event_type=CombatEventType.ATTACK_HIT,
            source_ship_id=p.attacker_ship_id,
            target_ship_id=target_ship.id,
            projectile_id=p.id,
            details={"damage": base_dmg, "hull": target_ship.subsystems.hull},
            message=f"DIRECT HIT on {target_ship.name}! Sustained {base_dmg:.1f} damage. Hull integrity at {target_ship.subsystems.hull:.1f}%."
        ))

        if target_ship.damage_state == DamageState.SINKING:
            self.events.append(CombatEvent(
                id=f"evt_{uuid.uuid4().hex[:8]}",
                timestamp=self.simulation_time,
                event_type=CombatEventType.VESSEL_SUNK,
                source_ship_id=p.attacker_ship_id,
                target_ship_id=target_ship.id,
                message=f"STRUCTURAL BREACH: {target_ship.name} has suffered fatal hull rupture and is sinking!"
            ))

    def _update_ship_damage_state(self, ship: ShipState):
        hull = ship.subsystems.hull
        if hull <= 0.0:
            ship.damage_state = DamageState.SINKING
            ship.speed = 0.0
        elif hull <= 14.0:
            ship.damage_state = DamageState.DISABLED # Dead in water, eligible for rescue
            ship.speed = min(3.0, ship.speed)
        elif hull <= 39.0:
            ship.damage_state = DamageState.CRITICAL
            ship.speed = min(15.0, ship.speed)
        elif hull <= 74.0:
            ship.damage_state = DamageState.DAMAGED
            ship.speed = min(22.0, ship.speed)
        else:
            ship.damage_state = DamageState.OPERATIONAL

    # -------------------------------------------------------------
    # STAGE 08 & 09: MULTI-OBJECTIVE EVALUATION & DEBRIEF REPORT
    # -------------------------------------------------------------
    def _evaluate_mission_status(self):
        player_ships = [s for s in self.ships.values() if s.faction == Faction.PACIFIC_FLEET]
        enemy_ships = [s for s in self.ships.values() if s.faction != Faction.PACIFIC_FLEET]

        alive_player = [s for s in player_ships if s.damage_state != DamageState.SINKING]
        alive_enemy = [s for s in enemy_ships if s.damage_state != DamageState.SINKING]

        # 1. Defeat check: all player ships destroyed
        if not alive_player:
            self.is_finished = True
            self.outcome = MissionOutcomeType.DEFEAT
            self._finalize_battle(winner=Faction.THE_HARVESTERS)
            return

        # 2. Check if all player ships safely withdrew
        withdrawn_player = [s for s in alive_player if s.is_retreating and s.position.y <= -25.0]
        if withdrawn_player and len(withdrawn_player) == len(alive_player):
            self.is_finished = True
            self.outcome = MissionOutcomeType.WITHDRAWAL
            self._finalize_battle(winner=None)
            return

        # 3. Check enemy fleet status
        if not alive_enemy:
            # Check mandatory objectives (e.g. rescue)
            uncompleted_mandatory = [obj for obj in self.objectives if obj.is_mandatory and not obj.is_completed]
            if not uncompleted_mandatory:
                # Full Victory!
                self.is_finished = True
                self.outcome = MissionOutcomeType.VICTORY
                self._finalize_battle(winner=Faction.PACIFIC_FLEET)
            else:
                # Enemies defeated, but mandatory rescue remains
                self.current_phase = BattlePhase.BATTLEFIELD_DECISIONS

    def _finalize_battle(self, winner: Optional[Faction]):
        self.current_phase = BattlePhase.DEBRIEF_RECOVERY
        self.winner_faction = winner

        player_ships = [s for s in self.ships.values() if s.faction == Faction.PACIFIC_FLEET]
        survived = sum(1 for s in player_ships if s.damage_state != DamageState.SINKING)
        damaged = sum(1 for s in player_ships if s.damage_state in [DamageState.DAMAGED, DamageState.CRITICAL])
        disabled = sum(1 for s in player_ships if s.damage_state == DamageState.DISABLED)
        lost = sum(1 for s in player_ships if s.damage_state == DamageState.SINKING)
        rescued = sum(1 for s in player_ships if s.is_rescued)
        enemies_killed = sum(1 for s in self.ships.values() if s.faction != Faction.PACIFIC_FLEET and s.damage_state == DamageState.SINKING)

        credits_reward = 15000 if self.outcome == MissionOutcomeType.VICTORY else (8000 if self.outcome == MissionOutcomeType.WITHDRAWAL else 2500)
        credits_reward += (enemies_killed * 4000) + (rescued * 5000)

        debrief_notes = [
            f"Battle concluded under {self.outcome.value} status.",
            f"Enemy casualties confirmed: {enemies_killed} vessels eliminated.",
            f"Task Force munitions expenditure: {self.ammo_consumed_total} rounds fired.",
            f"Point-Defense Interceptions logged: {self.ciws_interceptions_total} threats neutralized."
        ]
        if rescued > 0:
            debrief_notes.append(f"Successfully rescued {rescued} disabled vessel crews.")

        self.battle_report = BattleReport(
            match_id=self.match_id,
            scenario_id=self.scenario_id,
            player_faction=Faction.PACIFIC_FLEET,
            outcome=self.outcome,
            duration_seconds=round(self.simulation_time, 1),
            objectives=self.objectives,
            ships_deployed=len(player_ships),
            ships_survived=survived,
            ships_damaged=damaged,
            ships_disabled=disabled,
            ships_lost=lost,
            ships_rescued=rescued,
            hostiles_neutralized=enemies_killed,
            ammo_consumed=self.ammo_consumed_total,
            ciws_interceptions=self.ciws_interceptions_total,
            tactical_credits_earned=credits_reward,
            debrief_notes=debrief_notes
        )

        self.events.append(CombatEvent(
            id=f"evt_{uuid.uuid4().hex[:8]}",
            timestamp=self.simulation_time,
            event_type=CombatEventType.MISSION_OUTCOME_DECLARED,
            details={"outcome": self.outcome.value, "credits": credits_reward},
            message=f"COMBAT RESOLVED: {self.outcome.value}. Generating Stage 09 Debriefing Report."
        ))

    def get_tactical_view_for_faction(self, faction: Faction) -> Dict:
        friendly = [s for s in self.ships.values() if s.faction == faction]
        contacts = SensorModel.generate_contacts_for_faction(
            observer_faction=faction,
            all_ships=self.ships,
            active_decoys=self.active_decoys,
            current_time=self.simulation_time
        )
        return {
            "match_id": self.match_id,
            "scenario_id": self.scenario_id,
            "current_phase": self.current_phase.value,
            "simulation_time": round(self.simulation_time, 2),
            "is_finished": self.is_finished,
            "outcome": self.outcome.value if self.outcome else None,
            "winner_faction": self.winner_faction.value if self.winner_faction else None,
            "friendly_fleet": [s.model_dump() for s in friendly],
            "sensor_contacts": [c.model_dump() for c in contacts],
            "projectiles": [p.model_dump() for p in self.projectiles.values()],
            "active_decoys": self.active_decoys,
            "objectives": [obj.model_dump() for obj in self.objectives],
            "recent_events": [e.model_dump() for e in self.events[-18:]],
            "battle_report": self.battle_report.model_dump() if self.battle_report else None
        }
