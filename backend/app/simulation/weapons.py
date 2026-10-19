from typing import Dict
from app.schemas.combat import WeaponMount, WeaponType

WEAPON_CATALOG: Dict[str, WeaponMount] = {
    "railgun_mark1": WeaponMount(
        id="railgun_mark1",
        weapon_type=WeaponType.NAVAL_GUN_RAILGUN,
        name="Mark 64 Hyper-Velocity Railgun",
        damage=45.0,
        max_range=40.0,
        min_range=2.0,
        cooldown_seconds=4.0,
        ammo_remaining=30,
        max_ammo=30,
        projectile_speed=65.0,
        accuracy_base=0.88,
        trajectory_type="ballistic_direct"
    ),
    "tomahawk_asm": WeaponMount(
        id="tomahawk_asm",
        weapon_type=WeaponType.CRUISE_MISSILE,
        name="Tactical Tomahawk Sea-Skimmer",
        damage=75.0,
        max_range=90.0,
        min_range=10.0,
        cooldown_seconds=12.0,
        ammo_remaining=8,
        max_ammo=8,
        projectile_speed=32.0,
        accuracy_base=0.92,
        trajectory_type="sea_skimming"
    ),
    "ballistic_strike": WeaponMount(
        id="ballistic_strike",
        weapon_type=WeaponType.ANTI_SHIP_BALLISTIC,
        name="Hyper-Strike Ballistic ASBM",
        damage=110.0,
        max_range=120.0,
        min_range=25.0,
        cooldown_seconds=20.0,
        ammo_remaining=4,
        max_ammo=4,
        projectile_speed=50.0,
        accuracy_base=0.85,
        trajectory_type="high_ballistic"
    ),
    "torpedo_mk48": WeaponMount(
        id="torpedo_mk48",
        weapon_type=WeaponType.HEAVY_TORPEDO,
        name="Mk 48 Mod 7 CBASS Torpedo",
        damage=125.0,
        max_range=30.0,
        min_range=3.0,
        cooldown_seconds=15.0,
        ammo_remaining=6,
        max_ammo=6,
        projectile_speed=20.0,
        accuracy_base=0.80,
        trajectory_type="torpedo"
    ),
    "alien_plasma_lance": WeaponMount(
        id="alien_plasma_lance",
        weapon_type=WeaponType.ALIEN_PLASMA_LANCE,
        name="Xenomorphic Plasma Siphon",
        damage=65.0,
        max_range=60.0,
        min_range=0.0,
        cooldown_seconds=7.0,
        ammo_remaining=999,
        max_ammo=999,
        projectile_speed=55.0,
        accuracy_base=0.90,
        trajectory_type="energy"
    ),
    "alien_kinetic_spike": WeaponMount(
        id="alien_kinetic_spike",
        weapon_type=WeaponType.ALIEN_KINETIC_SPIKE,
        name="Gravimetric Spindle Pod",
        damage=95.0,
        max_range=80.0,
        min_range=8.0,
        cooldown_seconds=14.0,
        ammo_remaining=12,
        max_ammo=12,
        projectile_speed=40.0,
        accuracy_base=0.87,
        trajectory_type="ballistic"
    )
}

def get_weapon_copy(weapon_id: str) -> WeaponMount:
    if weapon_id not in WEAPON_CATALOG:
        raise ValueError(f"Unknown weapon id: {weapon_id}")
    return WEAPON_CATALOG[weapon_id].model_copy(deep=True)
