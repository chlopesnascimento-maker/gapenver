import React, { useState, useEffect, Suspense } from 'react';
import './App.css';
import ReactGA from "react-ga4";

// Importando o Supabase
import { supabase } from './supabaseClient'; 

import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import LoadingOverlay from './components/Shared/LoadingOverlay/LoadingOverlay';
import { ModalProvider } from './contexts/ModalContext';

// Importa as páginas
const AdminDashboard = React.lazy(() => import('./components/AdminDashboard/AdminDashboard'));
const UserManagementPage = React.lazy(() => import ('./components/UserManagementPage/UserManagementPage'));

const HomePage = React.lazy(() => import ('./components/HomePage/HomePage'));
const LoginPage = React.lazy(() => import ('./components/LoginPage/LoginPage'));
const RegisterPage = React.lazy(() => import ('./components/RegisterPage/RegisterPage'));
const ForgotPasswordPage = React.lazy(() => import ('./components/ForgotPasswordPage/ForgotPasswordPage'));
const WelcomePage = React.lazy(() => import('./components/WelcomePage/WelcomePage'));
const EditProfilePage = React.lazy(() => import('./components/EditProfilePage/EditProfilePage'));
const MyAccountPage = React.lazy(() => import('./components/MyAccountPage/MyAccountPage'));
const UserProfilePage = React.lazy(() => import('./components/UserProfilePage/UserProfilePage'));
const StaffPage = React.lazy(() => import('./components/StaffPage/StaffPage'));
const CidadaosdoReino = React.lazy(() => import('./components/CidadaosdoReino/CidadaosdoReino'));
const GapenverPage = React.lazy(() => import('./components/CityPages/GapenverPage'));
const FaleConoscoPage = React.lazy(() => import('./components/FaleConoscoPage/FaleConoscoPage'));
const ComunidadePage = React.lazy(() => import('./components/ComunidadePage/ComunidadePage'));
const CriarTopicoPage = React.lazy(() => import('./components/CriarTopicoPage/CriarTopicoPage'));
const TopicoDetalhePage = React.lazy(() => import('./components/TopicoDetalhePage/TopicoDetalhePage'));
const BannedPage = React.lazy(() => import('./components/BannedPage/BannedPage'));
const MensagensPage = React.lazy(() => import('./components/MensagensPage/MensagensPage'));
const OnboardingModal = React.lazy(() => import('./components/OnboardingModal/OnboardingModal'));
const EscolhaReinoModal = React.lazy(() => import('./components/EscolhaReinoModal/EscolhaReinoModal'));


//INICIALIZAÇÃO DO GOOGLE ANALYTICS
const MEASUREMENT_ID = "G-N6Q8RTN5PL"; 
ReactGA.initialize(MEASUREMENT_ID);

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  // Unificamos pageProps e pageParams para simplificar
  const [pageParams, setPageParams] = useState(null); 
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [showEscolhaReinoModal, setShowEscolhaReinoModal] = useState(false);

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
          if (finalUserData && (finalUserData.onboarding_completed === false || finalUserData.onboarding_completed === null)) {
            const jaPulouNestaSessao = sessionStorage.getItem('onboardingMinimized');
            if (!jaPulouNestaSessao) {
              setShowOnboardingModal(true);
            }
          }
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

  useEffect(() => {
  // Só registra a visita se o site NÃO estiver rodando em localhost
  if (window.location.hostname !== 'localhost') {
    // Faz a inserção diretamente na tabela, sem chamar a Edge Function
    supabase
      .from('visitas')
      .insert({})
      .then(({ error }) => {
        if (error) {
          console.error('Erro ao registrar visita:', error);
        }
      });
  }
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
    sessionStorage.removeItem('onboardingPulado');
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
  let lastTime = 0;
  let moveCounter = 0;

  const handleMouseMove = (e) => {
    const now = performance.now();
    // cria partículas no máximo a cada 45ms (~22 FPS) — suficiente visualmente e bem leve
    if (now - lastTime < 45) return;
    lastTime = now;

    // cria trail
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

   useEffect(() => {
    // Handler para bloquear o menu de contexto
    const handleContextMenu = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // Handler para bloquear o arrastar da imagem
    const handleDragStart = (e) => {
      if (e.target.tagName === 'IMG') {
        e.preventDefault();
      }
    };

    // Adiciona os event listeners ao documento
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('dragstart', handleDragStart);

    // Função de limpeza: remove os listeners quando o componente for desmontado
    // Isso é crucial para a performance e para evitar bugs em React
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('dragstart', handleDragStart);
    };
  }, []);

  // Lógica de permissão
  const userRole = userData?.cargo; // Lendo do 'userData' para maior consistência
    // O 'autor' agora tem acesso a tudo que os outros staff têm
  const canAccessPanel = ['admin', 'oficialreal', 'guardareal', 'autor'].includes(userRole);
  const canManageUsers = ['admin', 'oficialreal', 'guardareal', 'autor'].includes(userRole);
  // O 'autor' também é considerado um administrador de nível mais alto
  const isAdmin = ['admin', 'autor'].includes(userRole);

  return (
     <ModalProvider>
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
          <Suspense fallback={<LoadingOverlay show={true} />}>
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
            {currentPage === 'mensagens' && <MensagensPage user={user} navigateTo={navigateTo} />}
            {currentPage === 'myProfile' && (
             <UserProfilePage
               user={user}
                viewUserId={user?.id}
              />
        )}
                {/* Rota 'cidadaosDoReino' */}
            {currentPage === "cidadaosDoReino" && (
              <CidadaosdoReino navigateTo={navigateTo} user={user} {...pageParams} />
        )}
          </Suspense>   
              </main>



        <Footer />

        <Suspense fallback={<></>}>
          {showOnboardingModal && (
            <OnboardingModal 
              user={user} 
              onClose={() => setShowOnboardingModal(false)}
              onOpenEscolhaReino={() => {
                setShowOnboardingModal(false);
                setShowEscolhaReinoModal(true);
              }}
            />
          )}

          <EscolhaReinoModal
            isOpen={showEscolhaReinoModal}
            onClose={() => setShowEscolhaReinoModal(false)}
            onReinoEscolhido={(reinoId) => {
              console.log(`TODO: Salvar o reino ${reinoId} para o usuário.`);
            }}
            user={user}
          />
        </Suspense>

        <button id="backToTopBtn" title="Voltar ao topo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px">
            <path d="M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14z"/>
          </svg>
        </button>
      </div>
    </ModalProvider>
  );
}

export default App;