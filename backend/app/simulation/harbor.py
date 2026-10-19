from typing import Dict, List, Optional
from pydantic import BaseModel, Field
from app.schemas.combat import ShipType, WeaponType, CountermeasureType, Faction
from app.simulation.weapons import WEAPON_CATALOG, get_weapon_copy
from app.simulation.countermeasures import COUNTERMEASURE_CATALOG, get_countermeasure_copy

class ShipClassTemplate(BaseModel):
    ship_type: ShipType
    name: str
    displacement_tons: int
    cost_credits: int
    max_weapon_slots: int
    max_countermeasure_slots: int
    allowed_weapon_types: List[WeaponType]
    base_hull: float
    base_speed: float
    radar_signature: float
    acoustic_signature: float

SHIP_CLASS_TEMPLATES: Dict[ShipType, ShipClassTemplate] = {
    ShipType.DESTROYER: ShipClassTemplate(
        ship_type=ShipType.DESTROYER,
        name="Arleigh Burke Flight III (Guided Missile Destroyer)",
        displacement_tons=9500,
        cost_credits=14000,
        max_weapon_slots=2,
        max_countermeasure_slots=2,
        allowed_weapon_types=[
            WeaponType.NAVAL_GUN_RAILGUN,
            WeaponType.CRUISE_MISSILE,
            WeaponType.ANTI_SHIP_BALLISTIC
        ],
        base_hull=180.0,
        base_speed=32.0,
        radar_signature=0.9,
        acoustic_signature=0.8
    ),
    ShipType.CRUISER: ShipClassTemplate(
        ship_type=ShipType.CRUISER,
        name="Ticonderoga Modernized (Guided Missile Cruiser)",
        displacement_tons=12500,
        cost_credits=18000,
        max_weapon_slots=3,
        max_countermeasure_slots=2,
        allowed_weapon_types=[
            WeaponType.NAVAL_GUN_RAILGUN,
            WeaponType.CRUISE_MISSILE,
            WeaponType.ANTI_SHIP_BALLISTIC
        ],
        base_hull=240.0,
        base_speed=30.0,
        radar_signature=1.1,
        acoustic_signature=1.0
    ),
    ShipType.SUBMARINE: ShipClassTemplate(
        ship_type=ShipType.SUBMARINE,
        name="Virginia-class Block V (Fast Attack Submarine)",
        displacement_tons=7900,
        cost_credits=16000,
        max_weapon_slots=2,
        max_countermeasure_slots=1,
        allowed_weapon_types=[
            WeaponType.HEAVY_TORPEDO,
            WeaponType.CRUISE_MISSILE
        ],
        base_hull=140.0,
        base_speed=25.0,
        radar_signature=0.2, # Near invisible on surface radar while submerged
        acoustic_signature=0.4
    ),
    ShipType.AIRCRAFT_CARRIER: ShipClassTemplate(
        ship_type=ShipType.AIRCRAFT_CARRIER,
        name="Ford-class Strike Platform (Drone Fleet Flagship)",
        displacement_tons=22000,
        cost_credits=26000,
        max_weapon_slots=2,
        max_countermeasure_slots=3,
        allowed_weapon_types=[
            WeaponType.CRUISE_MISSILE,
            WeaponType.ANTI_SHIP_BALLISTIC
        ],
        base_hull=350.0,
        base_speed=28.0,
        radar_signature=1.5,
        acoustic_signature=1.2
    ),
    ShipType.ALIEN_CORVETTE: ShipClassTemplate(
        ship_type=ShipType.ALIEN_CORVETTE,
        name="Bio-Carapace Skiff",
        displacement_tons=6000,
        cost_credits=12000,
        max_weapon_slots=2,
        max_countermeasure_slots=2,
        allowed_weapon_types=[
            WeaponType.ALIEN_PLASMA_LANCE,
            WeaponType.ALIEN_KINETIC_SPIKE
        ],
        base_hull=160.0,
        base_speed=38.0,
        radar_signature=0.6,
        acoustic_signature=0.5
    ),
    ShipType.ALIEN_LEVIATHAN: ShipClassTemplate(
        ship_type=ShipType.ALIEN_LEVIATHAN,
        name="Dreadnought Leviathan",
        displacement_tons=28000,
        cost_credits=35000,
        max_weapon_slots=3,
        max_countermeasure_slots=3,
        allowed_weapon_types=[
            WeaponType.ALIEN_PLASMA_LANCE,
            WeaponType.ALIEN_KINETIC_SPIKE
        ],
        base_hull=450.0,
        base_speed=24.0,
        radar_signature=1.8,
        acoustic_signature=1.6
    )
}

class ShipDraftConfig(BaseModel):
    ship_id: str
    custom_name: str
    ship_type: ShipType
    equipped_weapon_ids: List[str]
    equipped_countermeasure_ids: List[str]

class FleetDraftConfig(BaseModel):
    fleet_name: str
    max_tonnage: int = 35000
    budget_limit: int = 50000
    ships: List[ShipDraftConfig]

class LoadoutValidationResult(BaseModel):
    is_valid: bool
    total_tonnage: int
    total_cost: int
    errors: List[str] = Field(default_factory=list)

def validate_fleet_loadout(config: FleetDraftConfig) -> LoadoutValidationResult:
    total_tonnage = 0
    total_cost = 0
    errors: List[str] = []

    if not config.ships:
        errors.append("Fleet must contain at least one commissioned warship.")

    if len(config.ships) > 4:
        errors.append("Task Force limit exceeded: maximum 4 warships per fleet.")

    for i, ship in enumerate(config.ships):
        if ship.ship_type not in SHIP_CLASS_TEMPLATES:
            errors.append(f"Ship #{i+1} has unknown class '{ship.ship_type}'.")
            continue

        template = SHIP_CLASS_TEMPLATES[ship.ship_type]
        total_tonnage += template.displacement_tons
        total_cost += template.cost_credits

        # Validate weapon slots
        if len(ship.equipped_weapon_ids) > template.max_weapon_slots:
            errors.append(
                f"{ship.custom_name} ({template.name}) exceeds maximum weapon slots "
                f"({len(ship.equipped_weapon_ids)}/{template.max_weapon_slots})."
            )

        for wid in ship.equipped_weapon_ids:
            if wid not in WEAPON_CATALOG:
                errors.append(f"{ship.custom_name} equips non-existent weapon '{wid}'.")
            else:
                w_item = WEAPON_CATALOG[wid]
                if w_item.weapon_type not in template.allowed_weapon_types:
                    errors.append(
                        f"Incompatible loadout: {template.name} cannot mount {w_item.name}."
                    )

        # Validate countermeasure slots
        if len(ship.equipped_countermeasure_ids) > template.max_countermeasure_slots:
            errors.append(
                f"{ship.custom_name} exceeds countermeasure capacity "
                f"({len(ship.equipped_countermeasure_ids)}/{template.max_countermeasure_slots})."
            )

        for cm_id in ship.equipped_countermeasure_ids:
            if cm_id not in COUNTERMEASURE_CATALOG:
                errors.append(f"{ship.custom_name} equips non-existent countermeasure '{cm_id}'.")

    if total_tonnage > config.max_tonnage:
        errors.append(
            f"Fleet displacement {total_tonnage} tons exceeds limit of {config.max_tonnage} tons."
        )

    if total_cost > config.budget_limit:
        errors.append(
            f"Fleet expenditure {total_cost} credits exceeds naval budget of {config.budget_limit} credits."
        )

    return LoadoutValidationResult(
        is_valid=len(errors) == 0,
        total_tonnage=total_tonnage,
        total_cost=total_cost,
        errors=errors
    )
