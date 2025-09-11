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
import UserProfilePage from './components/UserProfilePage/UserProfilePage'; // ✅ garante que está importado
import StaffPage from './components/StaffPage/StaffPage'; // ✅ garante que está importado
import CidadaosdoReino from "./components/CidadaosdoReino/CidadaosdoReino";
import GapenverPage from './components/CityPages/GapenverPage'; // 1. IMPORTE ADICIONADO
import FaleConoscoPage from './components/FaleConoscoPage/FaleConoscoPage';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [pageProps, setPageProps] = useState({});
  const [pageParams, setPageParams] = useState(null); // ✅ novo estado para parâmetros
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
        setUserData(currentUser.user_metadata);
      }
      setSessionChecked(true);
    };
    getSessionData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user;
      setUser(currentUser ?? null);
      setUserData(currentUser ? currentUser.user_metadata : null);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = () => {
    supabase.auth.signOut().then(() => {
      navigateTo('home');
    }).catch((error) => {
      console.error("Erro ao fazer logout:", error);
    });
  };

  // ✅ agora aceita params (ex: { userId })
  const navigateTo = (page, params = null) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
    setPageParams(params);
  };
  
  const handleProfileUpdate = (updates) => {
    setUserData(prevData => ({ ...prevData, ...updates }));
  };

  // Efeito de partículas (MANTIDO 100% INTACTO)
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

    // --- LÓGICA DO BOTÃO VOLTAR AO TOPO (adaptado para React) ---
  useEffect(() => {
    // 1. Pega o botão do DOM
    const backToTopBtn = document.getElementById("backToTopBtn");

    // 2. Cria a função que verifica a rolagem
    const scrollFunction = () => {
      if (backToTopBtn && (document.body.scrollTop > 200 || document.documentElement.scrollTop > 200)) {
        backToTopBtn.classList.add("show");
      } else if (backToTopBtn) {
        backToTopBtn.classList.remove("show");
      }
    };

    // 3. Cria a função que rola para o topo
    const backToTop = () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    };

    // 4. Adiciona os "ouvintes" de evento
    window.addEventListener('scroll', scrollFunction);
    if (backToTopBtn) {
      backToTopBtn.addEventListener('click', backToTop);
    }

    // 5. Função de LIMPEZA: remove os "ouvintes" quando o componente "morre"
    return () => {
      window.removeEventListener('scroll', scrollFunction);
      if (backToTopBtn) {
        backToTopBtn.removeEventListener('click', backToTop);
      }
    };
  }, []); // O array vazio [] garante que este código rode apenas uma vez.

  // --- MUDANÇA 1: LÓGICA DE PERMISSÃO ATUALIZADA ---
  const userRole = user?.app_metadata?.roles?.[0];
  const canAccessPanel = ['admin', 'oficialreal', 'guardareal'].includes(userRole);
  const canManageUsers = ['admin', 'oficialreal', 'guardareal'].includes(userRole);
  const isAdmin = userRole === 'admin';
  // --- FIM DA MUDANÇA 1 ---

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

        {/* --- MUDANÇA 2: ROTAS ATUALIZADAS --- */}
        {currentPage === 'adminDashboard' && canAccessPanel && (
          <AdminDashboard user={user} navigateTo={navigateTo} />
        )}

        {currentPage === 'userManagement' && canManageUsers && (
          <UserManagementPage navigateTo={navigateTo} user={user} />
        )}

        {currentPage === 'gapenver' && <GapenverPage />}

        {/* Fale Conosco */}
        {currentPage === 'faleConosco' && <FaleConoscoPage />}

        {/* ✅ rota para Staff */}
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

{/* BOTÃO SUBIR AO TOPO */}
       <button id="backToTopBtn" title="Voltar ao topo">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px">
          <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
        </svg>
      </button>

    </div>
  );
}

export default App;
