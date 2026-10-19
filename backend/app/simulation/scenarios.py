import uuid
from typing import Dict, Any, Optional
from app.schemas.combat import (
    ShipState, ShipType, Faction, Vector2D, SubsystemStatus, DamageState,
    MissionObjective, ShipRole
)
from app.simulation.weapons import get_weapon_copy
from app.simulation.countermeasures import get_countermeasure_copy
from app.simulation.engine import CombatEngine
from app.simulation.ai import TacticalAIController

def create_default_player_ship(
    ship_id: str,
    name: str,
    ship_type: ShipType,
    faction: Faction,
    position: Vector2D,
    heading: float = 0.0,
    role: ShipRole = ShipRole.COMBAT
) -> ShipState:
    weapons = []
    cms = []

    if ship_type == ShipType.DESTROYER:
        weapons = [get_weapon_copy("railgun_mark1"), get_weapon_copy("tomahawk_asm")]
        cms = [get_countermeasure_copy("phalanx_ciws"), get_countermeasure_copy("chaff_launcher")]
        base_hull = 180.0
        max_speed = 32.0
    elif ship_type == ShipType.CRUISER:
        weapons = [
            get_weapon_copy("railgun_mark1"),
            get_weapon_copy("tomahawk_asm"),
            get_weapon_copy("ballistic_strike")
        ]
        cms = [get_countermeasure_copy("phalanx_ciws"), get_countermeasure_copy("an_slq32_ecm")]
        base_hull = 240.0
        max_speed = 30.0
    elif ship_type == ShipType.SUBMARINE:
        weapons = [get_weapon_copy("torpedo_mk48"), get_weapon_copy("tomahawk_asm")]
        cms = [get_countermeasure_copy("emergency_rudder")]
        base_hull = 140.0
        max_speed = 25.0
    elif ship_type == ShipType.AIRCRAFT_CARRIER:
        weapons = [get_weapon_copy("tomahawk_asm"), get_weapon_copy("ballistic_strike")]
        cms = [
            get_countermeasure_copy("phalanx_ciws"),
            get_countermeasure_copy("an_slq32_ecm"),
            get_countermeasure_copy("damage_control_party")
        ]
        base_hull = 350.0
        max_speed = 28.0
    elif ship_type == ShipType.FRIGATE_SUPPORT:
        weapons = [get_weapon_copy("railgun_mark1")]
        cms = [get_countermeasure_copy("phalanx_ciws"), get_countermeasure_copy("damage_control_party")]
        base_hull = 120.0
        max_speed = 30.0
        role = ShipRole.SUPPORT
    else:
        weapons = [get_weapon_copy("railgun_mark1")]
        cms = [get_countermeasure_copy("phalanx_ciws")]
        base_hull = 150.0
        max_speed = 30.0

    return ShipState(
        id=ship_id,
        name=name,
        faction=faction,
        ship_type=ship_type,
        role=role,
        position=position,
        heading=heading,
        speed=15.0,
        max_speed=max_speed,
        max_hull=base_hull,
        damage_state=DamageState.OPERATIONAL,
        subsystems=SubsystemStatus(hull=base_hull),
        weapons=weapons,
        countermeasures=cms
    )

def create_alien_ship(
    ship_id: str,
    name: str,
    ship_type: ShipType,
    position: Vector2D,
    heading: float = 180.0
) -> ShipState:
    if ship_type == ShipType.ALIEN_LEVIATHAN:
        weapons = [
            get_weapon_copy("alien_plasma_lance"),
            get_weapon_copy("alien_kinetic_spike")
        ]
        cms = [get_countermeasure_copy("an_slq32_ecm"), get_countermeasure_copy("phalanx_ciws")]
        base_hull = 450.0
        max_speed = 24.0
        role = ShipRole.COMBAT
    elif ship_type == ShipType.ALIEN_SCOUT:
        weapons = [get_weapon_copy("alien_plasma_lance")]
        cms = [get_countermeasure_copy("emergency_rudder")]
        base_hull = 100.0
        max_speed = 42.0
        role = ShipRole.RECONNAISSANCE
    else:
        weapons = [get_weapon_copy("alien_plasma_lance")]
        cms = [get_countermeasure_copy("emergency_rudder")]
        base_hull = 160.0
        max_speed = 36.0
        role = ShipRole.COMBAT

    return ShipState(
        id=ship_id,
        name=name,
        faction=Faction.THE_HARVESTERS,
        ship_type=ship_type,
        role=role,
        position=position,
        heading=heading,
        speed=18.0,
        max_speed=max_speed,
        max_hull=base_hull,
        damage_state=DamageState.OPERATIONAL,
        subsystems=SubsystemStatus(hull=base_hull),
        weapons=weapons,
        countermeasures=cms
    )

