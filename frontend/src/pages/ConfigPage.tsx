import { useState } from 'react';
import { Cloud, Database, RefreshCw, CheckCircle, Server, ArrowRight, Play, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function ConfigPage() {
    const [status, setStatus] = useState<'idle' | 'syncing' | 'completed' | 'error'>('idle');
    const [step, setStep] = useState(0); // 0: Idle, 1: Clientes, 2: Ingresos, 3: Fin
    const [log, setLog] = useState<string[]>([]);

    const addLog = (msg: string) => setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const startETL = async () => {
        setStatus('syncing');
        setStep(1);
        setLog([]);
        addLog("Iniciando proceso ETL...");

        try {
            // PASO 1: CLIENTES
            addLog("📥 Extrayendo Clientes desde Google Sheets...");
            await api.syncClientes(); // Espera a que termine el backend
            addLog("✅ Clientes sincronizados en PostgreSQL.");

            // PASO 2: TRABAJOS (INGRESOS)
            setStep(2);
            addLog("📥 Extrayendo Órdenes de Trabajo...");
            await api.syncIngresos();
            addLog("✅ Órdenes sincronizadas correctamente.");

            // FIN
            setStep(3);
            setStatus('completed');
            addLog("🎉 Proceso ETL completado con éxito.");

        } catch (error) {
            console.error(error);
            setStatus('error');
            addLog("❌ Error durante la sincronización. Revisa la consola o el backend.");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Configuración del Sistema</h1>
                    <p className="text-slate-500">Gestión de datos y sincronización ETL</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* TARJETA DE CONTROL ETL */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <RefreshCw className={status === 'syncing' ? 'animate-spin text-blue-600' : ''} size={20} />
                        Sincronización de Datos
                    </h2>

                    <p className="text-slate-600 mb-8 text-sm leading-relaxed">
                        Este proceso descarga los datos más recientes desde <b>Google Sheets</b> (Nube),
                        normaliza la información y actualiza la base de datos <b>PostgreSQL</b> local.
                    </p>

                    {/* Diagrama Animado */}
                    <div className="flex items-center justify-between px-4 mb-10 relative">
                        {/* Línea de conexión de fondo */}
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-slate-100 -z-0"></div>
                        <div
                            className={`absolute top-1/2 left-0 h-1 bg-blue-500 transition-all duration-1000 -z-0`}
                            style={{ width: step === 0 ? '0%' : step === 1 ? '50%' : '100%' }}
                        />

                        {/* Paso 1: Nube */}
                        <div className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-500 ${step >= 1 ? 'scale-110' : 'opacity-50'}`}>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${step >= 1 ? 'bg-white border-blue-500 text-blue-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                <Cloud size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">Google Sheets</span>
                        </div>

                        {/* Flecha Animada */}
                        <div className="z-10 bg-white p-1 rounded-full">
                            <ArrowRight size={20} className={status === 'syncing' ? 'text-blue-500 animate-pulse' : 'text-slate-300'} />
                        </div>

                        {/* Paso 2: Base de Datos */}
                        <div className={`relative z-10 flex flex-col items-center gap-2 transition-all duration-500 ${step >= 2 ? 'scale-110' : 'opacity-50'}`}>
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center border-4 ${step >= 2 ? 'bg-white border-emerald-500 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>
                                <Database size={24} />
                            </div>
                            <span className="text-xs font-bold text-slate-600">PostgreSQL</span>
                        </div>
                    </div>

                    {/* Botón de Acción */}
                    <div className="flex justify-center">
                        {status === 'idle' || status === 'completed' || status === 'error' ? (
                            <button
                                onClick={startETL}
                                className="flex items-center gap-2 px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 transition-all active:scale-95"
                            >
                                <Play size={20} fill="currentColor" />
                                Iniciar Sincronización Manual
                            </button>
                        ) : (
                            <div className="flex items-center gap-3 text-blue-600 font-bold bg-blue-50 px-6 py-3 rounded-xl">
                                <RefreshCw className="animate-spin" size={20} />
                                Procesando datos...
                            </div>
                        )}
                    </div>
                </div>

                {/* CONSOLA DE LOGS */}
                <div className="bg-slate-900 p-6 rounded-2xl shadow-inner font-mono text-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-700 pb-2">
                        <span className="text-slate-400 flex items-center gap-2">
                            <Server size={16} /> System Logs
                        </span>
                        {status === 'completed' && <span className="text-emerald-400 flex items-center gap-1"><CheckCircle size={14}/> Listo</span>}
                        {status === 'error' && <span className="text-red-400 flex items-center gap-1"><AlertTriangle size={14}/> Fallo</span>}
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 max-h-[300px] text-slate-300">
                        {log.length === 0 && <p className="text-slate-600 italic">Esperando inicio del proceso...</p>}
                        {log.map((line, idx) => (
                            <p key={idx} className="border-l-2 border-blue-500 pl-2 animate-pulse-once">
                                {line}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}