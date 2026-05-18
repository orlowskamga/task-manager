from pydantic_settings import BaseSettings
import json


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://taskmanager:taskmanager_secret@localhost:5432/taskmanager"
    DATABASE_URL_SYNC: str = "postgresql://taskmanager:taskmanager_secret@localhost:5432/taskmanager"
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24h
    CORS_ORIGINS: str = '["http://localhost:5173","http://localhost:3000"]'

    @property
    def cors_origins_list(self) -> list[str]:
        return json.loads(self.CORS_ORIGINS)

    class Config:
        env_file = ".env"


settings = Settings()
