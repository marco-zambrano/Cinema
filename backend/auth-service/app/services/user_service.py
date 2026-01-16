from sqlalchemy.orm import Session
from app.models import Usuario
from app.services.token_service import get_password_hash, verify_password
from typing import Optional
import uuid
from datetime import datetime

def get_usuario_by_correo(db: Session, correo: str) -> Optional[Usuario]:
    """Obtener usuario por correo"""
    return db.query(Usuario).filter(Usuario.correo == correo).first()

def get_usuario_by_id(db: Session, id_usuario: uuid.UUID) -> Optional[Usuario]:
    """Obtener usuario por ID"""
    return db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()

def create_usuario(
    db: Session,
    correo: str,
    nombre: str,
    password: str,
    rol: str = "cliente"
) -> Usuario:
    """Crear nuevo usuario"""
    hashed_password = get_password_hash(password)
    
    usuario = Usuario(
        correo=correo,
        nombre=nombre,
        password=hashed_password,
        rol=rol,
        activo=True
    )
    
    db.add(usuario)
    db.commit()
    db.refresh(usuario)
    
    return usuario

def update_ultimo_login(db: Session, id_usuario: uuid.UUID) -> None:
    """Actualizar timestamp del último login"""
    try:
        usuario = get_usuario_by_id(db, id_usuario)
        if usuario:
            usuario.ultimo_login = datetime.utcnow()
            db.commit()
    except Exception as e:
        print(f"Error actualizando último login: {str(e)}")
        db.rollback()

def deactivate_usuario(db: Session, id_usuario: uuid.UUID) -> None:
    """Desactivar un usuario"""
    try:
        usuario = get_usuario_by_id(db, id_usuario)
        if usuario:
            usuario.activo = False
            db.commit()
    except Exception as e:
        print(f"Error desactivando usuario: {str(e)}")
        db.rollback()

def change_password(db: Session, id_usuario: uuid.UUID, new_password: str) -> bool:
    """Cambiar contraseña del usuario"""
    try:
        usuario = get_usuario_by_id(db, id_usuario)
        if usuario:
            usuario.password = get_password_hash(new_password)
            db.commit()
            return True
        return False
    except Exception as e:
        print(f"Error cambiando contraseña: {str(e)}")
        db.rollback()
        return False
