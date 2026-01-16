from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Asiento
from app.schemas import AsientoCreate, AsientoUpdate, AsientoResponse
from app.utils.dependencies import get_or_404

router = APIRouter()

@router.post("/asientos", response_model=AsientoResponse, status_code=status.HTTP_201_CREATED)
def create_asiento(asiento: AsientoCreate, db: Session = Depends(get_db)):
    """Crear un nuevo asiento"""
    db_asiento = Asiento(**asiento.model_dump())
    db.add(db_asiento)
    db.commit()
    db.refresh(db_asiento)
    return db_asiento

@router.get("/asientos", response_model=List[AsientoResponse])
def get_asientos(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de asientos"""
    asientos = db.query(Asiento).offset(skip).limit(limit).all()
    return asientos

@router.get("/asientos/{id_asiento}", response_model=AsientoResponse)
def get_asiento(id_asiento: str, db: Session = Depends(get_db)):
    """Obtener un asiento por ID"""
    asiento = get_or_404(db, Asiento, Asiento.id_asiento, id_asiento, "asiento")
    return asiento

@router.put("/asientos/{id_asiento}", response_model=AsientoResponse)
def update_asiento(
    id_asiento: str,
    asiento_update: AsientoUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar un asiento"""
    asiento = get_or_404(db, Asiento, Asiento.id_asiento, id_asiento, "asiento")
    
    update_data = asiento_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(asiento, field, value)
    
    db.commit()
    db.refresh(asiento)
    return asiento

@router.delete("/asientos/{id_asiento}", status_code=status.HTTP_204_NO_CONTENT)
def delete_asiento(id_asiento: str, db: Session = Depends(get_db)):
    """Eliminar un asiento"""
    asiento = get_or_404(db, Asiento, Asiento.id_asiento, id_asiento, "asiento")
    db.delete(asiento)
    db.commit()
    return None