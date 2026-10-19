import pytest
from app.schemas.combat import (
    ShipType, Faction, Vector2D, WeaponType, CountermeasureType, DamageState,
    BattlePhase, MissionOutcomeType, MissionObjective
)
from app.simulation.harbor import FleetDraftConfig, ShipDraftConfig, validate_fleet_loadout
from app.simulation.engine import CombatEngine
from app.simulation.scenarios import create_default_player_ship, create_alien_ship
from app.simulation.uncertainty import SensorModel

def test_harbor_loadout_validation():
    valid_fleet = FleetDraftConfig(
        fleet_name="Task Force 77",
        max_tonnage=35000,
        budget_limit=50000,
        ships=[
            ShipDraftConfig(
                ship_id="ship_1",
                custom_name="USS Decatur",
                ship_type=ShipType.DESTROYER,
                equipped_weapon_ids=["railgun_mark1", "tomahawk_asm"],
                equipped_countermeasure_ids=["phalanx_ciws", "chaff_launcher"]
            ),
            ShipDraftConfig(
                ship_id="ship_2",
                custom_name="USS Lake Champlain",
                ship_type=ShipType.CRUISER,
                equipped_weapon_ids=["railgun_mark1", "tomahawk_asm", "ballistic_strike"],
                equipped_countermeasure_ids=["phalanx_ciws", "an_slq32_ecm"]
            )
        ]
    )
    result = validate_fleet_loadout(valid_fleet)
    assert result.is_valid is True
    assert result.total_tonnage == 9500 + 12500
    assert result.total_cost == 14000 + 18000
    assert len(result.errors) == 0

    invalid_fleet = FleetDraftConfig(
        fleet_name="Illegal Sub",
        max_tonnage=35000,
        budget_limit=50000,
        ships=[
            ShipDraftConfig(
                ship_id="sub_1",
                custom_name="USS Seawolf",
                ship_type=ShipType.SUBMARINE,
                equipped_weapon_ids=["railgun_mark1"],
                equipped_countermeasure_ids=["emergency_rudder"]
            )
        ]
    )
    res_invalid = validate_fleet_loadout(invalid_fleet)
    assert res_invalid.is_valid is False
    assert any("cannot mount" in err for err in res_invalid.errors)

def test_combat_engine_attack_and_cooldown():
    engine = CombatEngine(match_id="test_match_1")
    player_ship = create_default_player_ship(
        "p1", "USS Test DDG", ShipType.DESTROYER, Faction.PACIFIC_FLEET, Vector2D(x=0.0, y=0.0)
    )
    alien_ship = create_alien_ship(
        "a1", "Alien Corvette", ShipType.ALIEN_CORVETTE, Vector2D(x=0.0, y=25.0)
    )
    engine.add_ship(player_ship)
    engine.add_ship(alien_ship)

    railgun = next(w for w in player_ship.weapons if w.id == "railgun_mark1")
    initial_ammo = railgun.ammo_remaining

    success, msg, proj_id = engine.launch_attack(
        attacker_id=player_ship.id,
        weapon_id="railgun_mark1",
        target_pos=alien_ship.position,
        target_ship_id=alien_ship.id
    )
    assert success is True
    assert proj_id is not None
    assert railgun.ammo_remaining == initial_ammo - 1
    assert railgun.current_cooldown > 0

    success2, msg2, _ = engine.launch_attack(
        attacker_id=player_ship.id,
        weapon_id="railgun_mark1",
        target_pos=alien_ship.position,
        target_ship_id=alien_ship.id
    )
    assert success2 is False
    assert "cooling down" in msg2

def test_countermeasure_deployment_and_damage_control():
    engine = CombatEngine(match_id="test_match_2")
    ship = create_default_player_ship(
        "p1", "USS Carrier", ShipType.AIRCRAFT_CARRIER, Faction.PACIFIC_FLEET, Vector2D(x=0.0, y=0.0)
    )
    engine.add_ship(ship)

    ship.subsystems.hull = 40.0
    ship.subsystems.propulsion = 20.0
    ship.damage_state = DamageState.CRITICAL

    success, msg = engine.deploy_countermeasure(ship.id, "damage_control_party")
    assert success is True
    assert ship.subsystems.hull == 65.0
    assert ship.subsystems.propulsion == 55.0
    assert ship.damage_state == DamageState.DAMAGED

