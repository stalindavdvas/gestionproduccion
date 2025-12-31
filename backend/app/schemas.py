from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


# --- CLIENTES ---
class ClienteBase(BaseModel):
    # Lo hacemos opcional por seguridad, aunque idealmente debería tener ID
    id_cliente_appsheet: Optional[str] = None
    nombre_fiscal: Optional[str] = None
    ruc: Optional[str] = None
    ciudad: Optional[str] = None
    industria: Optional[str] = None
    asesor_responsable: Optional[str] = None


class ClienteCreate(ClienteBase):
    pass


class ClienteResponse(ClienteBase):
    class Config:
        from_attributes = True


# --- TRABAJOS ---
class TrabajoBase(BaseModel):
    # AQUÍ ESTABA EL ERROR: Antes decía "id_appsheet: str" (Obligatorio)
    # Lo cambiamos a Optional[str] = None para que no falle si viene vacío
    id_appsheet: Optional[str] = None

    fecha_ingreso: Optional[datetime] = None
    tipo_ingreso: Optional[str] = None

    # Orden
    no_orden_taller: Optional[str] = None
    no_orden_campo: Optional[str] = None

    # Relacion
    cliente_id: Optional[str] = None

    # Equipo
    marca: Optional[str] = None
    modelo: Optional[str] = None
    serie: Optional[str] = None
    servicio: Optional[str] = None

    # Estado y Técnico
    estado: Optional[str] = None
    tecnico_ejecucion: Optional[str] = None
    fecha_entrega: Optional[date] = None


class TrabajoCreate(TrabajoBase):
    pass


class TrabajoResponse(TrabajoBase):
    id: int
    cliente_rel: Optional[ClienteResponse] = None

    @property
    def numero_orden_final(self):
        # Lógica para mostrar un solo número de orden limpio
        return self.no_orden_taller or self.no_orden_campo or "S/N"

    class Config:
        from_attributes = True