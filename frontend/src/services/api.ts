import axios from 'axios';

// URL del Backend Dockerizado
const API_URL = 'http://localhost:8000';

export const api = {
    // 1. Sincronización (ETL)
    syncClientes: async () => {
        const response = await axios.post(`${API_URL}/sync/clientes`);
        return response.data;
    },
    syncIngresos: async () => {
        const response = await axios.post(`${API_URL}/sync/ingresos`);
        return response.data;
    },

    // 2. Obtención de Datos Reales
    getTrabajos: async () => {
        const response = await axios.get(`${API_URL}/trabajos?limit=5000`); // Traemos 1000 para graficar
        return response.data;
    },
    getClientes: async () => {
        const response = await axios.get(`${API_URL}/clientes?limit=5000`);
        return response.data;
    }
};