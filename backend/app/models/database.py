import json
from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Boolean, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import settings

Base = declarative_base()
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class PlayerDB(Base):
    __tablename__ = "players"

    id = Column(String, primary_key=True, index=True)
    callsign = Column(String, unique=True, index=True)
    faction = Column(String, default="PACIFIC_FLEET")
    rank = Column(String, default="Commander")
    tactical_credits = Column(Integer, default=50000)
    created_at = Column(DateTime, default=datetime.utcnow)

class FleetConfigDB(Base):
    __tablename__ = "fleet_configs"

    id = Column(String, primary_key=True, index=True)
    player_id = Column(String, index=True)
    name = Column(String, default="Alpha Task Force")
    is_locked_for_deployment = Column(Boolean, default=False)
    tonnage_used = Column(Integer, default=0)
    max_tonnage = Column(Integer, default=30000)
    ships_json = Column(Text, default="[]")  # Serialized list of configured ships and loadouts
    updated_at = Column(DateTime, default=datetime.utcnow)

    def get_ships(self):
        return json.loads(self.ships_json) if self.ships_json else []

    def set_ships(self, ships_data):
        self.ships_json = json.dumps(ships_data)

class MatchRecordDB(Base):
    __tablename__ = "match_records"

    id = Column(String, primary_key=True, index=True)
    scenario = Column(String)
    player_id = Column(String, index=True)
    outcome = Column(String) # VICTORY, DEFEAT, DRAW
    duration_seconds = Column(Float, default=0.0)
    ships_lost = Column(Integer, default=0)
    enemies_destroyed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)
