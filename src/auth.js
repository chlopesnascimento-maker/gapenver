// auth.js
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from 'supabaseClient';

const AuthContext = createContext({ user: null, session: null, loading: true, logout: () => {} });

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Sessão inicial
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Sessão inicial:', session, 'Erro:', error);
      if (!mounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Eventos de login/logout
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Evento de auth:", _event, session);
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => {
      mounted = false;
      subscription?.subscription?.unsubscribe?.();
    };
  }, []);

  // 👉 função logout
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("Erro ao deslogar:", error.message);
    else console.log("Usuário deslogado com sucesso");
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
