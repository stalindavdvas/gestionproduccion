from sqlalchemy import Column, Integer, String, Date, Text, DateTime, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


class Cliente(Base):
    __tablename__ = "clientes"

    # Identificadores
    id_cliente_appsheet = Column(String, primary_key=True, index=True)
    clave = Column(String, nullable=True)

    # Datos Principales
    nombre_fiscal = Column(String, index=True)
    ruc = Column(String, index=True, nullable=True)
    contacto = Column(String, nullable=True)

    # Ubicación y Contacto
    provincia = Column(String, nullable=True)
    ciudad = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    correo = Column(String, nullable=True)
    telefono = Column(String, nullable=True)

    # Clasificación
    industria = Column(String, nullable=True)
    asesor_responsable = Column(String, nullable=True)
    observaciones = Column(Text, nullable=True)

    # Metadatos
    ultima_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())


class TrabajoTecnico(Base):
    __tablename__ = "trabajos_tecnicos"

    id = Column(Integer, primary_key=True, index=True)

    # Identificadores
    id_appsheet = Column(String, unique=True, index=True)
    clave = Column(String, nullable=True)

    # Fechas
    fecha_ingreso = Column(DateTime, nullable=True)
    fecha_entrega = Column(Date, nullable=True)

    # Clasificación
    tipo_ingreso = Column(String)  # Campo, Taller, Produccion

    # Números de Orden
    no_orden_taller = Column(String, nullable=True)
    no_orden_campo = Column(String, nullable=True)
    no_orden_produccion = Column(String, nullable=True)

    # Relación con Cliente
    cliente_id = Column(String, ForeignKey("clientes.id_cliente_appsheet"), nullable=True)

    # Equipo / Balanza
    servicio = Column(String, nullable=True)
    marca = Column(String, nullable=True)
    modelo = Column(String, nullable=True)
    serie = Column(String, nullable=True)
    tipo_equipo = Column(String, nullable=True)
    capacidad = Column(String, nullable=True)
    sensibilidad = Column(String, nullable=True)

    # Datos Técnicos Textuales
    dano_reportado = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)
    informe_tecnico_url = Column(String, nullable=True)  # Link al PDF (Solo texto)

    # Estado y Personal (KPIs)
    estado = Column(String, nullable=True)
    ingresado_por = Column(String, nullable=True)
    tecnico_revision = Column(String, nullable=True)
    tecnico_ejecucion = Column(String, index=True, nullable=True)  # Clave para medir productividad

    # Metadatos
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    ultima_actualizacion = Column(DateTime(timezone=True), onupdate=func.now())

    # Relación
    cliente_rel = relationship("Cliente", backref="trabajos")