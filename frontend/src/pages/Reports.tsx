import { useEffect, useState, useMemo } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, Eye, RefreshCw, Filter, Calendar } from 'lucide-react';
import { api } from '../services/api';

// Definición de la estructura de datos que viene del Backend
interface Trabajo {
    id: number;
    numero_orden_final: string; // Propiedad calculada que trae la orden correcta
    fecha_ingreso?: string;
    tipo_ingreso: string;
    estado?: string;
    tecnico_ejecucion?: string; // Nombre del técnico
    servicio?: string;
    cliente_rel?: {
        nombre_fiscal: string;
        ruc: string;
    };
}

export default function Reports() {
    const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 15; // Mostramos 15 registros por página

    // 1. Cargar datos al iniciar
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Traemos hasta 5000 registros para tener toda la base
            const data = await api.getTrabajos();
            setTrabajos(data);
        } catch (error) {
            console.error("Error cargando reportes:", error);
        } finally {
            setLoading(false);
        }
    };

    // 2. LÓGICA DE BÚSQUEDA MULTI-CAMPO
    // Usamos useMemo para que el filtrado sea instantáneo sin bloquear la pantalla
    const filteredData = useMemo(() => {
        if (!searchTerm) return trabajos;

        const term = searchTerm.toLowerCase();

        return trabajos.filter(item => {
            // 1. Buscar por Número de Orden
            const orden = (item.numero_orden_final || '').toLowerCase();
            // 2. Buscar por Nombre de Cliente
            const cliente = (item.cliente_rel?.nombre_fiscal || '').toLowerCase();
            // 3. Buscar por RUC
            const ruc = (item.cliente_rel?.ruc || '').toLowerCase();
            // 4. Buscar por Técnico
            const tecnico = (item.tecnico_ejecucion || '').toLowerCase();

            // Si coincide con cualquiera, lo mostramos
            return orden.includes(term) || cliente.includes(term) || ruc.includes(term) || tecnico.includes(term);
        });
    }, [trabajos, searchTerm]);

    // 3. Lógica de Paginación
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentData = filteredData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

   // Helper para colorear el estado (VERSIÓN SEGURA)
    const getStatusColor = (estado: string | null | undefined) => {
        // 1. Si es nulo o indefinido, devolvemos gris directo sin hacer toUpperCase
        if (!estado) return 'bg-slate-50 text-slate-600 border-slate-100';

        const est = estado.toUpperCase();
        if (est.includes('ENTREGADO') || est.includes('FINALIZADO')) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
        if (est.includes('PROCESO') || est.includes('INGRESO') || est.includes('APROBACIÓN')) return 'bg-blue-50 text-blue-700 border-blue-100';
        if (est.includes('PENDIENTE') || est.includes('ESPERA')) return 'bg-amber-50 text-amber-700 border-amber-100';
        return 'bg-slate-50 text-slate-600 border-slate-100';
    };

    return (
        <div className="space-y-6">

            {/* Header Principal */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Base de Datos de Ingresos</h1>
                    <p className="text-slate-500">
                        Mostrando {filteredData.length} registros totales
                        {loading && ' (Actualizando...)'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadData}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-colors"
                        title="Recargar Datos"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 font-medium transition-all">
                        <Download size={18} />
                        <span className="hidden sm:inline">Exportar Excel</span>
                    </button>
                </div>
            </div>

            {/* Tarjeta Principal de la Tabla */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col min-h-[600px]">

                {/* Barra de Herramientas y Búsqueda */}
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row gap-4 justify-between items-center">

                    {/* BUSCADOR POTENTE */}
                    <div className="relative w-full md:max-w-xl group">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Search size={20} />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} // Resetea a pág 1 al buscar
                            placeholder="Buscar por Orden, Técnico o Cliente..."
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-600 text-sm hover:bg-slate-50 font-medium w-full justify-center md:w-auto">
                            <Filter size={16} /> Filtros Avanzados
                        </button>
                    </div>
                </div>

                {/* Contenido de la Tabla */}
                <div className="flex-1 overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-96 flex-col gap-3">
                            <RefreshCw className="animate-spin text-blue-500" size={40} />
                            <span className="text-slate-500 font-medium">Sincronizando base de datos...</span>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Orden / Fecha</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Servicio / Tipo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Técnico Asignado</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Estado Actual</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 bg-white">
                                {currentData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                                            <div className="flex flex-col items-center gap-2">
                                                <Search size={40} className="opacity-20" />
                                                <p>No se encontraron resultados para "{searchTerm}"</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentData.map((item) => (
                                        <tr key={item.id} className="hover:bg-slate-50 transition-colors group">

                                            {/* Columna 1: Orden y Fecha */}
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 text-sm">
                                                    {item.numero_orden_final || 'S/N'}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                                    <Calendar size={12} />
                                                    {item.fecha_ingreso ? new Date(item.fecha_ingreso).toLocaleDateString() : 'Sin fecha'}
                                                </div>
                                            </td>

                                            {/* Columna 2: Cliente */}
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-700 max-w-[200px] truncate" title={item.cliente_rel?.nombre_fiscal}>
                                                    {item.cliente_rel?.nombre_fiscal || 'Cliente no registrado'}
                                                </div>
                                                <div className="text-xs text-slate-400">
                                                    {item.cliente_rel?.ruc || 'Sin RUC'}
                                                </div>
                                            </td>

                                            {/* Columna 3: Tipo y Servicio */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border
                                                        ${item.tipo_ingreso?.includes('Campo') 
                                                            ? 'bg-purple-50 text-purple-700 border-purple-100' 
                                                            : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                                                        {item.tipo_ingreso || 'Taller'}
                                                    </span>
                                                    <span className="text-xs text-slate-500 truncate max-w-[150px]">
                                                        {item.servicio || 'Mantenimiento'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Columna 4: Técnico */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    {item.tecnico_ejecucion ? (
                                                        <>
                                                            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shadow-sm">
                                                                {item.tecnico_ejecucion.charAt(0)}
                                                            </div>
                                                            <span className="text-sm text-slate-600 font-medium">{item.tecnico_ejecucion}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic bg-slate-50 px-2 py-1 rounded">Sin asignar</span>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Columna 5: Estado */}
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(item.estado)}`}>
                                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60"></span>
                                                    {item.estado || 'No registrado'}
                                                </span>
                                            </td>

                                            {/* Columna 6: Acciones */}
                                            <td className="px-6 py-4 text-right">
                                                <button className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-all" title="Ver detalles">
                                                    <Eye size={18} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Footer de Paginación */}
                <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                    <span className="text-sm text-slate-500 hidden sm:block">
                        Mostrando {Math.min(filteredData.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filteredData.length, currentPage * itemsPerPage)} de {filteredData.length} registros
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="px-4 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 shadow-sm min-w-[100px] text-center">
                            Pág {currentPage} de {totalPages || 1}
                        </div>

                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 text-slate-600 cursor-pointer disabled:cursor-not-allowed shadow-sm"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}