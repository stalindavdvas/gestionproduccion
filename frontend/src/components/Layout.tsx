import React from 'react';
import { Home, Users, BarChart2, MessageSquare, Database, LogOut, FileText, Map } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Layout({ children, activeTab, onTabChange }: LayoutProps) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TechTracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">Rol: {isAdmin ? 'Administrador' : 'Jefe Mantenimiento'}</p>
        </div>

        <nav className="flex-1 px-3 space-y-1">
          <SidebarItem icon={Home} text="Dashboard" active={activeTab === 'dashboard'} onClick={() => onTabChange('dashboard')} />
          <SidebarItem icon={BarChart2} text="Analítica" active={activeTab === 'analytics'} onClick={() => onTabChange('analytics')} />
          <SidebarItem icon={MessageSquare} text="Asistente IA" active={activeTab === 'chat'} onClick={() => onTabChange('chat')} />

          {/* SECCIONES SOLO ADMIN */}
          {isAdmin && (
            <>
              <div className="pt-4 pb-2 px-3 text-xs font-bold text-slate-400 uppercase">Administración</div>
              <SidebarItem icon={Users} text="Clientes" active={activeTab === 'clients'} onClick={() => onTabChange('clients')} />
              <SidebarItem icon={FileText} text="Órdenes Taller" active={activeTab === 'orders'} onClick={() => onTabChange('orders')} />
              <SidebarItem icon={Map} text="Visitas Campo" active={activeTab === 'field'} onClick={() => onTabChange('field')} />
              <SidebarItem icon={Database} text="Configuración ETL" active={activeTab === 'etl'} onClick={() => onTabChange('etl')} />
            </>
          )}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button onClick={logout} className="flex items-center gap-3 px-3 py-2 w-full text-slate-600 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors text-sm font-medium">
            <LogOut size={20} />
            Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}

function SidebarItem({ icon: Icon, text, active, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        active ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
      }`}
    >
      <Icon size={20} />
      {text}
    </button>
  );
}