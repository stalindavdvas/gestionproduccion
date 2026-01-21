import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { api } from '../services/api';

export default function OrdersTable() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData() }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await api.getTrabajos(); // Asegúrate de tener este método en api.ts
      setOrders(data);
    } finally { setLoading(false); }
  };

  if (loading) return <div className="p-10 text-center">Cargando órdenes...</div>;

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Órdenes de Taller</h1>
        <button onClick={loadData} className="p-2 hover:bg-slate-100 rounded-lg"><RefreshCw size={20}/></button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-medium border-b">
              <tr>
                <th className="px-6 py-3">Orden</th>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Cliente</th>
                <th className="px-6 py-3">Servicio</th>
                <th className="px-6 py-3">Técnico</th>
                <th className="px-6 py-3">Estado</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id_appsheet} className="border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium">{o.no_orden_taller || o.no_orden_campo}</td>
                  <td className="px-6 py-4">{o.fecha_ingreso}</td>
                  <td className="px-6 py-4">{o.cliente_rel?.nombre_fiscal || 'S/N'}</td>
                  <td className="px-6 py-4">{o.servicio_rel?.nombre || '-'}</td>
                  <td className="px-6 py-4">{o.tecnico_rel?.nombre_completo || '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      o.estado === 'Finalizado' ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>{o.estado}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}