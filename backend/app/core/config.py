import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "ARMAGEDDON — Naval Warfare & Global Defense Simulation"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./armageddon.db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "*"
    ]
    TICK_RATE_HZ: float = 2.0  # Tactical ticks per second
    DEFENSIVE_WINDOW_SECONDS: float = 8.0  # Window to deploy countermeasures

settings = Settings()
