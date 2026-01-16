from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Reserva
from app.schemas import ReservaCreate, ReservaUpdate, ReservaResponse
from app.utils.dependencies import get_or_404

router = APIRouter()

@router.post("/reservas", response_model=ReservaResponse, status_code=status.HTTP_201_CREATED)
def create_reserva(reserva: ReservaCreate, db: Session = Depends(get_db)):
    """Crear una nueva reserva"""
    db_reserva = Reserva(**reserva.model_dump())
    db.add(db_reserva)
    db.commit()
    db.refresh(db_reserva)
    return db_reserva

@router.get("/reservas", response_model=List[ReservaResponse])
def get_reservas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de reservas"""
    reservas = db.query(Reserva).offset(skip).limit(limit).all()
    return reservas

@router.get("/reservas/{id_reserva}", response_model=ReservaResponse)
def get_reserva(id_reserva: str, db: Session = Depends(get_db)):
    """Obtener una reserva por ID"""
    reserva = get_or_404(db, Reserva, Reserva.id_reserva, id_reserva, "reserva")
    return reserva

@router.put("/reservas/{id_reserva}", response_model=ReservaResponse)
def update_reserva(
    id_reserva: str,
    reserva_update: ReservaUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una reserva"""
    reserva = get_or_404(db, Reserva, Reserva.id_reserva, id_reserva, "reserva")
    
    update_data = reserva_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reserva, field, value)
    
    db.commit()
    db.refresh(reserva)
    return reserva

@router.delete("/reservas/{id_reserva}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reserva(id_reserva: str, db: Session = Depends(get_db)):
    """Eliminar una reserva"""
    reserva = get_or_404(db, Reserva, Reserva.id_reserva, id_reserva, "reserva")
    db.delete(reserva)
    db.commit()
    return None