import React, { useState, useEffect, useRef } from 'react';
import './Header.css';

// importa ícones
import { FaTiktok, FaYoutube, FaInstagram, FaFacebook } from "react-icons/fa";

// O Header recebe 'user', 'userData' e 'handleLogout' do pai
function Header({ navigateTo, user, userData, handleLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuRef]);

  const handleMenuClick = (page) => {
    navigateTo(page);
    setIsMenuOpen(false);
  };

  const defaultAvatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e0e0e0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
  const defaultAvatarDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(defaultAvatarSvg)}`;
  const avatarSrc = userData?.photoURL || defaultAvatarDataUrl;

  return (
    <header className="app-header">
      <div className="header-left">
        <a href="https://www.tiktok.com/@seuPerfil" target="_blank" rel="noopener noreferrer">
          <FaTiktok className="social-icon" />
        </a>
        <a href="https://www.youtube.com/@seuCanal" target="_blank" rel="noopener noreferrer">
          <FaYoutube className="social-icon" />
        </a>
        <a href="https://www.instagram.com/seuPerfil" target="_blank" rel="noopener noreferrer">
          <FaInstagram className="social-icon" />
        </a>
        <a href="https://www.facebook.com/seuPerfil" target="_blank" rel="noopener noreferrer">
          <FaFacebook className="social-icon" />
        </a>
      </div>

      <div className="header-center">
        <a href="#" onClick={() => navigateTo('home')}>
          <img
            src="https://i.imgur.com/ZUQJmco.png"
            alt="Logo do site"
            className="site-logo"
            draggable={false}
          />
        </a>
      </div>

      <div className="header-right">
        {user ? (
          <div className="avatar-container" ref={menuRef}>
            <div className="avatar-circle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              <img
                id="top-right-avatar"
                src={avatarSrc}
                alt="Avatar"
                className="header-avatar-img"
                draggable={false}
              />
            </div>

            {isMenuOpen && (
              <div className="dropdown-menu">
                {userData && (
                  <div className="user-info">
                    <span className="user-name">{userData.nome} {userData.sobrenome}</span>
                  </div>
                )}
                <a href="#" onClick={() => handleMenuClick('editProfile')}>Editar Perfil</a>
                <a href="#" onClick={() => handleMenuClick('myAccount')}>Minha Conta</a>
                <a href="#" onClick={handleLogout}>Sair do Reino</a>
              </div>
            )}
          </div>
        ) : (
          <>
            <a href="#" onClick={() => alert('Página de Pesquisa em construção!')}>
              <svg className="search-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>
            </a>
            <a href="#" onClick={() => navigateTo('register')}>Cadastrar</a>
            <a href="#" onClick={() => navigateTo('login')}>Login</a>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
