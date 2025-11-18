from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Text, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.database import Base
import uuid

class Usuario(Base):
    __tablename__ = "usuario"
    
    id_usuario = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(Text, nullable=False)
    correo = Column(Text, nullable=True)
    password = Column(Text, nullable=True)
    rol = Column(Text, nullable=True)
    
    # Relaciones
    reservas = relationship("Reserva", back_populates="usuario")


class Pelicula(Base):
    __tablename__ = "pelicula"
    
    id_pelicula = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    titulo = Column(Text, nullable=False)
    genero = Column(Text, nullable=True)
    descripcion = Column(Text, nullable=True)
    clasificacion = Column(Text, nullable=True)
    duracion = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)
    
    # Relaciones
    funciones = relationship("Funcion", back_populates="pelicula")


class Sala(Base):
    __tablename__ = "sala"
    
    id_sala = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    nombre = Column(Text, nullable=False)
    capacidad = Column(Numeric(10, 2), nullable=True)
    tipo = Column(Text, nullable=True)
    estado = Column(Text, nullable=True)
    filas = Column(Integer, nullable=True)
    columnas = Column(Integer, nullable=True)
    
    # Relaciones
    asientos = relationship("Asiento", back_populates="sala")
    funciones = relationship("Funcion", back_populates="sala")


class Funcion(Base):
    __tablename__ = "funcion"
    
    id_funcion = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fecha_hora = Column(DateTime, nullable=False)
    precio = Column(Numeric(10, 2), nullable=True)
    id_pelicula = Column(UUID(as_uuid=True), ForeignKey("pelicula.id_pelicula"), nullable=True)
    id_sala = Column(UUID(as_uuid=True), ForeignKey("sala.id_sala"), nullable=True)
    
    # Relaciones
    pelicula = relationship("Pelicula", back_populates="funciones")
    sala = relationship("Sala", back_populates="funciones")
    reservas = relationship("Reserva", back_populates="funcion")


class Asiento(Base):
    __tablename__ = "asiento"
    
    id_asiento = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    numero = Column(Text, nullable=False)
    estado = Column(Text, nullable=True)
    id_sala = Column(UUID(as_uuid=True), ForeignKey("sala.id_sala"), nullable=True)
    
    # Relaciones
    sala = relationship("Sala", back_populates="asientos")
    reserva_asientos = relationship("ReservaAsiento", back_populates="asiento")


class Reserva(Base):
    __tablename__ = "reserva"
    
    id_reserva = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cantidad_asientos = Column(Numeric(10, 2), nullable=False)
    estado = Column(Text, nullable=True)
    id_funcion = Column(UUID(as_uuid=True), ForeignKey("funcion.id_funcion"), nullable=True)
    id_usuario = Column(UUID(as_uuid=True), ForeignKey("usuario.id_usuario"), nullable=True)
    total = Column(Numeric(10, 2), nullable=True)
    fecha_reserva = Column(DateTime, nullable=False)
    
    # Relaciones
    funcion = relationship("Funcion", back_populates="reservas")
    usuario = relationship("Usuario", back_populates="reservas")
    reserva_asientos = relationship("ReservaAsiento", back_populates="reserva")
    facturas = relationship("Factura", back_populates="reserva")


class ReservaAsiento(Base):
    __tablename__ = "reserva_asiento"
    
    id_reserva = Column(UUID(as_uuid=True), ForeignKey("reserva.id_reserva"), primary_key=True)
    id_asiento = Column(UUID(as_uuid=True), ForeignKey("asiento.id_asiento"), primary_key=True)
    
    # Relaciones
    reserva = relationship("Reserva", back_populates="reserva_asientos")
    asiento = relationship("Asiento", back_populates="reserva_asientos")


class Factura(Base):
    __tablename__ = "factura"
    
    id_factura = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fecha_emision = Column(DateTime, nullable=False)
    total = Column(Numeric(10, 2), nullable=True)
    metodo_pago = Column(Text, nullable=True)
    id_reserva = Column(UUID(as_uuid=True), ForeignKey("reserva.id_reserva"), nullable=True)
    
    # Relaciones
    reserva = relationship("Reserva", back_populates="facturas")