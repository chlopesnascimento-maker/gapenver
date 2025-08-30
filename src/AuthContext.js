import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from 'supabaseClient';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Função para carregar usuário do Supabase
  const fetchUserData = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Erro ao buscar usuário:', error.message);
    } else if (user) {
      setUser(user);
      setUserData({
        nome: user.user_metadata?.nome || '',
        sobrenome: user.user_metadata?.sobrenome || '',
        photoURL: user.user_metadata?.photoURL || null,
      });
    } else {
      setUser(null);
      setUserData(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUserData();

    // Atualiza user em tempo real
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setUserData({
          nome: session.user.user_metadata?.nome || '',
          sobrenome: session.user.user_metadata?.sobrenome || '',
          photoURL: session.user.user_metadata?.photoURL || null,
        });
      } else {
        setUser(null);
        setUserData(null);
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) alert('Erro ao deslogar: ' + error.message);
    setUser(null);
    setUserData(null);
  };

  return (
    <AuthContext.Provider value={{ user, userData, setUser, setUserData, logout, loading, setLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook para usar o AuthContext
export function useAuth() {
  return useContext(AuthContext);
}
