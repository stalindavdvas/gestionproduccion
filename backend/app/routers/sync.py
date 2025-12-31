from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from app.database import get_db
from app.services.etl_service import ejecutar_etl_clientes, ejecutar_etl_ingresos

router = APIRouter(
    prefix="/sync",
    tags=["Sincronización AppSheet"]
)

@router.post("/full")
def sincronizacion_completa(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """
    Ejecuta primero Clientes y luego Ingresos en segundo plano.
    """
    def proceso_completo():
        # Necesitamos crear una nueva sesión para la tarea en segundo plano
        from app.database import SessionLocal
        db_bg = SessionLocal()
        try:
            print(ejecutar_etl_clientes(db_bg))
            print(ejecutar_etl_ingresos(db_bg))
        finally:
            db_bg.close()

    background_tasks.add_task(proceso_completo)
    return {"mensaje": "Sincronización iniciada en segundo plano ⏳"}

@router.post("/clientes")
def sync_clientes(db: Session = Depends(get_db)):
    return ejecutar_etl_clientes(db)

@router.post("/ingresos")
def sync_ingresos(db: Session = Depends(get_db)):
    return ejecutar_etl_ingresos(db)