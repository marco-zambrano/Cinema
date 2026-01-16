from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

def validate_uuid(id_value: str, entity_name: str = "recurso") -> UUID:
    """Valida que un string sea un UUID válido"""
    try:
        return UUID(id_value)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"El ID del {entity_name} no es válido"
        )

def get_or_404(db: Session, model, id_field, id_value, entity_name: str = "recurso"):
    """Obtiene un registro o lanza 404"""
    obj = db.query(model).filter(id_field == id_value).first()
    if not obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{entity_name.capitalize()} no encontrado"
        )
    return obj