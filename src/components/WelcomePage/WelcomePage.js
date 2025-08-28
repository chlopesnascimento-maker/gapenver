import React from 'react';
import './WelcomePage.css'; // Importando o CSS da página de boas-vindas

function WelcomePage({ navigateTo }) {
  return (
    <div className="welcome-page-container">
      <div className="welcome-content">
        <h1 className="welcome-title">Bem-vindo(a), Viajante!</h1>
        <p className="welcome-text">As Sentinelas Reais agora lhe conhecem!</p>
        <p className="welcome-text">Entre no Reino de Gápenver!</p>
        <button onClick={() => navigateTo('login')} className="cta-button">
          IR PARA LOGIN
        </button>
      </div>
    </div>
  );
}

export default WelcomePage;
