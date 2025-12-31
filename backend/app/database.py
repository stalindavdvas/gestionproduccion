import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

load_dotenv()

# Obtenemos las variables. Si no existen, usa valores por defecto (útil para pruebas locales)
USER = os.getenv("DB_USER", "admin")
PASSWORD = os.getenv("DB_PASSWORD", "admin_password")
HOST = os.getenv("DB_HOST", "localhost") # Ojo: En Docker será 'db', en local 'localhost'
PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME", "productivity_db")

SQLALCHEMY_DATABASE_URL = f"postgresql://{USER}:{PASSWORD}@{HOST}:{PORT}/{DB_NAME}"

# Creamos el motor de conexión
engine = create_engine(SQLALCHEMY_DATABASE_URL)

# Creamos la sesión (la herramienta para hacer consultas)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Dependencia para obtener la DB en cada petición (Inyección de Dependencias)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()