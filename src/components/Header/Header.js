// CÓDIGO COMPLETO E FINAL PARA O ARQUIVO Header.js - SEM OMISSÕES

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import './Header.css';
import { FaTiktok, FaYoutube, FaInstagram, FaFacebook } from "react-icons/fa";
import NotificationDropdown from '../NotificationDropdown/NotificationDropdown';

function Header({ navigateTo, user, userData, handleLogout, sessionChecked }) {
  // --- Estados do Componente ---
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isKingdomMenuMounted, setIsKingdomMenuMounted] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isChatActive, setIsChatActive] = useState(false);

  // --- Estados do Sistema de Notificações ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // --- Refs ---
  const userMenuRef = useRef(null);
  const kingdomMenuRef = useRef(null);
  const mobileOverlayRef = useRef(null);
  const sidebarRef = useRef(null);
  const hamburgerRef = useRef(null);
  const notificationRef = useRef(null);

  // --- Hooks de Efeito ---

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail;
      const active = typeof detail === 'object' ? !!detail.active : !!detail;
      setIsChatActive(active);
    };
    window.addEventListener('chatActive', handler);
    return () => window.removeEventListener('chatActive', handler);
  }, []);

  const closeMenu = useCallback(() => {
    if (!isKingdomMenuMounted) return;
    const overlay = mobileOverlayRef.current;
    const sidebar = sidebarRef.current;
    if (overlay) overlay.style.opacity = '0';
    if (sidebar) sidebar.style.transform = 'translateX(-110%)';
    const onEnd = (e) => {
      if (e.target !== sidebar) return;
      sidebar.removeEventListener('transitionend', onEnd);
      setIsKingdomMenuMounted(false);
      if (overlay) {
        overlay.style.visibility = 'hidden';
        overlay.style.pointerEvents = 'none';
      }
    };
    if (sidebar) {
      sidebar.addEventListener('transitionend', onEnd);
      setTimeout(() => {
        if (isKingdomMenuMounted) {
          sidebar.removeEventListener('transitionend', onEnd);
          setIsKingdomMenuMounted(false);
          if (overlay) {
            overlay.style.visibility = 'hidden';
            overlay.style.pointerEvents = 'none';
          }
        }
      }, 800);
    } else {
      setIsKingdomMenuMounted(false);
      if (overlay) {
        overlay.style.visibility = 'hidden';
        overlay.style.pointerEvents = 'none';
      }
    }
  }, [isKingdomMenuMounted]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      if (isKingdomMenuMounted) {
        const clickedInsideOverlay = mobileOverlayRef.current?.contains(event.target);
        const clickedOnHamburger = hamburgerRef.current?.contains(event.target);
        if (!clickedInsideOverlay && !clickedOnHamburger) {
          closeMenu();
        }
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isKingdomMenuMounted, closeMenu]);

  useEffect(() => {
    if (!user) {
      setUnreadMessages(0);
      return;
    }
    let mounted = true;
    let refreshTimeout = null;
    const fetchUnread = async () => {
      try {
        const { data: participacoes, error: partError } = await supabase
          .from('participantes_da_conversa')
          .select('conversa_id, last_read_at')
          .eq('user_id', user.id);
        if (partError || !participacoes || participacoes.length === 0) {
          if (mounted) setUnreadMessages(0);
          return;
        }
        const conversaIds = participacoes.map(p => p.conversa_id);
        const { data: mensagens, error: msgsError } = await supabase
          .from('mensagens')
          .select('id, conversa_id, created_at, remetente_id')
          .in('conversa_id', conversaIds)
          .neq('remetente_id', user.id);
        if (msgsError) {
          if (mounted) setUnreadMessages(0);
          return;
        }
        const lastReadMap = {};
        participacoes.forEach(p => {
          lastReadMap[p.conversa_id] = p.last_read_at ? new Date(p.last_read_at) : new Date(0);
        });
        let total = 0;
        for (const m of (mensagens || [])) {
          if (new Date(m.created_at) > (lastReadMap[m.conversa_id] || new Date(0))) total += 1;
        }
        if (mounted) setUnreadMessages(total);
      } catch (e) {
        if (mounted) setUnreadMessages(0);
      }
    };
    fetchUnread();
    const handleConversaLida = () => {
      clearTimeout(refreshTimeout);
      refreshTimeout = setTimeout(fetchUnread, 50);
    };
    window.addEventListener('conversaLida', handleConversaLida);
    const channel = supabase
      .channel('mensagens_notificacoes_realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens' }, () => {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(fetchUnread, 150);
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'participantes_da_conversa', filter: `user_id=eq.${user.id}` }, () => {
        clearTimeout(refreshTimeout);
        refreshTimeout = setTimeout(fetchUnread, 50);
      })
      .subscribe();
    return () => {
      mounted = false;
      clearTimeout(refreshTimeout);
      window.removeEventListener('conversaLida', handleConversaLida);
      try { supabase.removeChannel(channel); } catch (e) {}
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const fetchInitialNotifications = async () => {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) { console.error("Erro ao buscar notificações:", error); return; }
      
      setNotifications(data || []);
      const unread = data ? data.filter(n => !n.is_read).length : 0;
      setUnreadCount(unread);
    };

    fetchInitialNotifications();

    const channel = supabase
      .channel(`notifications_final:${user.id}`)
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public', 
          table: 'notificacoes',
          filter: `user_id=eq.${user.id}`
        }, 
        () => {
          fetchInitialNotifications();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const handleMenuClick = (page, params = null) => {
    navigateTo(page, params);
    setIsUserMenuOpen(false);
    if (isKingdomMenuMounted) closeMenu();
  };

  const handleBellClick = () => {
    setIsNotificationOpen(prev => !prev);
  };

  const handleNotificationClick = (notification) => {
    setIsNotificationOpen(false);
    if (notification.link_to) {
      const parts = notification.link_to.split('/');
      if (parts[0] === 'topico' && parts[1]) {
        navigateTo('topicoDetalhe', { topicId: parts[1] });
      } else {
        navigateTo('home');
      }
    }

    if (!notification.is_read) {
      setUnreadCount(current => Math.max(0, current - 1));
      setNotifications(current =>
        current.map(n => n.id === notification.id ? { ...n, is_read: true } : n)
      );
      
      supabase.functions.invoke('mark-notification-read', {
        body: { notification_id: notification.id },
      }).catch(err => console.error("Falha ao marcar como lida:", err));
    }
  };

  const defaultAvatarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%23e0e0e0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`;
  const defaultAvatarDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(defaultAvatarSvg)}`;
  const avatarSrc = userData?.foto_url || defaultAvatarDataUrl;
  const userRole = user?.app_metadata?.roles?.[0]?.toLowerCase();

  const NavLinks = () => (
    userRole === 'banidos' ? (
      <li><a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('faleConosco'); }}>Fale Conosco</a></li>
    ) : (
      <>
        <li><a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('gapenver'); }}>Gapenver</a></li>
        <li><a href="#" onClick={() => alert('Página em breve!')}>Saraver</a></li>
        <li><a href="#" onClick={() => alert('Página em breve!')}>Corvusk</a></li>
        <li><a href="#" onClick={() => alert('Página em breve!')}>Lo'otrak</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('cidadaosDoReino'); }}>Cidadãos do Reino</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('comunidade'); }}>Fórum</a></li>
        <li><a href="#" onClick={() => alert('Página em breve!')}>Sugestões</a></li>
        <li><a href="#" onClick={() => alert('Página em breve!')}>Mapa Mundo</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('faleConosco'); }}>Fale Conosco</a></li>
        <li><a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('staff'); }}>STAFF</a></li>
      </>
    )
  );

  const openMenu = () => {
    if (isKingdomMenuMounted) return;
    setIsKingdomMenuMounted(true);
    requestAnimationFrame(() => {
      setTimeout(() => {
        const overlay = mobileOverlayRef.current;
        const sidebar = sidebarRef.current;
        if (!overlay || !sidebar) return;
        overlay.style.transition = 'opacity 350ms ease';
        overlay.style.opacity = '0';
        overlay.style.visibility = 'visible';
        overlay.style.pointerEvents = 'auto';
        sidebar.style.transition = 'transform 450ms cubic-bezier(0.2,0.9,0.2,1)';
        sidebar.style.transform = 'translateX(-110%)';
        sidebar.style.willChange = 'transform';
        void overlay.offsetHeight;
        requestAnimationFrame(() => {
          overlay.style.opacity = '1';
          sidebar.style.transform = 'translateX(0)';
        });
      }, 12);
    });
  };

  const overlayContent = isKingdomMenuMounted ? (
    <div
      ref={mobileOverlayRef}
      className="mobile-nav-overlay"
      onMouseDown={(e) => {
        if (e.target === mobileOverlayRef.current) closeMenu();
      }}
    >
      <div ref={sidebarRef} className="mobile-nav-sidebar" onMouseDown={(e) => e.stopPropagation()}>
        <button className="hamburger-close" onClick={closeMenu}>×</button>
        <ul className="mobile-nav-list">
          <NavLinks />
        </ul>
        <div className="mobile-social-icons">
          <a href="https://www.tiktok.com/@seuPerfil" target="_blank" rel="noopener noreferrer"><FaTiktok className="social-icon" /></a>
          <a href="https://www.youtube.com/@seuCanal" target="_blank" rel="noopener noreferrer"><FaYoutube className="social-icon" /></a>
          <a href="https://www.instagram.com/seuPerfil" target="_blank" rel="noopener noreferrer"><FaInstagram className="social-icon" /></a>
          <a href="https://www.facebook.com/profile.php?id=61577103301956" target="_blank" rel="noopener noreferrer"><FaFacebook className="social-icon" /></a>
        </div>
      </div>
    </div>
  ) : null;

  const overlayPortal = (typeof document !== 'undefined' && overlayContent) ? createPortal(overlayContent, document.body) : null;

  return (
    <>
      <header className={`app-header ${isChatActive ? 'chat-active' : ''}`}>
        <div className="header-top">
          <div className="header-left">
            <button
              ref={hamburgerRef}
              className="hamburger-menu"
              onClick={() => {
                if (!isKingdomMenuMounted) openMenu();
                else closeMenu();
              }}
              aria-label="Abrir menu"
            >
              ☰
            </button>
            <a href="https://www.tiktok.com/@seuPerfil" target="_blank" rel="noopener noreferrer"><FaTiktok className="social-icon" /></a>
            <a href="https://www.youtube.com/@seuCanal" target="_blank" rel="noopener noreferrer"><FaYoutube className="social-icon" /></a>
            <a href="https://www.instagram.com/seuPerfil" target="_blank" rel="noopener noreferrer"><FaInstagram className="social-icon" /></a>
            <a href="https://www.facebook.com/profile.php?id=61577103301956" target="_blank" rel="noopener noreferrer"><FaFacebook className="social-icon" /></a>
          </div>

          <div className="header-center">
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('home'); }}>
              <img src="https://i.imgur.com/ZUQJmco.png" alt="Logo do site" className="site-logo" draggable={false} />
            </a>
          </div>

          <div className="header-right">
            {!sessionChecked ? <span style={{ opacity: 0.7 }}>Carregando...</span> : user ? (
            <div className="user-actions">
              <button className="header-icon-btn" title="Mensagens Privadas" onClick={() => navigateTo('mensagens')}>
                  <img src="https://i.imgur.com/wlXOcI3.png" alt="Mensagens" />
                  {unreadMessages > 0 && <span className="notification-badge">{unreadMessages}</span>}
              </button>
              <div className="header-icon-container" ref={notificationRef}>
                <button className="header-icon-btn" title="Notificações" onClick={handleBellClick}>
                    <img src="https://i.imgur.com/RJhyoOD.png" alt="Notificações" />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
                <NotificationDropdown 
                  isOpen={isNotificationOpen}
                  notifications={notifications}
                  onNotificationClick={handleNotificationClick}
                />
              </div>
              <div className="avatar-container" ref={userMenuRef}>
                  <div className="avatar-circle" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                      <img id="top-right-avatar" src={avatarSrc} alt="Avatar" className="header-avatar-img" draggable={false}/>
                  </div>
                  {isUserMenuOpen && (
                    <div className="dropdown-menu user-dropdown">
                      <div className="user-info"><span className="user-name">{userData?.nome || user.email}</span></div>
                      {(() => {
                        if (userRole === 'banidos') return (<a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Sair do Reino</a>);
                        let panelName = null;
                        if (userRole === 'admin') panelName = 'Painel Admin';
                        else if (userRole === 'oficialreal' || userRole === 'guardareal') panelName = 'Painel do Gestor';
                        else if (userRole === 'autor') panelName = 'Painel Autor'
                        return (
                          <>
                            {panelName && <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('adminDashboard'); }}>{panelName}</a>}
                            <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('editProfile'); }}>Editar Perfil</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('myProfile'); }}>Meu Perfil</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('myAccount'); }}>Minha Conta</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); handleLogout(); }}>Sair do Reino</a>
                          </>
                        );
                      })()}
                    </div>
                  )}
              </div>
            </div>
            ) : (
            <>
              <div className="desktop-auth-links">
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('register'); }}><span>CADASTRE-SE</span></a>
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('login'); }}><span>LOGIN</span></a>
              </div>
              <div className="mobile-login-container" ref={userMenuRef}>
                <div className="avatar-circle" onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24px" height="24px">
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                  </svg>
                </div>
                <span className="login-prompt-mobile">ENTRAR</span>
                {isUserMenuOpen && (
                  <div className="dropdown-menu user-dropdown">
                    <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('register'); }}>CADASTRAR-SE</a>
                    <a href="#" onClick={(e) => { e.preventDefault(); handleMenuClick('login'); }}>LOGIN</a>
                  </div>
                )}
              </div>
            </>
            )}
          </div>
        </div>

        <nav className="header-nav" ref={kingdomMenuRef}>
          <ul className="nav-list">
            <NavLinks />
          </ul>
        </nav>
      </header>

      {overlayPortal}
    </>
  );
}

export default Header;