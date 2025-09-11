// src/components/AdminDashboard/AdminDashboard.js
import React from 'react';
import './AdminDashboard.css';

// MUDANÇA 1: Adicionamos a propriedade 'user' para saber quem está logado
function AdminDashboard({ navigateTo, user }) {

  // --- LÓGICA PARA PERSONALIZAR A PÁGINA ---
  let title = 'Painel de Controle'; // Título padrão
  let welcomeMessage = 'Bem-vindo(a).'; // Mensagem padrão

  // Pega o cargo principal do usuário
  const userRole = user?.app_metadata?.roles?.[0];

  // Define os textos com base no cargo
  if (userRole === 'admin') {
    title = 'Painel de Controle do Administrador';
    welcomeMessage = 'Bem-vindo, Majestade. O Reino aguarda suas ordens.';
  } else if (userRole === 'oficialreal') {
    title = 'Painel do Gestor';
    welcomeMessage = 'Bem-vindo, Oficial da Guarda Real.';
  } else if (userRole === 'guardareal') {
    title = 'Painel do Guarda';
    welcomeMessage = 'Bem-vindo, Sargento da Guarda Real.';
  }
  // --- FIM DA LÓGICA ---

  return (
    <div className="admin-dashboard-container">
      {/* MUDANÇA 2: Usamos as variáveis dinâmicas */}
      <h1 className="admin-title">{title}</h1>
      <p>{welcomeMessage}</p>
      
      <div className="admin-widgets-grid">
        
        {/* Widgets que mostram para os cargos*/}
        {(userRole === 'admin' || userRole === 'oficialreal' || userRole === 'guardareal') && (
          <div className="admin-widget clickable" onClick={() => navigateTo('userManagement')}>
            <h3>Gerenciar Usuários</h3>
            <p className="widget-data">Ver Lista</p>
            <p>Veja e administre todos os cidadãos do reino.</p>
          </div>
        )}

        <div className="admin-widget">
          <h3>Visitas Hoje</h3>
          <p className="widget-data">--</p>
          <p>Em breve...</p>
        </div>
        <div className="admin-widget">
          <h3>Gerenciar Pedidos</h3>
          <p className="widget-data">--</p>
          <p>Em breve...</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;