def test_sensor_uncertainty_and_confidence():
    ship_obs = create_default_player_ship(
        "obs", "USS Watcher", ShipType.DESTROYER, Faction.PACIFIC_FLEET, Vector2D(x=0.0, y=0.0)
    )
    enemy_close = create_alien_ship(
        "e_close", "Alien Scout", ShipType.ALIEN_SCOUT, Vector2D(x=0.0, y=30.0)
    )
    enemy_far = create_alien_ship(
        "e_far", "Alien Dreadnought", ShipType.ALIEN_LEVIATHAN, Vector2D(x=0.0, y=120.0)
    )

    all_ships = {
        ship_obs.id: ship_obs,
        enemy_close.id: enemy_close,
        enemy_far.id: enemy_far
    }

    contacts = SensorModel.generate_contacts_for_faction(Faction.PACIFIC_FLEET, all_ships)
    assert len(contacts) == 1
    assert contacts[0].id == f"contact_{enemy_close.id}"
    assert contacts[0].confidence_level > 0.4

def test_strategic_retreat_mechanics():
    engine = CombatEngine(match_id="test_retreat")
    ship = create_default_player_ship(
        "retreater", "USS Retreating", ShipType.DESTROYER, Faction.PACIFIC_FLEET, Vector2D(x=0.0, y=-20.0)
    )
    alien = create_alien_ship("a_blocker", "Alien Corvette", ShipType.ALIEN_CORVETTE, Vector2D(x=0.0, y=50.0))
    engine.add_ship(ship)
    engine.add_ship(alien)

    success, msg = engine.order_retreat(faction=Faction.PACIFIC_FLEET)
    assert success is True
    assert ship.is_retreating is True
    assert engine.current_phase == BattlePhase.RETREATING

    # Advance simulation until ship crosses y <= -25.0
    engine.tick(delta_time=50.0)
    assert ship.position.y <= -25.0
    # Match should conclude with WITHDRAWAL
    assert engine.is_finished is True
    assert engine.outcome == MissionOutcomeType.WITHDRAWAL

def test_rescue_disabled_vessel():
    engine = CombatEngine(match_id="test_rescue")
    rescuer = create_default_player_ship(
        "rescuer", "USS Chung-Hoon", ShipType.DESTROYER, Faction.PACIFIC_FLEET, Vector2D(x=0.0, y=0.0)
    )
    disabled_ship = create_default_player_ship(
        "disabled", "USS Disabled", ShipType.DESTROYER, Faction.PACIFIC_FLEET, Vector2D(x=2.0, y=2.0)
    )
    disabled_ship.damage_state = DamageState.DISABLED
    disabled_ship.subsystems.hull = 10.0

    engine.add_ship(rescuer)
    engine.add_ship(disabled_ship)

    obj = MissionObjective(
        id="rescue_obj",
        title="Rescue USS Disabled",
        description="Rescue crew",
        is_mandatory=True,
        target_id=disabled_ship.id
    )
    engine.add_objective(obj)

    # Order rescue
    success, msg = engine.order_rescue(rescuer_id=rescuer.id, target_disabled_id=disabled_ship.id)
    assert success is True
    assert disabled_ship.is_rescued is True
    assert obj.is_completed is True
    assert disabled_ship.damage_state in [DamageState.CRITICAL, DamageState.DAMAGED]

def test_committed_attack_policy_on_sunk_target():
    engine = CombatEngine(match_id="test_target_loss")
    attacker = create_default_player_ship(
        "att", "USS Attacker", ShipType.CRUISER, Faction.PACIFIC_FLEET, Vector2D(x=0.0, y=0.0)
    )
    target = create_alien_ship(
        "tar", "Alien Target", ShipType.ALIEN_CORVETTE, Vector2D(x=0.0, y=30.0)
    )
    engine.add_ship(attacker)
    engine.add_ship(target)

    # Launch missile
    success, _, proj_id = engine.launch_attack(attacker.id, "tomahawk_asm", target.position, target.id)
    assert success is True

    # Before projectile arrives, target is sunk by something else
    target.subsystems.hull = 0.0
    target.damage_state = DamageState.SINKING

    # Advance time until impact
    proj = engine.projectiles[proj_id]
    engine.tick(delta_time=proj.total_travel_time + 1.0)

    # Must resolve as MISS/splash at ocean without crashing
    assert any(e.event_type == "ATTACK_MISSED" and "already destroyed" in e.message for e in engine.events)
