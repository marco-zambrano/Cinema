from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Factura
from app.schemas import FacturaCreate, FacturaUpdate, FacturaResponse
from app.utils.dependencies import get_or_404

router = APIRouter()

@router.post("/facturas", response_model=FacturaResponse, status_code=status.HTTP_201_CREATED)
def create_factura(factura: FacturaCreate, db: Session = Depends(get_db)):
    """Crear una nueva factura"""
    db_factura = Factura(**factura.model_dump())
    db.add(db_factura)
    db.commit()
    db.refresh(db_factura)
    return db_factura

@router.get("/facturas", response_model=List[FacturaResponse])
def get_facturas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de facturas"""
    facturas = db.query(Factura).offset(skip).limit(limit).all()
    return facturas

@router.get("/facturas/{id_factura}", response_model=FacturaResponse)
def get_factura(id_factura: str, db: Session = Depends(get_db)):
    """Obtener una factura por ID"""
    factura = get_or_404(db, Factura, Factura.id_factura, id_factura, "factura")
    return factura

@router.put("/facturas/{id_factura}", response_model=FacturaResponse)
def update_factura(
    id_factura: str,
    factura_update: FacturaUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una factura"""
    factura = get_or_404(db, Factura, Factura.id_factura, id_factura, "factura")
    
    update_data = factura_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(factura, field, value)
    
    db.commit()
    db.refresh(factura)
    return factura

@router.delete("/facturas/{id_factura}", status_code=status.HTTP_204_NO_CONTENT)
def delete_factura(id_factura: str, db: Session = Depends(get_db)):
    """Eliminar una factura"""
    factura = get_or_404(db, Factura, Factura.id_factura, id_factura, "factura")
    db.delete(factura)
    db.commit()
    return None