from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Usuario
from app.schemas import UsuarioUpdate, UsuarioResponse
from app.services.auth_service import get_current_active_user, get_password_hash
from app.utils.dependencies import get_or_404

router = APIRouter()

@router.get("/usuarios", response_model=List[UsuarioResponse])
def get_usuarios(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener lista de usuarios (requiere autenticación)"""
    usuarios = db.query(Usuario).offset(skip).limit(limit).all()
    return usuarios

@router.get("/usuarios/{id_usuario}", response_model=UsuarioResponse)
def get_usuario(
    id_usuario: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Obtener un usuario por ID"""
    usuario = get_or_404(db, Usuario, Usuario.id_usuario, id_usuario, "usuario")
    return usuario

@router.get("/usuarios/me", response_model=UsuarioResponse)
def get_current_usuario(current_user: Usuario = Depends(get_current_active_user)):
    """Obtener datos del usuario actual"""
    # El UsuarioResponse ya excluye el password automáticamente por no estar en el schema
    # Pero asegurémonos de que se serialice correctamente
    return current_user

@router.put("/usuarios/{id_usuario}", response_model=UsuarioResponse)
def update_usuario(
    id_usuario: str,
    usuario_update: UsuarioUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Actualizar un usuario"""
    usuario = get_or_404(db, Usuario, Usuario.id_usuario, id_usuario, "usuario")
    
    # Actualizar campos
    update_data = usuario_update.model_dump(exclude_unset=True)
    
    # Si se actualiza la contraseña, hashearla
    if "password" in update_data:
        update_data["password"] = get_password_hash(update_data["password"])
    
    for field, value in update_data.items():
        setattr(usuario, field, value)
    
    db.commit()
    db.refresh(usuario)
    
    return usuario

@router.delete("/usuarios/{id_usuario}", status_code=status.HTTP_204_NO_CONTENT)
def delete_usuario(
    id_usuario: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_active_user)
):
    """Eliminar un usuario"""
    usuario = get_or_404(db, Usuario, Usuario.id_usuario, id_usuario, "usuario")
    
    db.delete(usuario)
    db.commit()
    
    return None