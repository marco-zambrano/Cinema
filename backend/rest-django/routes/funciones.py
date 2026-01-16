from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Funcion
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