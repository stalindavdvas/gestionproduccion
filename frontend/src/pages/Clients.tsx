import React, { useEffect, useState, useMemo } from 'react';
import { Search, MapPin, Building2, Phone, Mail, User, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

interface Cliente {
    id_cliente_appsheet: string;
    nombre_fiscal: string;
    ruc: string;
    ciudad: string;
    industria: string;
    asesor_responsable: string;
    contacto?: string;
    telefono?: string;
    correo?: string;
}

export default function Clients() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await api.getClientes();
            setClientes(data);
        } catch (error) {
            console.error("Error cargando clientes", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredData = useMemo(() => {
        return clientes.filter(c =>
            (c.nombre_fiscal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.ruc || '').includes(searchTerm) ||
            (c.asesor_responsable || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clientes, searchTerm]);

    // Paginación
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const currentData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Directorio de Clientes</h1>
                    <p className="text-slate-500">Cartera total: {clientes.length} empresas</p>
                </div>
                <button onClick={loadData} className="p-2 bg-white border rounded-lg hover:bg-slate-50">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar empresa, RUC o asesor..."
                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Empresa / RUC</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Ubicación</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Industria</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Contacto</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Asesor</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {currentData.map((c) => (
                                <tr key={c.id_cliente_appsheet} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-slate-700">{c.nombre_fiscal}</div>
                                        <div className="text-xs text-slate-400">{c.ruc}</div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <div className="flex items-center gap-1">
                                            <MapPin size={14} className="text-slate-400" />
                                            {c.ciudad || 'S/N'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium border border-indigo-100">
                                            {c.industria || 'General'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <div className="flex flex-col gap-1">
                                            {c.contacto && <span className="flex items-center gap-1 text-slate-700"><User size={12}/> {c.contacto}</span>}
                                            {c.telefono && <span className="flex items-center gap-1 text-slate-500 text-xs"><Phone size={12}/> {c.telefono}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        {c.asesor_responsable}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {/* Footer Paginación */}
                 <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
                    <span className="text-sm text-slate-500">Página {currentPage} de {totalPages}</span>
                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronLeft size={16}/></button>
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronRight size={16}/></button>
                    </div>
                </div>
            </div>
        </div>
    );
}