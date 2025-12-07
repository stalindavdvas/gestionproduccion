import React, { useState } from 'react';
import { LayoutDashboard, MessageSquareText, FileText, Menu, Settings, LogOut } from 'lucide-react';

// Tipado para los props del item del menú
interface SidebarItemProps {
  icon: React.ElementType;
  text: string;
  active?: boolean;
  onClick?: () => void;
}

const SidebarItem = ({ icon: Icon, text, active, onClick }: SidebarItemProps) => (
  <button
    onClick={onClick}
    className={`flex items-center w-full gap-3 px-4 py-3 rounded-xl transition-all duration-200 group cursor-pointer
      ${active 
        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
        : 'text-slate-500 hover:bg-white hover:text-blue-600 hover:shadow-md'
      }`}
  >
    <Icon size={20} />
    <span className="font-medium">{text}</span>
  </button>
);

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">

      {/* Overlay para móviles */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar / Barra Lateral */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-30 w-64 bg-slate-50 border-r border-slate-200 
        transform transition-transform duration-300 ease-in-out p-5 flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo */}
        <div className="flex items-center gap-2 px-2 mb-10">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-blue-500/20 shadow-lg">
            <span className="text-white font-bold">T</span>
          </div>
          <span className="text-xl font-bold text-slate-800">TechTracker</span>
        </div>

        {/* Menú de Navegación */}
        <nav className="flex-1 space-y-2">
          <SidebarItem
            icon={LayoutDashboard}
            text="Dashboard"
            active={activeTab === 'dashboard'}
            onClick={() => setActiveTab('dashboard')}
          />
          <SidebarItem
            icon={MessageSquareText}
            text="Asistente IA"
            active={activeTab === 'chat'}
            onClick={() => setActiveTab('chat')}
          />
          <SidebarItem
            icon={FileText}
            text="Reportes"
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
          />
        </nav>

        {/* Footer del Sidebar */}
        <div className="pt-6 border-t border-slate-200 space-y-2">
          <SidebarItem icon={Settings} text="Configuración" />
          <SidebarItem icon={LogOut} text="Cerrar Sesión" />
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header solo visible en móvil */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 lg:hidden shrink-0">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500">
            <Menu size={24} />
          </button>
          <span className="font-bold text-slate-700">TechTracker</span>
          <div className="w-6" /> {/* Espaciador */}
        </header>

        {/* Área de scroll para el contenido */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}