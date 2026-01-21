import { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

interface AuthContextType {
  user: { username: string; role: 'admin' | 'mantenimiento' } | null;
  login: (token: string, role: string, username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null);

  useEffect(() => {
    // Recuperar sesión al recargar
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role') as any;
    const username = localStorage.getItem('username');
    if (token && role && username) {
      setUser({ username, role });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }, []);

  const login = (token: string, role: string, username: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('role', role);
    localStorage.setItem('username', username);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser({ username, role: role as any });
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);