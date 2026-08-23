from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # These exact variable names now match your .env file
    HF_API_TOKEN: str
    HF_MODEL_URL: str = "jaitn9876/KOLAM_ART"
    CORS_ORIGINS: str = "*"

    # This tells Pydantic exactly where to find the file
    model_config = SettingsConfigDict(env_file="app/.env", env_file_encoding="utf-8")

settings = Settings()