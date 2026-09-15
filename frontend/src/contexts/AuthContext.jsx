import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try { return JSON.parse(localStorage.getItem('user') || 'null'); } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(readStoredUser);
  const [loading, setLoading] = useState(false);

  const persist = (u) => {
    if (u) localStorage.setItem('user', JSON.stringify(u));
    else localStorage.removeItem('user');
    setUser(u);
  };

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    persist(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    persist(null);
  };

  const updateUser = (data) => {
    persist({ ...(user || {}), ...data });
  };

  // Server bilan sinxronlash: yo'nalish/guruh admin tomonidan o'zgartirilgan bo'lsa, yangilanadi
  const refreshUser = useCallback(async () => {
    if (!localStorage.getItem('token')) return null;
    try {
      const res = await api.get('/auth/me');
      if (res.data?.id) {
        const merged = { ...(readStoredUser() || {}), ...res.data };
        persist(merged);
        return merged;
      }
    } catch { /* 401 bo'lsa interceptor logout qiladi */ }
    return null;
  }, []);

  useEffect(() => {
    if (user) refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setLoading, login, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
