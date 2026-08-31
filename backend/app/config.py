from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://poster:poster@localhost:5432/poster_studio"
    frontend_origin: str = "http://localhost:5173"
    renderer_url: str = "http://localhost:8001"

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
