from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import create_tables
from app.routes import auth

# Crear tablas al iniciar
create_tables()

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Microservicio de Autenticación - Gestión de JWT y usuarios",
    version="1.0.0",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# Configurar CORS - Permite acceso desde otros microservicios
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r".*",  # Permite todos los orígenes (ajustar en producción)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX)

# Health check
@app.get("/health", tags=["Health"])
def health_check():
    """Verificar que el servicio está operativo"""
    return {"status": "healthy", "service": settings.PROJECT_NAME}

@app.get(f"{settings.API_V1_PREFIX}/", tags=["Info"])
def root():
    """Información del servicio"""
    return {
        "service": settings.PROJECT_NAME,
        "version": "1.0.0",
        "docs": f"http://localhost:8001{settings.API_V1_PREFIX}/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
