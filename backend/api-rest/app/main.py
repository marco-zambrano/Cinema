from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import (
    auth,
    usuarios,
    peliculas,
    salas,
    funciones,
    asientos,
    reservas,
    reserva_asiento,
    facturas,
    payments,
    partners,
    webhooks
)

# Crear aplicación FastAPI
app = FastAPI(
    title=settings.PROJECT_NAME,
    description="API REST para sistema de gestión de cine",
    version="1.0.0",
    docs_url=f"{settings.API_V1_PREFIX}/docs",
    redoc_url=f"{settings.API_V1_PREFIX}/redoc",
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json"
)

# Configurar CORS
# Configurado para demo/presentación - permite todos los orígenes
origins_list = settings.origins_list
if "*" in origins_list:
    # Para permitir todos los orígenes en demo/presentación
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r".*",  # Permite todos los orígenes
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    # Para desarrollo/producción con orígenes específicos
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# Incluir routers
app.include_router(auth.router, prefix=settings.API_V1_PREFIX, tags=["Autenticación"])
app.include_router(usuarios.router, prefix=settings.API_V1_PREFIX, tags=["Usuarios"])
app.include_router(peliculas.router, prefix=settings.API_V1_PREFIX, tags=["Películas"])
app.include_router(salas.router, prefix=settings.API_V1_PREFIX, tags=["Salas"])
app.include_router(funciones.router, prefix=settings.API_V1_PREFIX, tags=["Funciones"])
app.include_router(asientos.router, prefix=settings.API_V1_PREFIX, tags=["Asientos"])
app.include_router(reservas.router, prefix=settings.API_V1_PREFIX, tags=["Reservas"])
app.include_router(reserva_asiento.router, prefix=settings.API_V1_PREFIX, tags=["Reservas - Asientos"])
app.include_router(facturas.router, prefix=settings.API_V1_PREFIX, tags=["Facturas"])
app.include_router(payments.router, prefix=settings.API_V1_PREFIX, tags=["Payments"])
app.include_router(partners.router, prefix=settings.API_V1_PREFIX, tags=["Partners"])
app.include_router(webhooks.router, prefix=settings.API_V1_PREFIX, tags=["Webhooks"])

# Ruta raíz
@app.get("/")
async def root():
    return {
        "message": "Cinema REST API",
        "version": "1.0.0",
        "docs": f"{settings.API_V1_PREFIX}/docs"
    }

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy"}