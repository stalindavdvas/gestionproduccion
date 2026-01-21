from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from .database import Base
from datetime import datetime


class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    rol = Column(String) # "admin" o "mantenimiento"
    activo = Column(Boolean, default=True)

# --- TABLAS CATÁLOGO ---

class Industria(Base):
    __tablename__ = "industrias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True)

    clientes = relationship("Cliente", back_populates="industria_rel")


class Tecnico(Base):
    __tablename__ = "tecnicos"
    id = Column(Integer, primary_key=True, index=True)
    nombre_completo = Column(String, unique=True, index=True)
    activo = Column(Boolean, default=True)


class TipoServicio(Base):
    __tablename__ = "tipos_servicio"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True)


# --- TABLAS PRINCIPALES ---

class Cliente(Base):
    __tablename__ = "clientes"

    id_cliente_appsheet = Column(String, primary_key=True)  # ID Original del Excel
    clave = Column(String, nullable=True)
    nombre_fiscal = Column(String, index=True)
    ruc = Column(String, index=True)
    provincia = Column(String, nullable=True)
    ciudad = Column(String, nullable=True)
    direccion = Column(String, nullable=True)
    contacto = Column(String, nullable=True)
    telefono = Column(String, nullable=True)
    correo = Column(String, nullable=True)

    # FK
    industria_id = Column(Integer, ForeignKey("industrias.id"), nullable=True)

    # Relaciones
    industria_rel = relationship("Industria", back_populates="clientes")
    equipos = relationship("Equipo", back_populates="cliente_rel")
    ordenes = relationship("OrdenTrabajo", back_populates="cliente_rel")
    ultima_actualizacion = Column(DateTime, default=datetime.now)


class Equipo(Base):
    __tablename__ = "equipos"

    id = Column(Integer, primary_key=True, index=True)
    # Identificación única compuesta (opcional, aquí usamos auto-id para flexibilidad)
    marca = Column(String, nullable=True)
    modelo = Column(String, nullable=True)
    serie = Column(String, index=True, nullable=True)
    tipo_equipo = Column(String, nullable=True)
    capacidad = Column(String, nullable=True)
    sensibilidad = Column(String, nullable=True)

    # FK (El equipo pertenece a un cliente)
    cliente_id = Column(String, ForeignKey("clientes.id_cliente_appsheet"), nullable=True)

    cliente_rel = relationship("Cliente", back_populates="equipos")
    ordenes = relationship("OrdenTrabajo", back_populates="equipo_rel")
    visitas = relationship("VisitaCampo", back_populates="equipo_rel")


# --- TABLAS TRANSACCIONALES ---

class OrdenTrabajo(Base):
    __tablename__ = "ordenes_trabajo"  # Antes TrabajoTecnico

    id_appsheet = Column(String, primary_key=True)
    fecha_ingreso = Column(Date, index=True)
    tipo_ingreso = Column(String, nullable=True)

    # Números de orden
    no_orden_taller = Column(String, nullable=True)
    no_orden_campo = Column(String, nullable=True)
    no_orden_produccion = Column(String, nullable=True)

    # Estado y Detalles
    estado = Column(String, index=True)
    observaciones = Column(Text, nullable=True)
    dano_reportado = Column(Text, nullable=True)

    # Foreign Keys
    cliente_id = Column(String, ForeignKey("clientes.id_cliente_appsheet"), nullable=True)
    equipo_id = Column(Integer, ForeignKey("equipos.id"), nullable=True)
    servicio_id = Column(Integer, ForeignKey("tipos_servicio.id"), nullable=True)
    tecnico_id = Column(Integer, ForeignKey("tecnicos.id"), nullable=True)  # Técnico Ejecución

    # Relaciones
    cliente_rel = relationship("Cliente", back_populates="ordenes")
    equipo_rel = relationship("Equipo", back_populates="ordenes")
    servicio_rel = relationship("TipoServicio")
    tecnico_rel = relationship("Tecnico")

    ultima_actualizacion = Column(DateTime, default=datetime.now)


class VisitaCampo(Base):
    __tablename__ = "visitas_campo"

    id_campo_appsheet = Column(String, primary_key=True)
    codigo = Column(String, nullable=True)
    agencia_zona = Column(String, nullable=True)
    ubicacion = Column(String, nullable=True)
    estado = Column(String, nullable=True)
    observaciones = Column(Text, nullable=True)
    enlace_informe = Column(String, nullable=True)
    ultima_fecha = Column(Date, nullable=True)

    # Foreign Keys
    equipo_id = Column(Integer, ForeignKey("equipos.id"), nullable=True)
    tecnico1_id = Column(Integer, ForeignKey("tecnicos.id"), nullable=True)
    tecnico2_id = Column(Integer, ForeignKey("tecnicos.id"), nullable=True)

    # Relaciones
    equipo_rel = relationship("Equipo", back_populates="visitas")
    tecnico1_rel = relationship("Tecnico", foreign_keys=[tecnico1_id])
    tecnico2_rel = relationship("Tecnico", foreign_keys=[tecnico2_id])

    ultima_actualizacion = Column(DateTime, default=datetime.now)