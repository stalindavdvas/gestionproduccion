import React, { useEffect, useState, useMemo } from 'react';
import { Users, RefreshCw, CalendarDays, X, TrendingUp, AlertCircle, CheckCircle2, Award } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { api } from '../services/api';

// 1. INTERFAZ QUE COINCIDE CON TU BACKEND ACTUAL (Schemas.py)
interface Trabajo {
    id_appsheet: string;
    no_orden_taller?: string;
    no_orden_campo?: string;
    estado?: string;
    fecha_ingreso?: string;
    dano_reportado?: string;

    // Relación nueva (Backend actualizado)
    tecnico_rel?: {
        id: number;
        nombre_completo: string;
    };

    // Campo antiguo (por si acaso quedan datos viejos)
    tecnico_ejecucion?: string;

    // Relación Equipo (CRÍTICO PARA TU IDEA)
    equipo_rel?: {
        serie?: string;
        modelo?: string;
        marca?: string;
    };
}

export default function DashboardHome() {
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [loading, setLoading] = useState(true);
    const [periodo, setPeriodo] = useState<'dia' | 'semana' | 'mes' | 'anio' | 'todo'>('mes');
    const [showTechModal, setShowTechModal] = useState(false);

    // Estados para filtros personalizados
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Asegúrate de que api.getTrabajos llama a /api/trabajos
            const data = await api.getTrabajos();
            console.log("Datos recibidos:", data); // Para depuración
            setTrabajos(data);
        } catch (error) {
            console.error("Error cargando dashboard", error);
        } finally {
            setLoading(false);
        }
    };

    // --- 2. FILTRO DE TIEMPO PERSONALIZABLE ---
    const trabajosFiltrados = useMemo(() => {
        if (periodo === 'todo') return trabajos;

        const hoy = new Date();
        const inicioDia = new Date(hoy.setHours(0,0,0,0));

        return trabajos.filter(t => {
            if (!t.fecha_ingreso) return false;
            // Convertimos fecha string a objeto Date (ajustando zona horaria si es necesario)
            const fechaTrabajo = new Date(t.fecha_ingreso);
            // Parche rápido para fechas UTC que pueden caer el día anterior
            const fechaAjustada = new Date(fechaTrabajo.getTime() + (fechaTrabajo.getTimezoneOffset() * 60000));

            if (periodo === 'dia') {
                return fechaAjustada.getDate() === new Date().getDate() &&
                       fechaAjustada.getMonth() === new Date().getMonth() &&
                       fechaAjustada.getFullYear() === new Date().getFullYear();
            }
            if (periodo === 'semana') {
                const hace7dias = new Date();
                hace7dias.setDate(hace7dias.getDate() - 7);
                return fechaAjustada >= hace7dias;
            }
            if (periodo === 'mes') {
                // Filtra por el mes y año seleccionados en los dropdowns
                return fechaAjustada.getMonth() === selectedMonth &&
                       fechaAjustada.getFullYear() === selectedYear;
            }
            if (periodo === 'anio') {
                 return fechaAjustada.getFullYear() === selectedYear;
            }
            return true;
        });
    }, [trabajos, periodo, selectedMonth, selectedYear]);

    // Calcular el rango de fechas mostrado para el título
    const rangoFechasTexto = useMemo(() => {
        if (periodo === 'todo') return 'Histórico Completo';
        if (periodo === 'dia') return 'Hoy';
        if (periodo === 'semana') return 'Últimos 7 Días';
        if (periodo === 'mes') {
            const date = new Date(selectedYear, selectedMonth);
            return date.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
        }
        if (periodo === 'anio') return `Año ${selectedYear}`;
        return '';
    }, [periodo, selectedMonth, selectedYear]);


    // --- 3. CÁLCULO INTELIGENTE DE CALIDAD (ALGORITMO DE REINCIDENCIA) ---
    const stats = useMemo(() => {
        const total = trabajosFiltrados.length;

        // --- A. Contadores Básicos ---
        const enProceso = trabajosFiltrados.filter(t => {
            const st = (t.estado || '').toUpperCase();
            return !st.includes('ENTREGADO') && !st.includes('FINALIZADO') && !st.includes('REALIZADO') && !st.includes('CERRADO');
        }).length;

        const terminados = trabajosFiltrados.filter(t => {
            const st = (t.estado || '').toUpperCase();
            return st.includes('ENTREGADO') || st.includes('FINALIZADO') || st.includes('REALIZADO') || st.includes('CERRADO');
        }).length;

        // --- B. ALGORITMO DE REINCIDENCIA ---
        // 1. Agrupar historial por Serie (usando todos los trabajos para ver historial)
        const historialEquipos: Record<string, Trabajo[]> = {};

        trabajos.forEach(t => {
            const serie = t.equipo_rel?.serie;
            if (serie && serie.length > 3 && serie.toUpperCase() !== "S/N") {
                if (!historialEquipos[serie]) historialEquipos[serie] = [];
                historialEquipos[serie].push(t);
            }
        });

        let reincidenciasCriticas = 0;
        const seriesConProblemas = new Set<string>();

        // 2. Analizar cada equipo
        Object.entries(historialEquipos).forEach(([serie, historial]) => {
            // Ordenamos por fecha
            historial.sort((a, b) => new Date(a.fecha_ingreso || '').getTime() - new Date(b.fecha_ingreso || '').getTime());

            for (let i = 1; i < historial.length; i++) {
                const visitaActual = historial[i];
                const visitaAnterior = historial[i - 1];

                const fechaActual = new Date(visitaActual.fecha_ingreso || '');
                // Verificar si esta visita está dentro del periodo filtrado
                const esDelPeriodo = trabajosFiltrados.some(tf => tf.id_appsheet === visitaActual.id_appsheet);

                if (esDelPeriodo) {
                    const fechaAnterior = new Date(visitaAnterior.fecha_ingreso || '');
                    const diffTiempo = Math.abs(fechaActual.getTime() - fechaAnterior.getTime());
                    const diffDias = Math.ceil(diffTiempo / (1000 * 60 * 60 * 24));

                    // REGLA: Si vuelve en menos de 45 días
                    if (diffDias <= 45) {
                        reincidenciasCriticas++;
                        seriesConProblemas.add(serie);
                    }
                }
            }
        });

        // --- C. KPI FINAL: CALIDAD TÉCNICA ---
        let calidadTecnica = 100;
        if (total > 0) {
            const porcentajeFallas = (reincidenciasCriticas / total) * 100;
            calidadTecnica = Math.max(0, 100 - porcentajeFallas);
        }

        // --- D. Agrupación Técnicos ---
        const tecnicosMap: Record<string, number> = {};
        trabajosFiltrados.forEach(t => {
            let nombre = "SIN ASIGNAR";
            if (t.tecnico_rel?.nombre_completo) {
                nombre = t.tecnico_rel.nombre_completo.trim().toUpperCase();
            } else if (t.tecnico_ejecucion) {
                nombre = t.tecnico_ejecucion.trim().toUpperCase();
            }
            if (nombre !== "SIN ASIGNAR" && nombre !== "0" && nombre.length > 2) {
                tecnicosMap[nombre] = (tecnicosMap[nombre] || 0) + 1;
            }
        });

        const listaTecnicos = Object.entries(tecnicosMap)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return {
            total,
            enProceso,
            terminados,
            reincidenciasCriticas,
            calidad: Math.round(calidadTecnica),
            listaTecnicos
        };
    }, [trabajosFiltrados, trabajos]);


    if (loading) return (
        <div className="flex h-[calc(100vh-100px)] items-center justify-center flex-col gap-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-slate-400">Calculando estadísticas...</p>
        </div>
    );

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-500">

            {/* HEADER CON FILTROS AVANZADOS */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <TrendingUp className="text-blue-600"/>
                        Panel de Productividad
                    </h1>
                    <p className="text-slate-500 text-sm flex items-center gap-2 mt-1">
                        <CalendarDays size={14} />
                        Viendo datos de: <span className="font-bold text-blue-600 uppercase">{rangoFechasTexto}</span>
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Botones de Periodo */}
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                        {[
                            { key: 'dia', label: 'Hoy' },
                            { key: 'semana', label: '7 Días' },
                            { key: 'mes', label: 'Mes' },
                            { key: 'anio', label: 'Año' },
                            { key: 'todo', label: 'Todo' }
                        ].map((p) => (
                            <button
                                key={p.key}
                                onClick={() => setPeriodo(p.key as any)}
                                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all
                                    ${periodo === p.key 
                                        ? 'bg-white text-blue-600 shadow-sm' 
                                        : 'text-slate-500 hover:text-blue-600'}`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Selectores de Mes/Año (Solo visibles si se selecciona Mes o Año) */}
                    {(periodo === 'mes' || periodo === 'anio') && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-right-4">
                            {periodo === 'mes' && (
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(Number(e.target.value))}
                                    className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                                >
                                    {Array.from({length: 12}, (_, i) => (
                                        <option key={i} value={i}>{new Date(0, i).toLocaleString('es-ES', {month: 'long'})}</option>
                                    ))}
                                </select>
                            )}
                            <select
                                value={selectedYear}
                                onChange={(e) => setSelectedYear(Number(e.target.value))}
                                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg px-2 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                            >
                                {Array.from({length: 5}, (_, i) => new Date().getFullYear() - i).map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <button onClick={loadData} className="ml-2 p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors" title="Recargar Datos">
                        <RefreshCw size={18}/>
                    </button>
                </div>
            </div>

            {/* KPIS */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Trabajos</p>
                    <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.total}</h3>
                    <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                        <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-500">{rangoFechasTexto}</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-amber-500/80 text-xs font-bold uppercase tracking-wider">En Proceso</p>
                            <h3 className="text-3xl font-bold text-amber-600 mt-2">{stats.enProceso}</h3>
                        </div>
                        <AlertCircle className="text-amber-200" size={24}/>
                    </div>
                </div>

                {/* TARJETA DE CALIDAD TÉCNICA (Basada en Retornos) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-rose-500/80 text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                            Calidad de Servicio
                            <span className="bg-rose-100 text-rose-600 px-1 rounded text-[10px]" title="Basado en equipos que regresan en menos de 45 días">
                                ISO
                            </span>
                        </p>

                        <div className="flex items-baseline gap-3 mt-2">
                            <h3 className={`text-3xl font-bold ${
                                stats.calidad >= 95 ? 'text-emerald-600' : 
                                stats.calidad >= 85 ? 'text-amber-500' : 'text-rose-600'
                            }`}>
                                {stats.calidad}%
                            </h3>

                            {stats.reincidenciasCriticas > 0 ? (
                                <div className="flex flex-col">
                                    <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">
                                        ⚠️ {stats.reincidenciasCriticas} Retornos
                                    </span>
                                </div>
                            ) : (
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                    Excelencia ⭐
                                </span>
                            )}
                        </div>

                        <p className="text-slate-400 text-xs mt-2 leading-tight">
                            {stats.reincidenciasCriticas > 0
                                ? 'Equipos reingresaron <45 días tras reparación.'
                                : 'Sin reincidencias tempranas detectadas.'}
                        </p>
                    </div>

                    {/* Barra de progreso visual */}
                    <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-100">
                        <div
                            className={`h-full transition-all duration-1000 ${
                                stats.calidad >= 95 ? 'bg-emerald-500' : 
                                stats.calidad >= 85 ? 'bg-amber-400' : 'bg-rose-500'
                            }`}
                            style={{ width: `${stats.calidad}%` }}
                        />
                    </div>
                </div>

                {/* KPI INTERACTIVO: TÉCNICOS */}
                <div
                    onClick={() => setShowTechModal(true)}
                    className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg shadow-blue-500/20 cursor-pointer hover:scale-[1.02] transition-transform group relative overflow-hidden"
                >
                    <div className="relative z-10">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-blue-200 text-xs font-bold uppercase tracking-wider">Productividad</p>
                                <h3 className="text-3xl font-bold text-white mt-2">{stats.listaTecnicos.length}</h3>
                                <p className="text-blue-100 text-xs mt-1">Técnicos activos</p>
                            </div>
                            <Users className="text-blue-300 group-hover:text-white transition-colors" size={28} />
                        </div>
                        <p className="text-white/80 text-xs mt-4 flex items-center gap-1 group-hover:underline">
                            Ver detalles <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </p>
                    </div>
                    {/* Decoración fondo */}
                    <div className="absolute right-[-20px] bottom-[-20px] opacity-10 rotate-12">
                         <Users size={100} color="white"/>
                    </div>
                </div>
            </div>

            {/* GRÁFICAS Y TABLAS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. GRÁFICA DE BARRAS */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[420px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Rendimiento por Técnico</h3>
                    <p className="text-xs text-slate-400 mb-4">Top 10 técnicos con más órdenes</p>

                    <div className="flex-1 min-h-0 w-full">
                        {stats.listaTecnicos.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={stats.listaTecnicos.slice(0, 10)}
                                    layout="vertical"
                                    margin={{ left: 10, right: 30, top: 10, bottom: 10 }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0"/>
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={110}
                                        tick={{fontSize: 10, fill: '#64748b', fontWeight: 600}}
                                        interval={0}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                                        {stats.listaTecnicos.slice(0, 10).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index % 5]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                                <Users size={48} className="mb-2 opacity-20"/>
                                No hay datos de técnicos en este periodo.
                            </div>
                        )}
                    </div>
                </div>

                {/* 2. TABLA DETALLE (LISTA) */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[420px]">
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Detalle de Actividad</h3>
                    <p className="text-xs text-slate-400 mb-4">Ranking completo</p>

                    <div className="overflow-y-auto pr-2 flex-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                        {stats.listaTecnicos.map((t, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 mb-2 border border-slate-50 hover:border-slate-200 hover:bg-slate-50 rounded-xl transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className={`
                                        w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-colors
                                        ${idx < 3 ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-500'}
                                    `}>
                                        {idx + 1}
                                    </div>
                                    <div>
                                        <span className="block text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">
                                            {t.name}
                                        </span>
                                        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Técnico</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="block text-lg font-bold text-slate-800">{t.count}</span>
                                    <span className="text-[10px] text-slate-400 font-medium">órdenes</span>
                                </div>
                            </div>
                        ))}

                        {stats.listaTecnicos.length === 0 && (
                            <div className="text-center py-20 text-slate-400 text-sm italic">
                                Sin registros disponibles.
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- MODAL DETALLE --- */}
            {showTechModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-bold text-slate-800">Listado de Técnicos</h2>
                                <p className="text-sm text-slate-500">Periodo: {rangoFechasTexto}</p>
                            </div>
                            <button onClick={() => setShowTechModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/30">
                            {stats.listaTecnicos.map((t, idx) => (
                                <div key={idx} className="flex items-center gap-4 p-4 border border-slate-200 bg-white rounded-xl hover:shadow-md transition-all">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                                        {t.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-700 text-sm">{t.name}</h4>
                                        <p className="text-xs text-slate-500 font-medium">{t.count} trabajos realizados</p>
                                    </div>
                                </div>
                            ))}
                            {stats.listaTecnicos.length === 0 && (
                                <p className="col-span-2 text-center text-slate-400 py-10">No hay datos.</p>
                            )}
                        </div>

                        <div className="p-4 border-t border-slate-100 bg-white rounded-b-2xl text-right">
                            <button
                                onClick={() => setShowTechModal(false)}
                                className="px-6 py-2 bg-slate-800 text-white rounded-lg font-medium hover:bg-slate-900 transition-colors shadow-lg shadow-slate-200"
                            >
                                Cerrar Ventana
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}