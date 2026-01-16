from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.config import settings
import logging

# Configurar logging para conexiones
logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# Crear engine de SQLAlchemy
# Configuración optimizada para Supabase (modo sesión tiene límite muy bajo)
# IMPORTANTE: Si usas Supabase pooler, considera cambiar a modo transaction
# agregando ?pgbouncer=true&pool_mode=transaction a la URL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,      # Verifica conexiones antes de usarlas
    pool_size=2,             # Número de conexiones en el pool (muy reducido para Supabase)
    max_overflow=3,          # Conexiones adicionales permitidas (máximo 5 total)
    pool_recycle=1800,       # Recicla conexiones después de 30 minutos
    pool_reset_on_return='commit',  # Resetea la conexión al devolverla al pool
    pool_timeout=30,         # Timeout para obtener conexión del pool (30 segundos)
    connect_args={
        "connect_timeout": 10,  # Timeout de conexión inicial (10 segundos)
        "options": "-c statement_timeout=30000"  # Timeout de queries (30 segundos)
    },
    echo=False               # Desactivar logs SQL en producción
)

# Event listeners para monitorear el pool de conexiones
@event.listens_for(engine, "connect")
def receive_connect(dbapi_conn, connection_record):
    """Se ejecuta cuando se crea una nueva conexión"""
    pool = engine.pool
    try:
        logger.info(
            f"[DB POOL] Nueva conexión creada. Pool size: {pool.size()}, "
            f"Checked out: {pool.checkedout()}, Checked in: {pool.checkedin()}"
        )
    except Exception:
        logger.info("[DB POOL] Nueva conexión creada")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_conn, connection_record, connection_proxy):
    """Se ejecuta cuando se obtiene una conexión del pool"""
    pool = engine.pool
    try:
        logger.info(
            f"[DB POOL] Conexión obtenida. Pool size: {pool.size()}, "
            f"Checked out: {pool.checkedout()}, Checked in: {pool.checkedin()}"
        )
    except Exception:
        logger.info("[DB POOL] Conexión obtenida")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_conn, connection_record):
    """Se ejecuta cuando se devuelve una conexión al pool"""
    pool = engine.pool
    try:
        logger.info(
            f"[DB POOL] Conexión devuelta. Pool size: {pool.size()}, "
            f"Checked out: {pool.checkedout()}, Checked in: {pool.checkedin()}"
        )
    except Exception:
        logger.info("[DB POOL] Conexión devuelta")

# Session local
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para modelos
Base = declarative_base()

# Dependency para obtener DB session
def get_db():
    """
    Dependencia que proporciona una sesión de base de datos.
    Se cierra automáticamente después de cada request.
    Asegura que la conexión se devuelva al pool correctamente.
    """
    import traceback
    db = SessionLocal()
    pool = engine.pool
    try:
        logger.info(
            f"[DB SESSION] Sesión creada. Pool activas: {pool.checkedout()}, "
            f"disponibles: {pool.checkedin()}"
        )
    except Exception:
        logger.info("[DB SESSION] Sesión creada")
    
    try:
        yield db
    except Exception as e:
        # En caso de error, hacer rollback antes de cerrar
        logger.error(f"[DB SESSION] Error en sesión: {str(e)}")
        logger.debug(f"[DB SESSION] Traceback: {traceback.format_exc()}")
        db.rollback()
        raise
    finally:
        # Cerrar la sesión y devolver la conexión al pool
        # Esto es crítico para liberar conexiones en Supabase
        # Las rutas hacen commit manualmente cuando es necesario
        db.close()
        try:
            logger.info(
                f"[DB SESSION] Sesión cerrada. Pool activas: {pool.checkedout()}, "
                f"disponibles: {pool.checkedin()}"
            )
        except Exception:
            logger.info("[DB SESSION] Sesión cerrada")