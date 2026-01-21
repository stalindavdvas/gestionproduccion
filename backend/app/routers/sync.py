from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.etl_service import ejecutar_etl_clientes, ejecutar_etl_ingresos, ejecutar_etl_campo

router = APIRouter(prefix="/api/sync", tags=["Sincronización"])

@router.post("/clientes")
def sync_clientes(db: Session = Depends(get_db)):
    return ejecutar_etl_clientes(db)

@router.post("/ingresos")
def sync_ingresos(db: Session = Depends(get_db)):
    return ejecutar_etl_ingresos(db)

@router.post("/campo")
def sync_campo(db: Session = Depends(get_db)):
    return ejecutar_etl_campo(db)