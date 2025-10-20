# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
import uuid


class Asiento(models.Model):
    id_asiento = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero = models.DecimalField(max_digits=65535, decimal_places=65535)
    estado = models.TextField(blank=True, null=True)
    id_sala = models.ForeignKey('Sala', models.DO_NOTHING, db_column='id_sala', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'asiento'


class Factura(models.Model):
    id_factura = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fecha_emision = models.DateTimeField()
    total = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    metodo_pago = models.TextField(blank=True, null=True)
    id_reserva = models.ForeignKey('Reserva', models.DO_NOTHING, db_column='id_reserva', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'factura'


class Funcion(models.Model):
    id_funcion = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fecha_hora = models.DateTimeField()
    precio = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    id_pelicula = models.ForeignKey('Pelicula', models.DO_NOTHING, db_column='id_pelicula', blank=True, null=True)
    id_sala = models.ForeignKey('Sala', models.DO_NOTHING, db_column='id_sala', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'funcion'


class Incidencia(models.Model):
    id_incidencia = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    fecha_generacion = models.DateTimeField()
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'incidencia'


class Pelicula(models.Model):
    id_pelicula = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    titulo = models.TextField()
    genero = models.TextField(blank=True, null=True)
    descripcion = models.TextField(blank=True, null=True)
    clasificacion = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'pelicula'


class Reserva(models.Model):
    id_reserva = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    cantidad_asientos = models.DecimalField(max_digits=10, decimal_places=2)
    estado = models.TextField(blank=True, null=True)
    id_funcion = models.ForeignKey(Funcion, models.DO_NOTHING, db_column='id_funcion', blank=True, null=True)
    id_usuario = models.ForeignKey('Usuario', models.DO_NOTHING, db_column='id_usuario', blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'reserva'


class ReservaAsiento(models.Model):
    id_reserva = models.ForeignKey(Reserva, models.DO_NOTHING, db_column='id_reserva')
    id_asiento = models.ForeignKey(Asiento, models.DO_NOTHING, db_column='id_asiento')

    class Meta:
        managed = False
        db_table = 'reserva_asiento'


class Sala(models.Model):
    id_sala = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.TextField() #.field sirve para definir campos en el esquema GraphQL
    capacidad = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    tipo = models.TextField(blank=True, null=True)
    estado = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'sala'


class Usuario(models.Model):
    id_usuario = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False) #default=uuid.uuid4 para generar un UUID automaticamente
    nombre = models.TextField()
    correo = models.TextField(blank=True, null=True)
    password = models.TextField(blank=True, null=True)
    rol = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'usuario'
