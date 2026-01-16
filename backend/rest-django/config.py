from pydantic_settings import BaseSettings
from typing import List
import json
import os

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str
    
    # JWT
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    # Configuración para demo/presentación - permite todos los orígenes
    FRONTEND_URL: str = "http://localhost:3000"
    ALLOWED_ORIGINS: str = '["http://localhost:3000"]'
    # CORS_ALLOW_ALL=True permite todos los orígenes (útil para presentaciones/demos)
    # Si es False, solo permite los orígenes en ALLOWED_ORIGINS
    CORS_ALLOW_ALL: bool = True  # True por defecto para demo/presentación
    
    # API
    API_V1_PREFIX: str = "/api/v1"
    PROJECT_NAME: str = "Cinema REST API"
    DEBUG: bool = True
    
    @property
    def origins_list(self) -> List[str]:
        """Convierte string JSON a lista de origenes permitidos"""
        # Si CORS_ALLOW_ALL está activado, permite todos los orígenes
        # Útil para demos y presentaciones donde no se conoce el dominio exacto
        if self.CORS_ALLOW_ALL:
            return ["*"]
        
        try:
            origins = json.loads(self.ALLOWED_ORIGINS)
            # Asegurarse de que siempre incluya el FRONTEND_URL si está definido
            if self.FRONTEND_URL not in origins:
                origins.append(self.FRONTEND_URL)
            return origins
        except:
            return [self.FRONTEND_URL] if self.FRONTEND_URL else ["*"]
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()