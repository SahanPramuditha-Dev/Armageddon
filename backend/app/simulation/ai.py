import random
import math
from enum import Enum
from typing import Dict, List, Optional
from app.schemas.combat import ShipState, Faction, Vector2D, DamageState, ShipType
from app.simulation.engine import CombatEngine
from app.simulation.uncertainty import calculate_distance

class AIBehaviorState(str, Enum):
    PATROL = "PATROL"
    STALK_TARGET = "STALK_TARGET"
    ATTACK_RUN = "ATTACK_RUN"
    DISORGANIZED_SCATTER = "DISORGANIZED_SCATTER"
    STRATEGIC_RETREAT = "STRATEGIC_RETREAT"

class TacticalAIController:
    """
    Intelligent opponent controller for Alien ('The Harvesters') and opposing naval fleets.
    Models command hierarchy, cohesion loss upon flagship destruction, and strategic retreat.
    """

    def __init__(self, faction: Faction):
        self.faction = faction
        self.behavior_states: Dict[str, AIBehaviorState] = {}
        self.has_lost_command_cohesion: bool = False

    def update(self, engine: CombatEngine, delta_time: float):
        ai_ships = [
            s for s in engine.ships.values()
            if s.faction == self.faction and s.damage_state != DamageState.SINKING
        ]
        if not ai_ships:
            return

        # 1. Check Command Hierarchy & Cohesion Loss
        # In Alien fleets, the ALIEN_LEVIATHAN acts as the command nexus
        command_ship = next((s for s in ai_ships if s.ship_type == ShipType.ALIEN_LEVIATHAN), None)
        if not command_ship and not self.has_lost_command_cohesion:
            # Check if command ship previously existed and was disabled/sunk
            had_command_ship = any(s.ship_type == ShipType.ALIEN_LEVIATHAN for s in engine.ships.values() if s.faction == self.faction)
            if had_command_ship:
                self.has_lost_command_cohesion = True
                # Trigger cohesion loss across remaining units
                for s in ai_ships:
                    self.behavior_states[s.id] = AIBehaviorState.DISORGANIZED_SCATTER

        # 2. Gather sensor perspective
        tactical_view = engine.get_tactical_view_for_faction(self.faction)
        contacts = tactical_view["sensor_contacts"]
        projectiles = tactical_view["projectiles"]

        # 3. Defensive Countermeasures check
        for ship in ai_ships:
            incoming_threat = next((
                p for p in projectiles
                if p["target_ship_id"] == ship.id and not p["intercepted"] and not p["resolved"]
            ), None)

            if incoming_threat:
                self._handle_defensive_reaction(engine, ship)

            # Update tactical movement and combat decision state
            self._update_ship_behavior(engine, ship, contacts, delta_time)

    def _handle_defensive_reaction(self, engine: CombatEngine, ship: ShipState):
        for cm in ship.countermeasures:
            if cm.charges_remaining > 0 and cm.current_cooldown <= 0:
                engine.deploy_countermeasure(ship.id, cm.id)
                return

    def _update_ship_behavior(self, engine: CombatEngine, ship: ShipState, contacts: List[Dict], delta_time: float):
        current_state = self.behavior_states.get(ship.id, AIBehaviorState.PATROL)

        # A. Scout withdrawal: Alien Scouts withdraw when damaged
        if ship.ship_type == ShipType.ALIEN_SCOUT and ship.subsystems.hull < 70.0:
            current_state = AIBehaviorState.STRATEGIC_RETREAT
            self.behavior_states[ship.id] = current_state

        # B. Cohesion loss scatter: erratic aim & drifting
        if self.has_lost_command_cohesion and ship.ship_type != ShipType.ALIEN_LEVIATHAN:
            # Subordinates lose alignment, heading jitter
            ship.heading = (ship.heading + (random.random() - 0.5) * 20.0) % 360.0
            ship.speed = ship.max_speed * 0.5

        if current_state == AIBehaviorState.STRATEGIC_RETREAT:
            # Steer North towards extraction (heading 0)
            ship.heading = 0.0
            ship.speed = ship.max_speed
            return

        if not contacts:
            # Patrol loop
            ship.heading = (ship.heading + delta_time * 4.0) % 360.0
            ship.speed = ship.max_speed * 0.5
            return

        # Acquire nearest contact
        closest_contact = None
        min_dist = float("inf")
        for c in contacts:
            c_pos = Vector2D(x=c["estimated_position"]["x"], y=c["estimated_position"]["y"])
            d = calculate_distance(ship.position, c_pos)
            if d < min_dist:
                min_dist = d
                closest_contact = c

        if not closest_contact:
            return

        target_pos = Vector2D(
            x=closest_contact["estimated_position"]["x"],
            y=closest_contact["estimated_position"]["y"]
        )

        dx = target_pos.x - ship.position.x
        dy = target_pos.y - ship.position.y
        desired_angle = math.degrees(math.atan2(dx, dy)) % 360.0

        if min_dist > 45.0:
            ship.heading = desired_angle
            ship.speed = ship.max_speed * 0.8
        elif min_dist < 20.0:
            ship.heading = (desired_angle + 180.0) % 360.0
            ship.speed = ship.max_speed
        else:
            # Circle around target
            ship.heading = (desired_angle + 90.0) % 360.0
            ship.speed = ship.max_speed * 0.7

        # Firing decision
        # If cohesion was lost, AI fires less frequently (30% penalty)
        if self.has_lost_command_cohesion and random.random() < 0.30:
            return

        for w in ship.weapons:
            if w.ammo_remaining > 0 and w.current_cooldown <= 0:
                if w.min_range <= min_dist <= w.max_range:
                    real_target_ship_id = closest_contact["id"].replace("contact_", "")
                    engine.launch_attack(
                        attacker_id=ship.id,
                        weapon_id=w.id,
                        target_pos=target_pos,
                        target_ship_id=real_target_ship_id
                    )
                    break
