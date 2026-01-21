from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from typing import List
from ..database import get_db
from .. import models, schemas

router = APIRouter(
    prefix="/api",
    tags=["Operaciones"]
)

# 1. LISTAR ORDENES DE TRABAJO (INGRESOS)
@router.get("/trabajos", response_model=List[schemas.OrdenTrabajoResponse])
def listar_ordenes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Obtiene las órdenes de taller con sus relaciones cargadas eficientemente.
    """
    return (
        db.query(models.OrdenTrabajo)
        .options(
            joinedload(models.OrdenTrabajo.cliente_rel),
            joinedload(models.OrdenTrabajo.tecnico_rel),
            joinedload(models.OrdenTrabajo.servicio_rel),
            joinedload(models.OrdenTrabajo.equipo_rel)
        )
        .order_by(models.OrdenTrabajo.fecha_ingreso.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

# 2. LISTAR VISITAS DE CAMPO (NUEVO)
@router.get("/campo", response_model=List[schemas.VisitaCampoResponse])
def listar_campo(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.VisitaCampo)
        .options(
            joinedload(models.VisitaCampo.tecnico1_rel),
            joinedload(models.VisitaCampo.tecnico2_rel),
            joinedload(models.VisitaCampo.equipo_rel)
        )
        .order_by(models.VisitaCampo.ultima_fecha.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

# 3. LISTAR CLIENTES
@router.get("/clientes", response_model=List[schemas.ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return (
        db.query(models.Cliente)
        .options(joinedload(models.Cliente.industria_rel))
        .offset(skip)
        .limit(limit)
        .all()
    )