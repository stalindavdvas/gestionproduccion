import { useState } from 'react';
import Layout from './components/Layout';
import DashboardHome from './pages/DashboardHome';
import ChatBot from './pages/ChatBot';
import Reports from './pages/Reports';
import ConfigPage from './pages/ConfigPage';
import Clients from "./pages/Clients.tsx"; // Importar nueva pagina

function App() {
  const [currentTab, setCurrentTab] = useState('dashboard');

  return (
    <Layout activeTab={currentTab} onTabChange={setCurrentTab}>
      {currentTab === 'dashboard' && <DashboardHome />}
      {currentTab === 'chat' && <ChatBot />}
      {currentTab === 'clientes' && <Clients />}
      {currentTab === 'reports' && <Reports />}
      {currentTab === 'config' && <ConfigPage />}
    </Layout>
  );
}

export default App;