def setup_scenario_match(scenario_id: str, custom_ships: list = None) -> tuple[CombatEngine, Optional[TacticalAIController]]:
    match_id = f"match_{uuid.uuid4().hex[:8]}"
    engine = CombatEngine(match_id=match_id, scenario_id=scenario_id)
    ai_controller = None

    if scenario_id == "SCENARIO_B" or scenario_id == "SCENARIO_FIRST_CONTACT":
        # Scenario B: First Contact — Humanity vs. Alien Threat
        if custom_ships:
            for s in custom_ships:
                engine.add_ship(s)
        else:
            engine.add_ship(create_default_player_ship(
                "uss_sentinel", "USS Sentinel (D-57)", ShipType.CRUISER,
                Faction.PACIFIC_FLEET, Vector2D(x=10.0, y=15.0), heading=30.0
            ))
            engine.add_ship(create_default_player_ship(
                "uss_meridian", "USS Meridian (CVN-72)", ShipType.CARRIER,
                Faction.PACIFIC_FLEET, Vector2D(x=-5.0, y=10.0), heading=25.0
            ))

        # Disabled Frigate that needs rescue
        disabled_frigate = create_default_player_ship(
            "uss_vandegrift", "USS Vandegrift (FFG-48)", ShipType.FRIGATE_SUPPORT,
            Faction.PACIFIC_FLEET, Vector2D(x=8.0, y=17.0), heading=10.0, role=ShipRole.SUPPORT
        )
        disabled_frigate.damage_state = DamageState.DISABLED
        disabled_frigate.subsystems.hull = 12.0
        disabled_frigate.subsystems.propulsion = 0.0
        disabled_frigate.speed = 0.0
        engine.add_ship(disabled_frigate)

        # Hostile Extraterrestrial Vanguard
        engine.add_ship(create_alien_ship(
            "alien_dreadnought_1", "Alien Leviathan 'Nemesis'",
            ShipType.ALIEN_LEVIATHAN, Vector2D(x=20.0, y=75.0), heading=200.0
        ))
        engine.add_ship(create_alien_ship(
            "alien_scout_1", "Bio-Scout Alpha",
            ShipType.ALIEN_SCOUT, Vector2D(x=-18.0, y=60.0), heading=190.0
        ))
        engine.add_ship(create_alien_ship(
            "alien_skiff_1", "Bio-Skiff Stryker",
            ShipType.ALIEN_CORVETTE, Vector2D(x=5.0, y=68.0), heading=195.0
        ))

        # Objectives
        engine.add_objective(MissionObjective(
            id="obj_destroy_command",
            title="Neutralize Alien Command Leviathan",
            description="Destroy the alien command nexus to break hostile task force cohesion.",
            is_mandatory=True,
            target_id="alien_dreadnought_1"
        ))
        engine.add_objective(MissionObjective(
            id="obj_rescue_vandegrift",
            title="Rescue Disabled Scout USS Vandegrift",
            description="Approach within 5km of the disabled frigate to deploy rescue teams.",
            is_mandatory=True,
            target_id="uss_vandegrift"
        ))

        ai_controller = TacticalAIController(faction=Faction.THE_HARVESTERS)

    elif scenario_id == "SCENARIO_A" or scenario_id == "SCENARIO_NATION_VS_NATION":
        # Scenario A: Nation vs. Nation (Pacific Fleet vs Eurasian Union)
        engine.add_ship(create_default_player_ship(
            "uss_sentinel", "USS Sentinel (D-57)", ShipType.CRUISER,
            Faction.PACIFIC_FLEET, Vector2D(x=0.0, y=10.0), heading=0.0
        ))
        engine.add_ship(create_default_player_ship(
            "uss_meridian", "USS Meridian (CVN-72)", ShipType.CARRIER,
            Faction.PACIFIC_FLEET, Vector2D(x=15.0, y=5.0), heading=10.0
        ))

        engine.add_ship(create_default_player_ship(
            "ru_ddg_1", "Admiral Gorshkov (FFG-454)", ShipType.DESTROYER,
            Faction.EURASIAN_UNION, Vector2D(x=-5.0, y=80.0), heading=180.0
        ))
        engine.add_ship(create_default_player_ship(
            "ru_cg_1", "Marshal Ustinov (CG-055)", ShipType.CRUISER,
            Faction.EURASIAN_UNION, Vector2D(x=20.0, y=85.0), heading=190.0
        ))

        engine.add_objective(MissionObjective(
            id="obj_defeat_opponents",
            title="Defeat Opposing Eurasian Task Force",
            description="Neutralize or force the withdrawal of all hostile warships in contested waters.",
            is_mandatory=True
        ))
        engine.add_objective(MissionObjective(
            id="obj_protect_flagship",
            title="Preserve Flagship USS Bunker Hill",
            description="Prevent critical structural damage to the task force command cruiser.",
            is_mandatory=False,
            target_id="us_cg_1"
        ))

        ai_controller = TacticalAIController(faction=Faction.EURASIAN_UNION)

    else:
        # Scenario C: Temporary Alliance — Joint Defense
        engine.add_ship(create_default_player_ship(
            "us_flagship", "USS Nimitz Modern (CVN-68)", ShipType.AIRCRAFT_CARRIER,
            Faction.PACIFIC_FLEET, Vector2D(x=5.0, y=0.0), heading=0.0
        ))
        engine.add_ship(create_default_player_ship(
            "us_escort", "USS Chung-Hoon (DDG-93)", ShipType.DESTROYER,
            Faction.PACIFIC_FLEET, Vector2D(x=-12.0, y=10.0), heading=0.0
        ))
        engine.add_ship(create_default_player_ship(
            "allied_frigate", "Coalition Guard 'Varyag'", ShipType.CRUISER,
            Faction.EURASIAN_UNION, Vector2D(x=22.0, y=8.0), heading=5.0
        ))

        engine.add_ship(create_alien_ship(
            "alien_overlord", "Harvester Mothership 'Abyss'",
            ShipType.ALIEN_LEVIATHAN, Vector2D(x=5.0, y=85.0), heading=180.0
        ))
        engine.add_ship(create_alien_ship(
            "alien_skiff_a", "Bio-Skiff Stryker 1",
            ShipType.ALIEN_CORVETTE, Vector2D(x=-20.0, y=70.0), heading=175.0
        ))
        engine.add_ship(create_alien_ship(
            "alien_skiff_b", "Bio-Skiff Stryker 2",
            ShipType.ALIEN_CORVETTE, Vector2D(x=30.0, y=72.0), heading=185.0
        ))

        engine.add_objective(MissionObjective(
            id="obj_defend_carrier",
            title="Defend Fleet Flagship USS Nimitz",
            description="Prevent the destruction of the allied strike platform.",
            is_mandatory=True,
            target_id="us_flagship"
        ))
        engine.add_objective(MissionObjective(
            id="obj_defeat_mothership",
            title="Neutralize Harvester Mothership 'Abyss'",
            description="Concentrate long-range firepower to eliminate the extraterrestrial core.",
            is_mandatory=True,
            target_id="alien_overlord"
        ))

        ai_controller = TacticalAIController(faction=Faction.THE_HARVESTERS)

    return engine, ai_controller
