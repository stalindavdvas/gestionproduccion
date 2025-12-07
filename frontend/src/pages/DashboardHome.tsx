import { Users, Wrench, Calendar, TrendingUp, AlertCircle} from 'lucide-react';
import type {LucideIcon } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Datos falsos para el prototipo visual
const dataProduccion = [
  { name: 'Lun', taller: 12, campo: 8 },
  { name: 'Mar', taller: 19, campo: 12 },
  { name: 'Mie', taller: 15, campo: 15 },
  { name: 'Jue', taller: 22, campo: 10 },
  { name: 'Vie', taller: 30, campo: 5 },
  { name: 'Sab', taller: 10, campo: 2 },
];

// Componente tarjeta reutilizable
interface StatCardProps {
    title: string;
    value: string;
    subtext: string;
    icon: LucideIcon;
    colorClass: string; // Ej: "text-blue-500"
    bgClass: string;    // Ej: "bg-blue-50"
}

const StatCard = ({ title, value, subtext, icon: Icon, colorClass, bgClass }: StatCardProps) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
        <p className={`text-xs mt-2 font-medium ${subtext.includes('+') ? 'text-emerald-600' : 'text-slate-400'}`}>
          {subtext}
        </p>
      </div>
      <div className={`p-3 rounded-xl ${bgClass}`}>
        <Icon className={colorClass} size={24} />
      </div>
    </div>
  </div>
);

export default function DashboardHome() {
  return (
    <div className="space-y-8">
      {/* Cabecera de la página */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Panel de Productividad</h1>
          <p className="text-slate-500">Resumen de operaciones técnicas · Diciembre 2025</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer">
          <Calendar size={18} />
          Filtrar Fecha
        </button>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Órdenes Totales"
          value="1,248"
          subtext="+12% vs mes anterior"
          icon={Wrench}
          colorClass="text-blue-600"
          bgClass="bg-blue-50"
        />
        <StatCard
          title="Técnicos Activos"
          value="14"
          subtext="2 en vacaciones"
          icon={Users}
          colorClass="text-violet-600"
          bgClass="bg-violet-50"
        />
        <StatCard
          title="Productividad"
          value="8.5"
          subtext="Órdenes / día / técnico"
          icon={TrendingUp}
          colorClass="text-emerald-600"
          bgClass="bg-emerald-50"
        />
        <StatCard
          title="Pendientes Críticos"
          value="3"
          subtext="Requieren atención"
          icon={AlertCircle}
          colorClass="text-rose-600"
          bgClass="bg-rose-50"
        />
      </div>

      {/* Sección Principal: Gráfico y Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Gráfico */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Rendimiento Semanal</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataProduccion} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} />
                <Tooltip
                  cursor={{fill: '#F1F5F9'}}
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="taller" name="En Taller" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="campo" name="En Campo" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lista Lateral */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Actividad Reciente</h3>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer border border-transparent hover:border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                    TC
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-800">Orden #202{item}</p>
                    <p className="text-xs text-slate-500">Mantenimiento Balanza</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                  Listo
                </span>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2 text-sm text-blue-600 font-medium hover:bg-blue-50 rounded-lg transition-colors cursor-pointer">
            Ver todas las órdenes
          </button>
        </div>
      </div>
    </div>
  );
}