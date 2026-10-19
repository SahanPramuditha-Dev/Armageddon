import math
import random
from typing import List, Dict
from app.schemas.combat import (
    ShipState, SensorContact, Faction, Vector2D, ContactClassification, DamageState
)

def calculate_distance(p1: Vector2D, p2: Vector2D) -> float:
    return math.hypot(p1.x - p2.x, p1.y - p2.y)

class SensorModel:
    """
    Simulates radar, active/passive sonar, and reconnaissance cones.
    Classifies contacts into UNKNOWN, SUSPECTED_HOSTILE, CONFIRMED_HOSTILE,
    DECOY, and maintains LOST_CONTACT memory with expanding uncertainty.
    """
    RADAR_MAX_RANGE = 90.0
    SONAR_PASSIVE_MAX_RANGE = 45.0
    BASE_RESOLUTION_THRESHOLD = 25.0

    # Memory cache of last observed positions per observer faction
    last_known_contacts: Dict[str, Dict[str, SensorContact]] = {}

    @classmethod
    def generate_contacts_for_faction(
        cls,
        observer_faction: Faction,
        all_ships: Dict[str, ShipState],
        active_decoys: List[Dict] = None,
        current_time: float = 0.0
    ) -> List[SensorContact]:
        if observer_faction.value not in cls.last_known_contacts:
            cls.last_known_contacts[observer_faction.value] = {}

        faction_memory = cls.last_known_contacts[observer_faction.value]

        observer_ships = [
            s for s in all_ships.values()
            if s.faction == observer_faction and s.damage_state != DamageState.SINKING
        ]
        enemy_ships = [
            s for s in all_ships.values()
            if s.faction != observer_faction and s.damage_state != DamageState.SINKING
        ]

        active_detected_ids = set()
        live_contacts: List[SensorContact] = []

        for enemy in enemy_ships:
            # Find closest observer ship and its radar status
            min_dist = float("inf")
            best_observer: ShipState = None

            for obs in observer_ships:
                d = calculate_distance(obs.position, enemy.position)
                if d < min_dist:
                    min_dist = d
                    best_observer = obs

            if best_observer is None or min_dist > cls.RADAR_MAX_RANGE:
                # Out of sensor envelope
                continue

            radar_eff = best_observer.subsystems.radar / 100.0
            detectable_range = cls.RADAR_MAX_RANGE * enemy.radar_signature * radar_eff

            # Submarines underwater are near undetectable by air radar beyond sonar range
            if enemy.ship_type.value == "SUBMARINE" and min_dist > cls.SONAR_PASSIVE_MAX_RANGE:
                continue

            if min_dist > detectable_range:
                continue

            # Contact is detected!
            active_detected_ids.add(enemy.id)

            proximity = max(0.1, 1.0 - (min_dist / detectable_range))
            confidence = round(proximity * radar_eff, 2)

            if enemy.is_jamming:
                confidence = max(0.15, confidence * 0.45)

            # Error ellipse
            error_r = max(0.5, (1.0 - confidence) * 12.0)
            angle = random.uniform(0, 2 * math.pi)
            jitter_x = round(math.cos(angle) * error_r * random.random(), 2)
            jitter_y = round(math.sin(angle) * error_r * random.random(), 2)

            est_pos = Vector2D(
                x=round(enemy.position.x + jitter_x, 1),
                y=round(enemy.position.y + jitter_y, 1)
            )

            # Stage 04 Contact Classification
            if confidence >= 0.70:
                classification = ContactClassification.CONFIRMED_HOSTILE
                apparent_type = enemy.ship_type
                apparent_faction = enemy.faction
            elif confidence >= 0.40:
                classification = ContactClassification.SUSPECTED_HOSTILE
                apparent_type = enemy.ship_type if random.random() < 0.6 else None
                apparent_faction = enemy.faction if random.random() < 0.5 else None
            else:
                classification = ContactClassification.UNKNOWN
                apparent_type = None
                apparent_faction = None

            contact = SensorContact(
                id=f"contact_{enemy.id}",
                estimated_position=est_pos,
                confidence_radius=round(error_r, 1),
                confidence_level=confidence,
                classification=classification,
                apparent_type=apparent_type,
                apparent_faction=apparent_faction,
                last_detected_at=current_time,
                last_known_heading=round(enemy.heading, 1),
                speed_estimate=round(enemy.speed * (0.85 + 0.3 * random.random()), 1),
                is_false_alarm=False
            )

            live_contacts.append(contact)
            faction_memory[enemy.id] = contact

        # Add LOST_CONTACT records for enemies that were seen before but slipped out of detection
        for enemy_id, prev_contact in list(faction_memory.items()):
            if enemy_id not in active_detected_ids:
                enemy_ship = all_ships.get(enemy_id)
                if enemy_ship and enemy_ship.damage_state != DamageState.SINKING:
                    time_lost = current_time - prev_contact.last_detected_at
                    if time_lost < 90.0: # Keep in memory for 90 seconds
                        # Uncertainty expands over time as target moves
                        expanded_r = min(25.0, prev_contact.confidence_radius + (time_lost * 0.2))
                        lost_contact = SensorContact(
                            id=f"lost_{enemy_id}",
                            estimated_position=prev_contact.estimated_position,
                            confidence_radius=round(expanded_r, 1),
                            confidence_level=max(0.1, prev_contact.confidence_level - (time_lost * 0.01)),
                            classification=ContactClassification.LOST_CONTACT,
                            apparent_type=prev_contact.apparent_type,
                            apparent_faction=prev_contact.apparent_faction,
                            last_detected_at=prev_contact.last_detected_at,
                            last_known_heading=prev_contact.last_known_heading,
                            speed_estimate=prev_contact.speed_estimate,
                            is_false_alarm=False
                        )
                        live_contacts.append(lost_contact)

        # Add active false decoy contacts
        if active_decoys:
            for decoy in active_decoys:
                if decoy.get("faction") != observer_faction and decoy.get("ttl", 0) > 0:
                    live_contacts.append(SensorContact(
                        id=f"decoy_{decoy['id']}",
                        estimated_position=Vector2D(x=decoy["x"], y=decoy["y"]),
                        confidence_radius=6.0,
                        confidence_level=0.42,
                        classification=ContactClassification.DECOY,
                        apparent_type=None,
                        apparent_faction=None,
                        last_detected_at=current_time,
                        last_known_heading=0.0,
                        speed_estimate=0.0,
                        is_false_alarm=True
                    ))

        return live_contacts
