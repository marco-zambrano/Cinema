from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Pelicula
from app.schemas import PeliculaCreate, PeliculaUpdate, PeliculaResponse
from app.utils.dependencies import get_or_404

router = APIRouter()

@router.post("/peliculas", response_model=PeliculaResponse, status_code=status.HTTP_201_CREATED)
def create_pelicula(pelicula: PeliculaCreate, db: Session = Depends(get_db)):
    """Crear una nueva película"""
    db_pelicula = Pelicula(**pelicula.model_dump())
    db.add(db_pelicula)
    db.commit()
    db.refresh(db_pelicula)
    return db_pelicula

@router.get("/peliculas", response_model=List[PeliculaResponse])
def get_peliculas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Obtener lista de películas"""
    peliculas = db.query(Pelicula).offset(skip).limit(limit).all()
    return peliculas

@router.get("/peliculas/{id_pelicula}", response_model=PeliculaResponse)
def get_pelicula(id_pelicula: str, db: Session = Depends(get_db)):
    """Obtener una película por ID"""
    pelicula = get_or_404(db, Pelicula, Pelicula.id_pelicula, id_pelicula, "película")
    return pelicula

@router.put("/peliculas/{id_pelicula}", response_model=PeliculaResponse)
def update_pelicula(
    id_pelicula: str,
    pelicula_update: PeliculaUpdate,
    db: Session = Depends(get_db)
):
    """Actualizar una película"""
    pelicula = get_or_404(db, Pelicula, Pelicula.id_pelicula, id_pelicula, "película")
    
    update_data = pelicula_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(pelicula, field, value)
    
    db.commit()
    db.refresh(pelicula)
    return pelicula

@router.delete("/peliculas/{id_pelicula}", status_code=status.HTTP_204_NO_CONTENT)
def delete_pelicula(id_pelicula: str, db: Session = Depends(get_db)):
    """Eliminar una película"""
    pelicula = get_or_404(db, Pelicula, Pelicula.id_pelicula, id_pelicula, "película")
    db.delete(pelicula)
    db.commit()
    return None