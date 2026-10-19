import asyncio
import json
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.models.database import init_db
from app.api.endpoints import router as api_router, active_matches
from app.schemas.combat import Faction, Vector2D
from app.simulation.scenarios import setup_scenario_match
from app.simulation.engine import CombatEngine
from app.simulation.ai import TacticalAIController

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("armageddon")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    logger.info("ARMAGEDDON Database and Simulation Kernel initialized.")
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/health")
def health_check():
    return {"status": "ONLINE", "simulation_kernel": "READY"}

async def match_simulation_worker(match_id: str):
    """Background simulation tick loop for an active match."""
    dt = 0.5 # 2 Hz
    while True:
        match = active_matches.get(match_id)
        if not match or not match.get("connections"):
            # No players connected, pause or sleep
            await asyncio.sleep(1.0)
            if match_id not in active_matches:
                break
            continue

        engine: CombatEngine = match["engine"]
        ai: TacticalAIController = match.get("ai")

        try:
            # Update AI
            if ai and not engine.is_finished:
                ai.update(engine, dt)

            # Update Authoritative Physics & Weapons
            if not engine.is_finished:
                engine.tick(dt)

            # Broadcast tactical view to connected clients
            player_faction = match.get("player_faction", Faction.PACIFIC_FLEET)
            state = engine.get_tactical_view_for_faction(player_faction)
            payload = json.dumps({"type": "TACTICAL_TICK", "state": state})

            dead_conns = []
            for ws in match["connections"]:
                try:
                    await ws.send_text(payload)
                except Exception:
                    dead_conns.append(ws)

            for dead in dead_conns:
                match["connections"].remove(dead)

        except Exception as e:
            logger.error(f"Error in match loop {match_id}: {e}")

        await asyncio.sleep(dt)

@app.websocket("/ws/combat/{match_id}")
async def combat_websocket(websocket: WebSocket, match_id: str):
    await websocket.accept()

    # If match does not exist, automatically bootstrap with Scenario A
    if match_id not in active_matches:
        engine, ai_ctrl = setup_scenario_match("SCENARIO_A")
        active_matches[match_id] = {
            "engine": engine,
            "ai": ai_ctrl,
            "player_faction": Faction.PACIFIC_FLEET,
            "scenario_id": "SCENARIO_A",
            "connections": []
        }

    match = active_matches[match_id]
    match["connections"].append(websocket)

    # Ensure background tick task is running
    if "task" not in match or match["task"].done():
        match["task"] = asyncio.create_task(match_simulation_worker(match_id))

    engine: CombatEngine = match["engine"]

    try:
        # Send initial immediate snapshot
        init_state = engine.get_tactical_view_for_faction(match["player_faction"])
        await websocket.send_text(json.dumps({"type": "TACTICAL_TICK", "state": init_state}))

        while True:
            raw_data = await websocket.receive_text()
            data = json.loads(raw_data)
            msg_type = data.get("type")

            if msg_type == "ATTACK":
                attacker_id = data.get("attacker_id")
                weapon_id = data.get("weapon_id")
                target_pos_dict = data.get("target_pos", {})
                target_pos = Vector2D(x=target_pos_dict.get("x", 0.0), y=target_pos_dict.get("y", 0.0))
                target_ship_id = data.get("target_ship_id")

                success, message, proj_id = engine.launch_attack(
                    attacker_id=attacker_id,
                    weapon_id=weapon_id,
                    target_pos=target_pos,
                    target_ship_id=target_ship_id
                )
                await websocket.send_text(json.dumps({
                    "type": "ACTION_FEEDBACK",
                    "action": "ATTACK",
                    "success": success,
                    "message": message,
                    "projectile_id": proj_id
                }))

            elif msg_type == "COUNTERMEASURE":
                ship_id = data.get("ship_id")
                cm_id = data.get("cm_id")
                success, message = engine.deploy_countermeasure(ship_id=ship_id, cm_id=cm_id)
                await websocket.send_text(json.dumps({
                    "type": "ACTION_FEEDBACK",
                    "action": "COUNTERMEASURE",
                    "success": success,
                    "message": message
                }))

            elif msg_type == "MANEUVER":
                ship_id = data.get("ship_id")
                heading = data.get("heading")
                speed = data.get("speed")
                ship = engine.get_ship(ship_id)
                if ship:
                    if heading is not None:
                        ship.heading = float(heading)
                    if speed is not None:
                        ship.speed = min(ship.max_speed, max(0.0, float(speed)))
                await websocket.send_text(json.dumps({
                    "type": "ACTION_FEEDBACK",
                    "action": "MANEUVER",
                    "success": True,
                    "message": f"Maneuver orders acknowledged for {ship.name if ship else ship_id}."
                }))

            elif msg_type == "RETREAT":
                ship_id = data.get("ship_id")
                faction = match.get("player_faction", Faction.PACIFIC_FLEET)
                success, message = engine.order_retreat(faction=faction, ship_id=ship_id)
                await websocket.send_text(json.dumps({
                    "type": "ACTION_FEEDBACK",
                    "action": "RETREAT",
                    "success": success,
                    "message": message
                }))

            elif msg_type == "RESCUE":
                rescuer_id = data.get("rescuer_id")
                target_disabled_id = data.get("target_disabled_id")
                success, message = engine.order_rescue(rescuer_id=rescuer_id, target_disabled_id=target_disabled_id)
                await websocket.send_text(json.dumps({
                    "type": "ACTION_FEEDBACK",
                    "action": "RESCUE",
                    "success": success,
                    "message": message
                }))

    except WebSocketDisconnect:
        logger.info(f"Client disconnected from match {match_id}")
        if websocket in match["connections"]:
            match["connections"].remove(websocket)
    except Exception as e:
        logger.error(f"WebSocket error in match {match_id}: {e}")
        if websocket in match["connections"]:
            match["connections"].remove(websocket)
