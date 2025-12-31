from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from .database import engine, get_db
from . import models, schemas
from .routers import sync

# 1. Crear tablas (Si no existen)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Productividad Técnica",
    version="2.0.0"
)

# 2. CONFIGURACIÓN CORS (CRÍTICO)
# Esto permite que el puerto 5173 (React) hable con el 8000 (Python)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En desarrollo permitimos todo
    allow_credentials=True,
    allow_methods=["*"],  # Permitir GET, POST, PUT, DELETE
    allow_headers=["*"],
)

# 3. Incluir Rutas
app.include_router(sync.router)

@app.get("/")
def read_root():
    return {"status": "online", "version": "2.0.0"}

# Endpoint para listar trabajos
@app.get("/trabajos", response_model=List[schemas.TrabajoResponse])
def listar_trabajos(skip: int = 0, limit: int = 5000, db: Session = Depends(get_db)):
    # Usamos joinedload para optimizar la carga del cliente si fuera necesario,
    # pero por defecto SQLAlchemy lo hace lazy.
    trabajos = db.query(models.TrabajoTecnico).order_by(models.TrabajoTecnico.fecha_ingreso.desc()).offset(skip).limit(limit).all()
    return trabajos

# Endpoint para listar clientes
@app.get("/clientes", response_model=List[schemas.ClienteResponse])
def listar_clientes(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    clientes = db.query(models.Cliente).offset(skip).limit(limit).all()
    return clientes