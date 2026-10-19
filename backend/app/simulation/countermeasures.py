from typing import Dict
from app.schemas.combat import CountermeasureMount, CountermeasureType

COUNTERMEASURE_CATALOG: Dict[str, CountermeasureMount] = {
    "phalanx_ciws": CountermeasureMount(
        id="phalanx_ciws",
        countermeasure_type=CountermeasureType.CIWS_INTERCEPTOR,
        name="Phalanx Block 1B CIWS / RAM",
        charges_remaining=10,
        max_charges=10,
        cooldown_seconds=6.0,
        effectiveness=0.65 # 65% base intercept probability against cruise missiles & spikes
    ),
    "chaff_launcher": CountermeasureMount(
        id="chaff_launcher",
        countermeasure_type=CountermeasureType.CHAFF_FLARE_DECOY,
        name="SRBOC Chaff & Thermal Flare Array",
        charges_remaining=6,
        max_charges=6,
        cooldown_seconds=8.0,
        effectiveness=0.55 # 55% base deflection probability against radar/IR homing
    ),
    "an_slq32_ecm": CountermeasureMount(
        id="an_slq32_ecm",
        countermeasure_type=CountermeasureType.ELECTRONIC_JAMMING,
        name="AN/SLQ-32(V)6 Active ECM Jammer",
        charges_remaining=4,
        max_charges=4,
        cooldown_seconds=15.0,
        effectiveness=0.70 # 70% chance to disrupt guided lock
    ),
    "emergency_rudder": CountermeasureMount(
        id="emergency_rudder",
        countermeasure_type=CountermeasureType.EVASIVE_MANEUVER,
        name="Tactical Evasive Turn & Flank Speed",
        charges_remaining=99,
        max_charges=99,
        cooldown_seconds=12.0,
        effectiveness=0.40 # 40% added miss chance against ballistic & torpedoes
    ),
    "damage_control_party": CountermeasureMount(
        id="damage_control_party",
        countermeasure_type=CountermeasureType.DAMAGE_CONTROL,
        name="Damage Control & Fire Suppression Team",
        charges_remaining=3,
        max_charges=3,
        cooldown_seconds=25.0,
        effectiveness=0.85 # High reliability repair action
    )
}

def get_countermeasure_copy(cm_id: str) -> CountermeasureMount:
    if cm_id not in COUNTERMEASURE_CATALOG:
        raise ValueError(f"Unknown countermeasure id: {cm_id}")
    return COUNTERMEASURE_CATALOG[cm_id].model_copy(deep=True)
