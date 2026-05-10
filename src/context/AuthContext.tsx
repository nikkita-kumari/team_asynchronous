import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: any;
  token: string | null;
  login: (data: any, resolveRole: 'admin' | 'user') => Promise<void>;
  registerAdmin: (data: any) => Promise<void>;
  registerUser: (data: any) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchMe = async () => {
    try {
      const { data } = await axios.get('/api/auth/me');
      setUser(data.user);
    } catch (error: any) {
      if (error.response?.status === 403 && error.response?.data?.isBlocked) {
         toast.error(error.response.data.message);
         // Don't auto logout entirely so they can see the blocked page ideally,
         // but keeping logic simple for state:
         setUser({ isBlocked: true });
      } else {
         logout();
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: any, resolveRole: 'admin' | 'user') => {
    const { data } = await axios.post(`/api/auth/${resolveRole}/login`, credentials);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    toast.success('Logged in successfully');
  };

  const registerAdmin = async (data: any) => {
    await axios.post('/api/auth/admin/register', data);
    toast.success('Admin registered successfully. Please login.');
  };

  const registerUser = async (data: any) => {
    await axios.post('/api/auth/user/register', data);
    toast.success('User registered successfully. Please login.');
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  return (
    <AuthContext.Provider value={{ user, token, login, registerAdmin, registerUser, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
