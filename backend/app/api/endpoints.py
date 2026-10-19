import asyncio
import json
from typing import Dict, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from pydantic import BaseModel

from app.schemas.combat import Faction, Vector2D, ShipType
from app.simulation.weapons import WEAPON_CATALOG
from app.simulation.countermeasures import COUNTERMEASURE_CATALOG
from app.simulation.harbor import SHIP_CLASS_TEMPLATES, FleetDraftConfig, validate_fleet_loadout
from app.simulation.scenarios import setup_scenario_match, create_default_player_ship
from app.simulation.engine import CombatEngine
from app.simulation.ai import TacticalAIController

router = APIRouter()

# Active in-memory matches
active_matches: Dict[str, Dict] = {}

class StartMatchRequest(BaseModel):
    scenario_id: str = "SCENARIO_A"
    player_faction: Faction = Faction.PACIFIC_FLEET
    custom_fleet: Optional[FleetDraftConfig] = None

@router.get("/scenarios")
def list_scenarios():
    return [
        {
            "id": "SCENARIO_A",
            "title": "First Contact — Humanity vs. Alien Threat",
            "description": "An unidentified alien force enters Earth's oceans. Command the Pacific Fleet vanguard, decipher extraterrestrial behavior, and eliminate the hostile dreadnought.",
            "threat_rating": "EXTREME",
            "enemy_faction": "THE_HARVESTERS",
            "player_faction": "PACIFIC_FLEET"
        },
        {
            "id": "SCENARIO_B",
            "title": "Nation vs. Nation — Strategic Naval Duel",
            "description": "Symmetrical naval standoff between competing superpowers in contested waters. Maneuver through sensor fog-of-war and duel with advanced missile systems.",
            "threat_rating": "TACTICAL",
            "enemy_faction": "EURASIAN_UNION",
            "player_faction": "PACIFIC_FLEET"
        },
        {
            "id": "SCENARIO_C",
            "title": "Temporary Alliance — Joint Defense",
            "description": "Human factions forge a temporary pact to hold back an overwhelming alien swarm. Coordinate combined defense and protect the fleet flagship.",
            "threat_rating": "APOCALYPTIC",
            "enemy_faction": "THE_HARVESTERS",
            "player_faction": "PACIFIC_FLEET"
        }
    ]

@router.get("/harbor/catalog")
def get_harbor_catalog():
    return {
        "ship_templates": {k.value: v.model_dump() for k, v in SHIP_CLASS_TEMPLATES.items()},
        "weapons": {k: v.model_dump() for k, v in WEAPON_CATALOG.items()},
        "countermeasures": {k: v.model_dump() for k, v in COUNTERMEASURE_CATALOG.items()}
    }

@router.post("/harbor/validate")
def validate_fleet(config: FleetDraftConfig):
    result = validate_fleet_loadout(config)
    return result.model_dump()

@router.post("/matches/start")
def start_match(req: StartMatchRequest):
    # Convert custom fleet draft to ShipState if provided
    custom_ships = None
    if req.custom_fleet:
        val = validate_fleet_loadout(req.custom_fleet)
        if not val.is_valid:
            raise HTTPException(status_code=400, detail={"errors": val.errors})

        custom_ships = []
        start_positions = [
            Vector2D(x=10.0, y=15.0),
            Vector2D(x=-5.0, y=10.0),
            Vector2D(x=0.0, y=0.0),
            Vector2D(x=20.0, y=5.0)
        ]
        for idx, draft in enumerate(req.custom_fleet.ships):
            ship = create_default_player_ship(
                ship_id=f"player_ship_{idx+1}",
                name=draft.custom_name,
                ship_type=draft.ship_type,
                faction=req.player_faction,
                position=start_positions[idx % len(start_positions)],
                heading=20.0
            )
            # Override weapons from draft
            custom_weapons = [WEAPON_CATALOG[wid].model_copy(deep=True) for wid in draft.equipped_weapon_ids if wid in WEAPON_CATALOG]
            custom_cms = [COUNTERMEASURE_CATALOG[cid].model_copy(deep=True) for cid in draft.equipped_countermeasure_ids if cid in COUNTERMEASURE_CATALOG]
            ship.weapons = custom_weapons
            ship.countermeasures = custom_cms
            custom_ships.append(ship)

    engine, ai_ctrl = setup_scenario_match(req.scenario_id, custom_ships)
    active_matches[engine.match_id] = {
        "engine": engine,
        "ai": ai_ctrl,
        "player_faction": req.player_faction,
        "scenario_id": req.scenario_id,
        "connections": []
    }
    return {
        "match_id": engine.match_id,
        "scenario_id": req.scenario_id,
        "player_faction": req.player_faction.value,
        "status": "INITIALIZED"
    }

@router.get("/matches/{match_id}/state")
def get_match_state(match_id: str, faction: Optional[Faction] = Faction.PACIFIC_FLEET):
    match = active_matches.get(match_id)
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")
    engine: CombatEngine = match["engine"]
    return engine.get_tactical_view_for_faction(faction)
