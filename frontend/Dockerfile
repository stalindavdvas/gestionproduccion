# CAMBIO AQUÍ: Usamos la versión 22-alpine en lugar de la 18
FROM node:22-alpine

WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto de Vite
EXPOSE 5173

# Comando para levantar el servidor de desarrollo
CMD ["npm", "run", "dev", "--", "--host"]