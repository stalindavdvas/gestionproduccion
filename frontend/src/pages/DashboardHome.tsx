import { useEffect, useState, useMemo } from 'react';
import { Users, Wrench, RefreshCw, Briefcase, CheckCircle2, Clock, CalendarDays, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';

interface Trabajo {
    id: number;
    numero_orden_final: string;
    tipo_ingreso: string;
    estado: string;
    tecnico_ejecucion?: string;
    fecha_ingreso?: string;
}

export default function DashboardHome() {
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes' | 'todo'>('todo');
    const [showTechModal, setShowTechModal] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await api.getTrabajos();
            setTrabajos(data);
        } catch (error) {
            console.error("Error", error);
        } finally {
            setLoading(false);
        }
    };

    // --- FILTRO DE TIEMPO ---
    const trabajosFiltrados = useMemo(() => {
        if (periodo === 'todo') return trabajos;

        const hoy = new Date();
        const inicioDia = new Date(hoy.setHours(0,0,0,0));

        return trabajos.filter(t => {
            if (!t.fecha_ingreso) return false;
            const fechaTrabajo = new Date(t.fecha_ingreso);

            if (periodo === 'dia') {
                return fechaTrabajo >= inicioDia;
            }
            if (periodo === 'semana') {
                const hace7dias = new Date(hoy);
                hace7dias.setDate(hoy.getDate() - 7);
                return fechaTrabajo >= hace7dias;
            }
            if (periodo === 'mes') {
                return fechaTrabajo.getMonth() === new Date().getMonth() &&
                       fechaTrabajo.getFullYear() === new Date().getFullYear();
            }
            return true;
        });
    }, [trabajos, periodo]);

    // --- CÁLCULO DE ESTADÍSTICAS ---
    const stats = useMemo(() => {
        const total = trabajosFiltrados.length;

        const enProceso = trabajosFiltrados.filter(t => {
            const st = (t.estado || '').toUpperCase();
            return st.includes('INGRESO') || st.includes('ESPERA') || st.includes('PROCESO');
        }).length;

        const terminados = trabajosFiltrados.filter(t => {
            const st = (t.estado || '').toUpperCase();
            return st.includes('ENTREGADO') || st.includes('FINALIZADO');
        }).length;

        // Agrupación por Técnico
        const tecnicosMap: Record<string, number> = {};
        trabajosFiltrados.forEach(t => {
            if (t.tecnico_ejecucion) {
                const nombre = t.tecnico_ejecucion.trim().toUpperCase();
                if (nombre !== "SIN ASIGNAR" && nombre !== "0") {
                    tecnicosMap[nombre] = (tecnicosMap[nombre] || 0) + 1;
                }
            }
        });

        const listaTecnicos = Object.entries(tecnicosMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return { total, enProceso, terminados, listaTecnicos };
    }, [trabajosFiltrados]);

    if (loading) return <div className="p-10 text-center text-slate-500">Cargando datos...</div>;

    return (
        <div className="space-y-6 relative">

            {/* Cabecera y Filtros */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h1 className="text-2xl font-bold text-slate-800">Panel de Productividad</h1>

                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm">
                    {[
                        { key: 'dia', label: 'Hoy' },
                        { key: 'semana', label: 'Esta Semana' },
                        { key: 'mes', label: 'Este Mes' },
                        { key: 'todo', label: 'Histórico' }
                    ].map((p) => (
                        <button
                            key={p.key}
                            onClick={() => setPeriodo(p.key as any)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all
                                ${periodo === p.key 
                                    ? 'bg-blue-600 text-white shadow-md' 
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-600'}`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tarjetas KPI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total Trabajos</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</h3>
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                        <CalendarDays size={12}/> {periodo === 'todo' ? 'Histórico completo' : 'En el periodo seleccionado'}
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">En Proceso / Espera</p>
                    <h3 className="text-3xl font-bold text-amber-600 mt-2">{stats.enProceso}</h3>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Terminados</p>
                    <h3 className="text-3xl font-bold text-emerald-600 mt-2">{stats.terminados}</h3>
                </div>

                {/* TARJETA INTERACTIVA DE TÉCNICOS */}
                <div
                    onClick={() => setShowTechModal(true)}
                    className="bg-blue-600 p-6 rounded-2xl shadow-lg shadow-blue-500/30 cursor-pointer hover:bg-blue-700 transition-all transform hover:scale-[1.02] group"
                >
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Técnicos Activos</p>
                            <h3 className="text-3xl font-bold text-white mt-2">{stats.listaTecnicos.length}</h3>
                        </div>
                        <Users className="text-blue-200 group-hover:text-white transition-colors" size={24} />
                    </div>
                    <p className="text-blue-200 text-xs mt-4 underline">Ver lista detallada →</p>
                </div>
            </div>

            {/* Gráficas y Tablas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Gráfica */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Productividad por Técnico</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats.listaTecnicos.slice(0, 10)} layout="vertical" margin={{ left: 10 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10}} />
                                <Tooltip />
                                <Bar dataKey="count" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Tabla Resumen */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                    <h3 className="text-lg font-bold text-slate-800 mb-4">Detalle de Actividad</h3>
                    <div className="overflow-y-auto max-h-80 pr-2">
                        {stats.listaTecnicos.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                        {t.name.charAt(0)}
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">{t.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="block text-sm font-bold text-slate-800">{t.count}</span>
                                    <span className="text-xs text-slate-400">órdenes</span>
                                </div>
                            </div>
                        ))}
                        {stats.listaTecnicos.length === 0 && (
                            <div className="text-center py-10 text-slate-400">No hay actividad en este periodo.</div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL DE TÉCNICOS --- */}
            {showTechModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Listado de Técnicos</h2>
                                <p className="text-sm text-slate-500">Periodo: {periodo.toUpperCase()}</p>
                            </div>
                            <button onClick={() => setShowTechModal(false)} className="p-2 hover:bg-white rounded-full transition-colors text-slate-500">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {stats.listaTecnicos.map((t, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 border border-slate-100 rounded-xl hover:shadow-md transition-all bg-white">
                                    <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700">{t.name}</h4>
                                        <p className="text-sm text-slate-500">{t.count} trabajos realizados</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-4 border-t border-slate-100 text-right">
                            <button onClick={() => setShowTechModal(false)} className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}