import { useEffect, useState } from 'react';
import { RefreshCw, MapPin, FileText, Users } from 'lucide-react';
import { api } from '../services/api';

export default function FieldTable() {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData() }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Llamamos al método que agregamos a api.ts
      const data = await api.getCampo();
      setVisits(data);
    } catch (error) {
      console.error("Error cargando visitas de campo", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex h-[calc(100vh-200px)] items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
        <p className="text-slate-500 text-sm">Cargando registros de campo...</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="text-emerald-600" />
            Visitas de Campo
          </h1>
          <p className="text-slate-500 text-sm">Registro de trabajos realizados en sitio</p>
        </div>
        <button
            onClick={loadData}
            className="p-2.5 text-slate-600 hover:bg-slate-100 hover:text-emerald-600 rounded-xl transition-colors border border-transparent hover:border-slate-200"
            title="Recargar datos"
        >
            <RefreshCw size={20}/>
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4">Código / ID</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Técnicos</th>
                <th className="px-6 py-4">Equipo</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-center">Informe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {visits.map((v) => (
                <tr key={v.id_campo_appsheet} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {v.codigo || v.id_campo_appsheet}
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div className="flex items-center gap-2">
                        <MapPin size={14} className="text-slate-400"/>
                        {v.ubicacion || 'S/N'}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                    {v.ultima_fecha || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                        {v.tecnico1_rel && (
                            <span className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-md w-fit">
                                <Users size={12}/> {v.tecnico1_rel.nombre_completo}
                            </span>
                        )}
                        {v.tecnico2_rel && (
                            <span className="flex items-center gap-1.5 text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-md w-fit">
                                <Users size={12}/> {v.tecnico2_rel.nombre_completo}
                            </span>
                        )}
                        {!v.tecnico1_rel && !v.tecnico2_rel && <span className="text-slate-400 text-xs italic">Sin asignar</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {v.equipo_rel ? (
                        <div className="text-xs">
                            <span className="font-bold block">{v.equipo_rel.tipo_equipo}</span>
                            <span className="text-slate-400">{v.equipo_rel.marca} {v.equipo_rel.modelo}</span>
                        </div>
                    ) : (
                        <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                      v.estado === 'Finalizado' || v.estado === 'Realizado'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : v.estado === 'Pendiente' 
                            ? 'bg-amber-50 text-amber-700 border-amber-100'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      {v.estado || 'Desconocido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {v.enlace_informe ? (
                        <a
                            href={v.enlace_informe}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Ver Informe PDF"
                        >
                            <FileText size={18} />
                        </a>
                    ) : (
                        <span className="text-slate-300">-</span>
                    )}
                  </td>
                </tr>
              ))}

              {visits.length === 0 && !loading && (
                <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        No se encontraron registros de visitas de campo.
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}