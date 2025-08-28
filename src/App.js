import React, { useState, useEffect } from 'react';
import './App.css';

import Header from './components/Header/Header';
import HomePage from './components/HomePage/HomePage';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import ForgotPasswordPage from './components/ForgotPasswordPage/ForgotPasswordPage';
import WelcomePage from './components/WelcomePage/WelcomePage';
import EditProfilePage from './components/EditProfilePage/EditProfilePage';
import MyAccountPage from './components/MyAccountPage/MyAccountPage';
import Footer from './components/Footer/Footer';

// 🔥 importa o loading global
import LoadingOverlay from './components/Shared/LoadingOverlay/LoadingOverlay';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [loading, setLoading] = useState(false);

  // Estado fictício de usuário (já que removemos Firebase)
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);

  // Função fake de logout
  const handleLogout = () => {
    setUser(null);
    setUserData(null);
    navigateTo('home');
  };

  const navigateTo = (page) => {
    window.scrollTo(0, 0);
    setCurrentPage(page);
  };

  // Partículas do mouse (efeito visual)
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
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="App">
      <div className="stars"></div>

      {/* Overlay global de loading */}
      <LoadingOverlay show={loading} />

      {/* Header sem Firebase */}
      <Header navigateTo={navigateTo} user={user} userData={userData} handleLogout={handleLogout} />

      <main>
        {currentPage === 'home' && <HomePage />}
        {currentPage === 'login' && <LoginPage navigateTo={navigateTo} setLoading={setLoading} />}
        {currentPage === 'register' && <RegisterPage navigateTo={navigateTo} setLoading={setLoading} />}
        {currentPage === 'forgotPassword' && <ForgotPasswordPage navigateTo={navigateTo} setLoading={setLoading} />}
        {currentPage === 'welcome' && <WelcomePage navigateTo={navigateTo} />}
        {currentPage === 'editProfile' && <EditProfilePage user={user} userData={userData} setLoading={setLoading} />}
        {currentPage === 'myAccount' && (
          <MyAccountPage
            navigateTo={navigateTo}
            user={user}
            userData={userData}
            setLoading={setLoading}
          />
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
