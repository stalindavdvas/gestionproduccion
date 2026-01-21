import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Layout from './components/Layout';
import Dashboard from './pages/DashboardHome';
import ClientsList from './pages/Clients';
import ChatBot from './pages/ChatBot';
import Config from './pages/ConfigPage'; // Tu página ETL
import Analytics from './pages/Analytics';
import OrdersTable from './pages/OrdersTable';
import FieldTable from './pages/FieldTable';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppContent() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) return <Login />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />; // Asegúrate de que Dashboard use api.getAnalytics para los datos
      case 'analytics': return <Analytics />;
      case 'chat': return <ChatBot />;
      // SOLO ADMIN
      case 'clients': return user.role === 'admin' ? <ClientsList /> : <Navigate to="/" />;
      case 'orders': return user.role === 'admin' ? <OrdersTable /> : <Navigate to="/" />;
      case 'field': return user.role === 'admin' ? <div className="p-10">Tabla Campo (Crear FieldTable.tsx)</div> : <Navigate to="/" />;
      case 'etl': return user.role === 'admin' ? <Config /> : <Navigate to="/" />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} onTabChange={setActiveTab}>
      {renderContent()}
    </Layout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}