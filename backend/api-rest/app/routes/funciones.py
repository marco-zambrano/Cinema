from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session, joinedload
from typing import List
from decimal import Decimal
from app.database import get_db
from app.models import Funcion, Reserva, ReservaAsiento
from app.schemas import FuncionCreate, FuncionUpdate, FuncionResponse
from app.utils.dependencies import get_or_404

router = APIRouter()

@router.post("/funciones", response_model=FuncionResponse, status_code=status.HTTP_201_CREATED)
def create_funcion(funcion: FuncionCreate, db: Session = Depends(get_db)):
    """Crear una nueva función"""
    db_funcion = Funcion(**funcion.model_dump())
    db.add(db_funcion)
    db.commit()
    db.refresh(db_funcion)
    return db_funcion

@router.get("/funciones", response_model=List[FuncionResponse])
def get_funciones(
    skip: int = 0, 
    limit: int = 100, 
    id_pelicula: str = None,
    db: Session = Depends(get_db)
):
    """Obtener lista de funciones, opcionalmente filtradas por ID de película"""
    query = db.query(Funcion)
    
    if id_pelicula:
        query = query.filter(Funcion.id_pelicula == id_pelicula)
        
    funciones = query.offset(skip).limit(limit).all()
    return funciones

@router.get("/funciones/{id_funcion}", response_model=FuncionResponse)
def get_funcion(id_funcion: str, db: Session = Depends(get_db)):
    """Obtener una función por ID"""
    funcion = get_or_404(db, Funcion, Funcion.id_funcion, id_funcion, "función")
    return funcion

@router.put("/funciones/{id_funcion}", response_model=FuncionResponse)
def update_funcion(
    id_funcion: str,
    funcion_update: FuncionUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una función"""
    funcion = get_or_404(db, Funcion, Funcion.id_funcion, id_funcion, "función")
    
    update_data = funcion_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(funcion, field, value)
    
    db.commit()
    db.refresh(funcion)
    return funcion

@router.delete("/funciones/{id_funcion}", status_code=status.HTTP_204_NO_CONTENT)
def delete_funcion(id_funcion: str, db: Session = Depends(get_db)):
    """Eliminar una función"""
    funcion = get_or_404(db, Funcion, Funcion.id_funcion, id_funcion, "función")
    db.delete(funcion)
    db.commit()
    return None

@router.get("/funciones/{id_funcion}/disponibilidad")
def get_disponibilidad_funcion(id_funcion: str, db: Session = Depends(get_db)):
    """
    Obtener la disponibilidad de asientos para una función específica.
    
    Devuelve:
    {
        "asientosDisponibles": int,
        "capacidadTotal": float,
        "asientosOcupados": int,
        "id_sala": str
    }
    """
    # Verificar que la función existe y cargar la relación con sala
    funcion = db.query(Funcion).options(joinedload(Funcion.sala)).filter(
        Funcion.id_funcion == id_funcion
    ).first()
    
    if not funcion:
        return {
            "asientosDisponibles": 0,
            "capacidadTotal": 0,
            "asientosOcupados": 0,
            "id_sala": None,
            "mensaje": "Función no encontrada"
        }
    
    # Obtener la sala de la función
    if not funcion.sala:
        return {
            "asientosDisponibles": 0,
            "capacidadTotal": 0,
            "asientosOcupados": 0,
            "id_sala": None,
            "mensaje": "La función no tiene una sala asignada"
        }
    
    # Obtener la capacidad de la sala
    capacidad_total = float(funcion.sala.capacidad) if funcion.sala.capacidad else 0
    
    # Obtener todas las reservas para esta función
    reservas = db.query(Reserva).filter(Reserva.id_funcion == id_funcion).all()
    
    # Contar asientos ocupados
    asientos_ocupados = 0
    if reservas:
        reserva_ids = [r.id_reserva for r in reservas]
        reserva_asientos = db.query(ReservaAsiento).filter(
            ReservaAsiento.id_reserva.in_(reserva_ids)
        ).all()
        asientos_ocupados = len(reserva_asientos)
    
    # Calcular disponibilidad
    asientos_disponibles = int(capacidad_total - asientos_ocupados)
    # Asegurar que no sea negativo
    if asientos_disponibles < 0:
        asientos_disponibles = 0
    
    return {
        "asientosDisponibles": asientos_disponibles,
        "capacidadTotal": capacidad_total,
        "asientosOcupados": asientos_ocupados,
        "id_sala": str(funcion.sala.id_sala) if funcion.sala else None
    }