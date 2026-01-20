from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Auth Service"
    DEBUG: bool = True
    # Rate Limiting
    RATE_LIMIT_LOGIN: int = 5
    RATE_LIMIT_LOGIN_MINUTES: int = 15
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
