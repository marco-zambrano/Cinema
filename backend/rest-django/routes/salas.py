from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Sala
from app.schemas import SalaCreate, SalaUpdate, SalaResponse
from app.utils.dependencies import get_or_404

router = APIRouter()

@router.post("/salas", response_model=SalaResponse, status_code=status.HTTP_201_CREATED)
def create_sala(sala: SalaCreate, db: Session = Depends(get_db)):
    """Crear una nueva sala"""
    db_sala = Sala(**sala.model_dump())
    db.add(db_sala)
    db.commit()
    db.refresh(db_sala)
    return db_sala

@router.get("/salas", response_model=List[SalaResponse])
def get_salas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de salas"""
    salas = db.query(Sala).offset(skip).limit(limit).all()
    return salas

@router.get("/salas/{id_sala}", response_model=SalaResponse)
def get_sala(id_sala: str, db: Session = Depends(get_db)):
    """Obtener una sala por ID"""
    sala = get_or_404(db, Sala, Sala.id_sala, id_sala, "sala")
    return sala

@router.put("/salas/{id_sala}", response_model=SalaResponse)
def update_sala(
    id_sala: str,
    sala_update: SalaUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una sala"""
    sala = get_or_404(db, Sala, Sala.id_sala, id_sala, "sala")
    
    update_data = sala_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sala, field, value)
    
    db.commit()
    db.refresh(sala)
    return sala

@router.delete("/salas/{id_sala}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sala(id_sala: str, db: Session = Depends(get_db)):
    """Eliminar una sala"""
    sala = get_or_404(db, Sala, Sala.id_sala, id_sala, "sala")
    db.delete(sala)
    db.commit()
    return None