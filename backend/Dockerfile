# Usamos Python 3.11 versión ligera
FROM python:3.11-slim

# Directorio de trabajo dentro del contenedor
WORKDIR /app

# Instalar dependencias de sistema necesarias para Postgres
RUN apt-get update && apt-get install -y libpq-dev gcc

# Copiar y ejecutar requisitos
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar todo el código (aunque usaremos volumenes, esto es buena practica)
COPY . .

# Exponer puerto
EXPOSE 8000

# Comando de arranque (modo reload para desarrollo)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]