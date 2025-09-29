import React, { useState, useEffect } from 'react';
import './App.css';

// Importando o Supabase
import { supabase } from './supabaseClient'; 

// Importa as páginas
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
import BannedPage from './components/BannedPage/BannedPage';
import MensagensPage from './components/MensagensPage/MensagensPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  // Unificamos pageProps e pageParams para simplificar
  const [pageParams, setPageParams] = useState(null); 
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);

  useEffect(() => {
    // Função para buscar dados da sessão e do perfil de uma só vez
    const updateUserSession = async (session) => {
      const currentUser = session?.user;
      setUser(currentUser ?? null);

      if (currentUser) {
        // Buscamos TODOS os dados da tabela profiles para ter as infos mais recentes
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*') 
          .eq('id', currentUser.id)
          .single();
        
        if (error) {
          console.error("Erro ao buscar perfil do usuário:", error);
          setUserData(currentUser.user_metadata); // Usa o metadata como fallback
        } else {
          // Juntamos os metadados com os dados do perfil, dando prioridade ao perfil
          const finalUserData = { ...currentUser.user_metadata, ...profileData };
          setUserData(finalUserData);
        }
      } else {
        setUserData(null);
      }
      setSessionChecked(true);
    };

    // Busca a sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      updateUserSession(session);
    });

    // Ouve por mudanças na autenticação (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      updateUserSession(session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // useEffect de segurança para usuários banidos
  useEffect(() => {
    if (userData && userData.cargo === 'banidos') {
      if (currentPage !== 'bannedPage' && currentPage !== 'faleConosco') {
        navigateTo('bannedPage');
      }
    }
  }, [userData, currentPage]); // Depende de userData e currentPage

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

  // Efeito de partículas
  useEffect(() => {
    let moveCounter = 0;
    const handleMouseMove = (e) => {
      const particle = document.createElement('div');
      particle.className = 'trail-particle';
      particle.style.left = `${e.clientX}px`;
      particle.style.top = `${e.clientY}px`;
      document.body.appendChild(particle);
      setTimeout(() => particle.remove(), 1000);

      moveCounter++;
      if (moveCounter % 4 === 0) {
        const star = document.createElement('div');
        star.className = 'star-particle';
        const offsetX = (Math.random() - 0.5) * 30;
        const offsetY = (Math.random() - 0.5) * 30;
        star.style.left = `${e.clientX + offsetX}px`;
        star.style.top = `${e.clientY + offsetY}px`;
        document.body.appendChild(star);
        setTimeout(() => star.remove(), 800);
      }
    };
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Lógica do Botão Voltar ao Topo
  useEffect(() => {
    const backToTopBtn = document.getElementById("backToTopBtn");
    const scrollFunction = () => {
      if (backToTopBtn && (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200)) {
        backToTopBtn.classList.add("show");
      } else if (backToTopBtn) {
        backToTopBtn.classList.remove("show");
      }
    };
    const backToTop = () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('scroll', scrollFunction);
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', backToTop);
    }
    return () => {
      window.removeEventListener('scroll', scrollFunction);
      if (backToTopBtn) {
        backToTopBtn.removeEventListener('click', backToTop);
      }
    };
  }, []);

  // Lógica de permissão
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
        {currentPage === 'bannedPage' && <BannedPage />}
        {currentPage === 'home' && <HomePage user={user} navigateTo={navigateTo} />}
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

        {currentPage === 'mensagens' && <MensagensPage user={user} />}
        {currentPage === 'myProfile' && (
          <UserProfilePage
            user={user}
            viewUserId={user?.id}
          />
        )}
        {/* Rota 'cidadaosDoReino' agora usa pageParams, eliminando o pageProps antigo */}
        {currentPage === "cidadaosDoReino" && (
          <CidadaosdoReino navigateTo={navigateTo} user={user} {...pageParams} />
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