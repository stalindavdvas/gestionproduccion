from pydantic import BaseModel
from typing import Optional, List, Union
from datetime import date, datetime


# --- BASES ---
class TecnicoBase(BaseModel):
    id: int
    nombre_completo: str

    class Config:
        from_attributes = True


class IndustriaBase(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class TipoServicioBase(BaseModel):
    id: int
    nombre: str

    class Config:
        from_attributes = True


class EquipoBase(BaseModel):
    id: int
    serie: Optional[str] = None
    marca: Optional[str] = None
    modelo: Optional[str] = None
    tipo_equipo: Optional[str] = None

    class Config:
        from_attributes = True


# --- CLIENTES ---
class ClienteResponse(BaseModel):
    id_cliente_appsheet: str
    nombre_fiscal: Optional[str] = None
    ruc: Optional[str] = None
    ciudad: Optional[str] = None
    direccion: Optional[str] = None
    telefono: Optional[str] = None
    contacto: Optional[str] = None
    # Relación anidada
    industria_rel: Optional[IndustriaBase] = None

    class Config:
        from_attributes = True


# --- ORDENES DE TRABAJO (TALLER/INGRESOS) ---
class OrdenTrabajoResponse(BaseModel):
    id_appsheet: str
    fecha_ingreso: Optional[date] = None
    no_orden_taller: Optional[str] = None
    no_orden_campo: Optional[str] = None
    estado: Optional[str] = None
    servicio_rel: Optional[TipoServicioBase] = None
    tecnico_rel: Optional[TecnicoBase] = None
    equipo_rel: Optional[EquipoBase] = None
    cliente_rel: Optional[ClienteResponse] = None
    observaciones: Optional[str] = None

    class Config:
        from_attributes = True


# --- VISITAS DE CAMPO ---
class VisitaCampoResponse(BaseModel):
    id_campo_appsheet: str
    codigo: Optional[str] = None
    ubicacion: Optional[str] = None
    estado: Optional[str] = None
    ultima_fecha: Optional[date] = None
    enlace_informe: Optional[str] = None

    # Relaciones
    tecnico1_rel: Optional[TecnicoBase] = None
    tecnico2_rel: Optional[TecnicoBase] = None
    equipo_rel: Optional[EquipoBase] = None

    class Config:
        from_attributes = True