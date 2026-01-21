from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine
from . import models
from .routers import sync, trabajos, chat, analytics, auth   #IMPORTAMOS LOS ROUTERS

# 1️⃣ Crear tablas (solo en desarrollo)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema de Productividad Técnica",
    version="2.0.0"
)

# 2️⃣ CONFIGURACIÓN CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # En producción: dominios específicos
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3️⃣ RUTAS
app.include_router(sync.router)
app.include_router(trabajos.router)
app.include_router(chat.router)
app.include_router(analytics.router)
app.include_router(auth.router)

# 4️⃣ HEALTH CHECK
@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "backend-fastapi",
        "version": "2.0.0"
    }
