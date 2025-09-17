import React, { useState, useEffect } from 'react';
import './App.css';

// Importando o Supabase
import { supabase } from './supabaseClient'; 

// Importa as páginas de Admin
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import UserManagementPage from './components/UserManagementPage/UserManagementPage';

import Header from './components/Header/Header';
import HomePage from './components/HomePage/HomePage';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage/ForgotPasswordPage';
import WelcomePage from './components/WelcomePage/WelcomePage';
import EditProfilePage from './components/EditProfilePage/EditProfilePage';
import MyAccountPage from './components/MyAccountPage/MyAccountPage';
import Footer from './components/Footer/Footer';
import LoadingOverlay from './components/Shared/LoadingOverlay/LoadingOverlay';
import UserProfilePage from './components/UserProfilePage/UserProfilePage'; 
import StaffPage from './components/StaffPage/StaffPage'; 
import CidadaosdoReino from "./components/CidadaosdoReino/CidadaosdoReino";
import GapenverPage from './components/CityPages/GapenverPage'; 
import FaleConoscoPage from './components/FaleConoscoPage/FaleConoscoPage';
import ComunidadePage from './components/ComunidadePage/ComunidadePage';
import CriarTopicoPage from './components/CriarTopicoPage/CriarTopicoPage';
import TopicoDetalhePage from './components/TopicoDetalhePage/TopicoDetalhePage';
// ==========================================================
// ADIÇÃO 1: Importando a BannedPage
// ==========================================================
import BannedPage from './components/BannedPage/BannedPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageProps, setPageProps] = useState({});
  const [pageParams, setPageParams] = useState(null);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    const getSessionData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      setUser(currentUser ?? null);

      if (currentUser) {
        // Buscamos os dados da tabela profiles para ter o cargo mais atualizado
        const { data: profileData } = await supabase
          .from('profiles')
          .select('cargo')
          .eq('id', currentUser.id)
          .single();
        
        // Juntamos os metadados com os dados do perfil
        const finalUserData = { ...currentUser.user_metadata, ...profileData };
        setUserData(finalUserData);
      }
      setSessionChecked(true);
    };
    getSessionData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user;
      setUser(currentUser ?? null);
      if (currentUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('cargo')
          .eq('id', currentUser.id)
          .single();
        const finalUserData = { ...currentUser.user_metadata, ...profileData };
        setUserData(finalUserData);
      } else {
        setUserData(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // ==========================================================
  // ADIÇÃO 2: useEffect de segurança para usuários banidos
  // ==========================================================
  useEffect(() => {
    // Se temos os dados do usuário e o cargo dele é 'banidos'
    if (userData && userData.cargo === 'banidos') {
      // E ele NÃO está tentando acessar a página de banido ou o fale conosco
      if (currentPage !== 'bannedPage' && currentPage !== 'faleConosco') {
        // Forçamos ele para a página de banido
        navigateTo('bannedPage');
      }
    }
  }, [userData, currentPage]); // Roda sempre que os dados do usuário ou a página atual mudarem


  const handleLogout = () => {
    supabase.auth.signOut().then(() => {
      navigateTo('home');
    }).catch((error) => {
      console.error("Erro ao fazer logout:", error);
    });
  };

  const navigateTo = (page, params = null) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
    setPageParams(params);
  };
  
  const handleProfileUpdate = (updates) => {
    setUserData(prevData => ({ ...prevData, ...updates }));
  };

  // ... (seus outros useEffects de partículas e botão de topo continuam aqui, sem alterações)
  useEffect(() => { /* ...efeito de partículas... */ }, []);
  useEffect(() => { /* ...botão voltar ao topo... */ }, []);


  const userRole = user?.app_metadata?.roles?.[0];
  const canAccessPanel = ['admin', 'oficialreal', 'guardareal'].includes(userRole);
  const canManageUsers = ['admin', 'oficialreal', 'guardareal'].includes(userRole);
  const isAdmin = userRole === 'admin';

  return (
    <div className="App">
      <div className="stars"></div>
      <LoadingOverlay show={loading} />
      <Header 
        navigateTo={navigateTo} 
        user={user} 
        userData={userData} 
        handleLogout={handleLogout}
        sessionChecked={sessionChecked} 
        isAdmin={isAdmin} 
      />

      <main>
        {/* ========================================================== */}
        {/* ADIÇÃO 3: A "rota" para a página de banido                 */}
        {/* ========================================================== */}
        {currentPage === 'bannedPage' && <BannedPage />}

        {currentPage === 'home' && <HomePage />}
        {currentPage === 'login' && <LoginPage navigateTo={navigateTo} setLoading={setLoading} />}
        {currentPage === 'register' && <RegisterPage navigateTo={navigateTo} setLoading={setLoading} />}
        {currentPage === 'forgotPassword' && <ForgotPasswordPage navigateTo={navigateTo} setLoading={setLoading} />}
        {currentPage === 'welcome' && <WelcomePage navigateTo={navigateTo} />}
        
        {currentPage === 'editProfile' && (
          <EditProfilePage 
            navigateTo={navigateTo}
            onProfileUpdate={handleProfileUpdate}
          />
        )}
        
        {currentPage === 'myAccount' && (
          <MyAccountPage navigateTo={navigateTo} user={user} userData={userData}/>
        )}

        {currentPage === 'criarTopico' && <CriarTopicoPage user={user} navigateTo={navigateTo} />}

        {currentPage === 'adminDashboard' && canAccessPanel && (
          <AdminDashboard user={user} navigateTo={navigateTo} />
        )}

        {currentPage === 'userManagement' && canManageUsers && (
          <UserManagementPage navigateTo={navigateTo} user={user} />
        )}

        {currentPage === 'comunidade' && <ComunidadePage user={user} navigateTo={navigateTo} />}

        {currentPage === 'gapenver' && <GapenverPage />}

        {currentPage === 'topicoDetalhe' && <TopicoDetalhePage user={user} pageState={pageParams} navigateTo={navigateTo} />}

        {currentPage === 'faleConosco' && <FaleConoscoPage />}

        {currentPage === 'staff' && <StaffPage navigateTo={navigateTo} />}

        {currentPage === 'userProfile' && pageParams?.userId && (
          <UserProfilePage
            user={user}
            viewUserId={pageParams.userId}
          />
        )}

        {currentPage === 'myProfile' && (
          <UserProfilePage
            user={user}
            viewUserId={user?.id}
          />
        )}

        {currentPage === "cidadaosDoReino" && (
          <CidadaosdoReino navigateTo={navigateTo} user={user} {...pageProps} />
        )}
      </main>

      <Footer />

      <button id="backToTopBtn" title="Voltar ao topo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px">
          <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
        </svg>
      </button>

    </div>
  );
}

export default App;