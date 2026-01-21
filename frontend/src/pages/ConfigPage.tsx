import { useState } from 'react';
import { Database, RefreshCw, Map, CheckCircle, AlertCircle, Play } from 'lucide-react';
import { api } from '../services/api';

export default function Config() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSync = async (type: 'clientes' | 'ingresos' | 'campo') => {
    setLoading(true);
    setMessage(null);
    try {
      let response;
      if (type === 'clientes') response = await api.syncClientes();
      if (type === 'ingresos') response = await api.syncIngresos();
      if (type === 'campo') response = await api.syncCampo();

      setMessage({
        type: 'success',
        text: response.mensaje || `Sincronización de ${type} completada.`
      });
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Error al conectar con el servidor.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Database className="text-blue-600" />
          Configuración ETL
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Administra la sincronización manual con Google Sheets.
        </p>
      </div>

      {/* Mensajes de Estado */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* TARJETA 1: CLIENTES */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
              <Database size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-700">1. Clientes</h3>
              <p className="text-xs text-slate-500">Industrias y Contactos</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-6 min-h-[40px]">
            Sincroniza la base maestra de clientes. Ejecutar esto primero para evitar errores de relación.
          </p>
          <button
            onClick={() => handleSync('clientes')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18}/> : <Play size={18}/>}
            Sincronizar Clientes
          </button>
        </div>

        {/* TARJETA 2: TALLER (INGRESOS) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
              <RefreshCw size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-700">2. Ingresos Taller</h3>
              <p className="text-xs text-slate-500">Órdenes de Trabajo</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-6 min-h-[40px]">
            Importa órdenes de taller, equipos y asigna técnicos automáticamente.
          </p>
          <button
            onClick={() => handleSync('ingresos')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18}/> : <Play size={18}/>}
            Sincronizar Taller
          </button>
        </div>

        {/* TARJETA 3: CAMPO (NUEVO) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
              <Map size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-700">3. Visitas Campo</h3>
              <p className="text-xs text-slate-500">Trabajos en Sitio</p>
            </div>
          </div>
          <p className="text-sm text-slate-600 mb-6 min-h-[40px]">
            Importa reportes de visitas técnicas realizadas en las instalaciones del cliente.
          </p>
          <button
            onClick={() => handleSync('campo')}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={18}/> : <Play size={18}/>}
            Sincronizar Campo
          </button>
        </div>

      </div>

      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-500 text-center">
        Nota: El proceso de sincronización puede tardar unos segundos. Por favor no cierres esta ventana.
      </div>
    </div>
  );
}