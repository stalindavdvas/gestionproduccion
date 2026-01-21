import { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  Calendar, TrendingUp, Users, MapPin, Target, Award, Sparkles, Bot, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { api } from '../services/api';

// Paleta de colores profesional
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export default function Analytics() {
  // --- ESTADOS ---
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtros de fecha (Por defecto últimos 6 meses)
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 6);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Estados para la IA
  const [insight, setInsight] = useState<string | null>(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

  // --- EFECTOS ---
  useEffect(() => {
    loadAnalytics();
    setInsight(null); // Limpiar insight al cambiar fechas
  }, [startDate, endDate]);

  // --- FUNCIONES ---
  const loadAnalytics = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await api.getAnalytics(startDate, endDate);
      setData(result);
    } catch (err) {
      console.error("Error cargando analítica", err);
      setError('No se pudieron cargar los datos. Verifica que el backend esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const generateInsight = async () => {
    setLoadingInsight(true);
    try {
      const result = await api.getAnalyticsInsight(startDate, endDate);
      setInsight(result.content);
    } catch (err) {
      console.error("Error IA", err);
      setInsight("❌ Ocurrió un error al intentar comunicar con la IA.");
    } finally {
      setLoadingInsight(false);
    }
  };

  // --- RENDERIZADO DE CARGA / ERROR ---
  if (loading) return (
    <div className="flex h-[calc(100vh-100px)] items-center justify-center flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 animate-pulse">Procesando datos históricos...</p>
    </div>
  );

  if (error) return (
    <div className="p-8 text-center text-red-500 bg-red-50 rounded-xl m-4 border border-red-200">
      <AlertCircle className="mx-auto mb-2" size={32}/>
      {error}
    </div>
  );

  if (!data) return null;

  // Cálculos rápidos para KPIs
  const topTech = data.technicians.length > 0 ? data.technicians[0] : { name: 'N/A', total: 0 };
  const totalServices = data.trends.reduce((acc: number, curr: any) => acc + curr.count, 0);

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">

      {/* 1. HEADER Y FILTROS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            Analítica de Operaciones
          </h1>
          <p className="text-slate-500 text-sm">Optimización basada en datos históricos</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2 px-2">
            <Calendar size={16} className="text-slate-400"/>
            <span className="text-xs font-bold text-slate-500 uppercase">Rango:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="bg-white border border-slate-200 text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 font-medium"
          />
          <span className="text-slate-400 font-bold">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="bg-white border border-slate-200 text-sm rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 outline-none text-slate-600 font-medium"
          />
        </div>
      </div>

      {/* 2. SECCIÓN IA: EL CEREBRO ESTRATÉGICO */}
      <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
          {/* Decoración de fondo */}
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none z-0">
            <Bot size={120} />
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start mb-6 relative z-10">
             <div className="max-w-2xl">
                <h2 className="text-lg font-bold text-indigo-900 flex items-center gap-2">
                   <Sparkles className="text-indigo-600" size={20} />
                   Análisis Inteligente (Gemini AI)
                </h2>
                <p className="text-indigo-600/70 text-sm mt-1">
                  Obtén un diagnóstico ejecutivo, detección de anomalías y recomendaciones estratégicas basadas en los datos actuales.
                </p>
             </div>

             <button
                onClick={generateInsight}
                disabled={loadingInsight}
                className="mt-4 md:mt-0 flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 disabled:opacity-70 disabled:cursor-not-allowed font-medium shrink-0"
             >
                {loadingInsight ? (
                   <>
                     <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"/>
                     Analizando...
                   </>
                ) : (
                   <><Bot size={18}/> Generar Informe Ejecutivo</>
                )}
             </button>
          </div>

          {/* CONTENEDOR DEL REPORTE GENERADO */}
          {insight ? (
             <div className="bg-white/80 backdrop-blur rounded-xl p-6 border border-indigo-100 text-slate-700 prose prose-indigo max-w-none animate-in slide-in-from-bottom-2 duration-500 shadow-sm relative z-10">
                <ReactMarkdown>{insight}</ReactMarkdown>
             </div>
          ) : (
            !loadingInsight && (
              <div className="text-center py-6 text-indigo-300 italic text-sm border-2 border-dashed border-indigo-100 rounded-xl bg-white/30 relative z-10">
                 Los datos están listos. Haz clic en el botón para que la IA los interprete por ti.
              </div>
            )
          )}
       </div>

      {/* 3. KPIS ESTRATÉGICOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Volumen Total</p>
                <h3 className="text-4xl font-bold text-slate-800 mt-2">{totalServices}</h3>
                <p className="text-blue-600 text-xs mt-1 font-medium bg-blue-50 inline-block px-2 py-0.5 rounded">Trabajos realizados</p>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl"><Target size={28}/></div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
            <div className="overflow-hidden">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Top Performer</p>
                <h3 className="text-2xl font-bold text-slate-800 mt-2 truncate" title={topTech.name}>{topTech.name}</h3>
                <p className="text-emerald-600 text-xs mt-1 font-medium bg-emerald-50 inline-block px-2 py-0.5 rounded">
                    Líder de productividad
                </p>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 ml-2"><Award size={28}/></div>
        </div>

        {/* TARJETA DE CALIDAD REAL (Backend Calculated) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="relative z-10">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-wider flex gap-2">
                   Calidad Técnica
                   {data.quality_kpi?.reincidencias_detectadas > 0 && (
                      <span className="text-red-500 bg-red-50 px-1 rounded text-[10px]">Alerta</span>
                   )}
                </p>
                <h3 className={`text-3xl font-bold mt-2 ${
                    (data.quality_kpi?.tasa_calidad || 100) >= 90 ? 'text-emerald-600' : 'text-amber-500'
                }`}>
                    {data.quality_kpi?.tasa_calidad || 100}%
                </h3>
                <p className="text-slate-400 text-xs mt-1 font-medium inline-block">
                    {data.quality_kpi?.reincidencias_detectadas || 0} equipos reincidentes
                </p>
            </div>

            {/* Gráfico Circular SVG */}
            <div className="relative w-16 h-16">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r="28" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
                    <circle
                        cx="32" cy="32" r="28"
                        stroke="currentColor"
                        strokeWidth="6"
                        fill="transparent"
                        strokeDasharray={175}
                        strokeDashoffset={175 - (175 * (data.quality_kpi?.tasa_calidad || 100)) / 100}
                        className={`${
                            (data.quality_kpi?.tasa_calidad || 100) >= 90 ? 'text-emerald-500' : 'text-amber-500'
                        } transition-all duration-1000`}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-slate-300">
                    <Award size={20} />
                </div>
            </div>
        </div>
      </div>

      {/* 4. GRÁFICOS PRINCIPALES */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* Rendimiento por Técnico */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Users size={20} className="text-blue-500"/>
                    Rendimiento Técnico
                </h3>
                <p className="text-sm text-slate-500">Distribución de carga laboral</p>
            </div>
            <div className="h-80 w-full flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.technicians} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={120} tick={{fontSize: 11, fill: '#64748B'}} />
                        <Tooltip
                            cursor={{fill: '#F8FAFC'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                        />
                        <Bar dataKey="total" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={20}>
                            {data.technicians.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Tendencia Temporal */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <TrendingUp size={20} className="text-purple-500"/>
                    Tendencia de Demanda
                </h3>
                <p className="text-sm text-slate-500">Evolución histórica mensual</p>
            </div>
            <div className="h-80 w-full flex-1 min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748B'}} />
                        <YAxis tick={{fontSize: 12, fill: '#64748B'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Area type="monotone" dataKey="count" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>

      {/* 5. DISTRIBUCIÓN Y GEOGRAFÍA */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Pastel: Servicios */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-1 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-1">Tipos de Servicio</h3>
            <p className="text-sm text-slate-500 mb-4">Segmentación operativa</p>
            <div className="h-80 w-full min-h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data.services}
                            cx="50%"
                            cy="45%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.services.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip contentStyle={{borderRadius: '12px'}} />
                        <Legend
                            verticalAlign="bottom"
                            height={80}
                            iconType="circle"
                            wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* Mapa / Ciudades */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm lg:col-span-2 flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-1">
                <MapPin size={20} className="text-red-500"/>
                Top Ciudades
            </h3>
            <p className="text-sm text-slate-500 mb-6">Ubicaciones con mayor frecuencia de servicios</p>

            <div className="h-80 w-full min-h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.locations} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                        <XAxis
                            dataKey="city"
                            tick={{fontSize: 11, fill: '#64748B'}}
                            interval={0}
                            angle={-30}
                            textAnchor="end"
                        />
                        <YAxis tick={{fontSize: 11, fill: '#64748B'}} />
                        <Tooltip cursor={{fill: '#FEF2F2'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="count" fill="#EF4444" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
}