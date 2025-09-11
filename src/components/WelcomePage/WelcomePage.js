import React from 'react';
import './WelcomePage.css'; // Importando o CSS da página de boas-vindas

function WelcomePage({ navigateTo }) {
  return (
    <div className="welcome-page-container">
      <div className="welcome-content">
        <h1 className="welcome-title">Bem-vindo(a), Viajante!</h1>
        <p className="welcome-text">As Sentinelas Reais lhe concede acesso ao reino! Mas antes, verifique sua caixa de E-MAIL e confirme sua conta!</p>
               
      </div>
    </div>
  );
}

export default WelcomePage;
