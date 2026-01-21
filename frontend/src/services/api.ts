import axios from 'axios';

export const api = {
    // 1. Sincronización (ETL)
    syncClientes: async () => {
        const response = await axios.post('/api/sync/clientes');
        return response.data;
    },

    syncCampo: async () => {
        const response = await axios.post('/api/sync/campo');
        return response.data;
    },

    syncIngresos: async () => {
        const response = await axios.post('/api/sync/ingresos');
        return response.data;
    },

    // 2. Obtención de Datos Reales (Tablas)
    getTrabajos: async () => {
        const response = await axios.get('/api/trabajos?limit=5000');
        return response.data;
    },

    getClientes: async () => {
        const response = await axios.get('/api/clientes?limit=5000');
        return response.data;
    },

    // 3. NUEVO: Analítica y Gráficos (Dashboard)
    getAnalytics: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await axios.get(`/api/analytics/dashboard?${params.toString()}`);
        return response.data;
    },

    // 4. NUEVO: Insight con IA (Gemini)
    getAnalyticsInsight: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await axios.get(`/api/analytics/insight?${params.toString()}`);
        return response.data;
    },
getCampo: async () => {
        const response = await axios.get('/api/campo?limit=1000');
        return response.data;
    },
};