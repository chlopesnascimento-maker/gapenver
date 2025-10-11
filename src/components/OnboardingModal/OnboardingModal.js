import React, { useState, useEffect } from 'react';
import './OnboardingModal.css';
import { marcarOnboardingConcluido } from '../../utils/userActions';

function OnboardingModal({ user, onClose, onOpenEscolhaReino, onOnboardingComplete }) {
  
  // === O NOVO CÉREBRO ===
  const [currentIndex, setCurrentIndex] = useState(0);
  // O estado agora é inicializado lendo a "memória de curto prazo" do navegador
  const [isMinimized, setIsMinimized] = useState(
    sessionStorage.getItem('onboardingMinimized') === 'true'
  );

  const totalQuests = 3; // Total de cards no carrossel

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalQuests);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalQuests) % totalQuests);
  };
  
  // Função para minimizar o modal
  const handleMinimize = () => {
    sessionStorage.setItem('onboardingMinimized', 'true'); // Grava a escolha na sessão
    setIsMinimized(true);
  };

  // Função para expandir o modal
  const handleExpand = () => {
    sessionStorage.removeItem('onboardingMinimized'); // Limpa a escolha
    setIsMinimized(false);
  };

  // Função para concluir DE VERDADE o onboarding
  const handleComplete = async () => {
    const { success } = await marcarOnboardingConcluido(user.id);
    if (success) {
      sessionStorage.removeItem('onboardingMinimized'); // Limpa a memória de sessão
      onOnboardingComplete(); // Avisa o App.js para fechar de vez
      onClose();
    } else {
      alert("Não foi possível salvar seu progresso.");
    }
  };


  // Se estiver minimizado, mostra apenas o botão flutuante
  if (isMinimized) {
    return (
      <button className="onboarding-minimized-button" onClick={handleExpand}>
        <span>Jornada do Viajante</span>
        {/* Adicione um ícone de livro ou quest aqui se quiser */}
      </button>
    );
  }

  // Se estiver expandido, mostra o modal completo
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        
        {/* --- NOSSO CARROSSEL CUSTOMIZADO --- */}
        <div className="onboarding-carousel-viewport">
          <div 
            className="onboarding-carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {/* Card 1: Escolher Reino */}
            <div className="carousel-slide-item">
              <div className="quest-card">
                <h2 className="quest-title">Primeira Missão: Jure Lealdade</h2>
                <p className="quest-description">Escolha o reino que irá representar. Sua decisão moldará sua identidade e o início de sua jornada.</p>
                <div className="quest-reward"><span>Recompensa: <strong>Título de Cidadão do Reino</strong></span><small>Este título é aplicado automaticamente.</small></div>
                <button className="quest-cta" onClick={onOpenEscolhaReino}>Escolher seu Reino</button>
              </div>
            </div>

            {/* Card 2: Foto de Perfil */}
            <div className="carousel-slide-item">
              <div className="quest-card">
                <h2 className="quest-title">Segunda Missão: Revele sua Face</h2>
                <p className="quest-description">Um rosto dá identidade a um nome. Escolha a imagem que será exibida para todos os cidadãos do reino.</p>
                 <div className="quest-reward"><span>Recompensa: <strong>Emblema Pessoal</strong></span><small>Seu avatar será exibido publicamente.</small></div>
                <button className="quest-cta" onClick={() => alert('Abrir modal de upload de foto.')}>Forjar seu Emblema</button>
              </div>
            </div>

            {/* Card 3: O Quiz */}
            <div className="carousel-slide-item">
              <div className="quest-card">
                <h2 className="quest-title">Terceira Missão: Prove seu Conhecimento</h2>
                <p className="quest-description">Responda ao questionário sobre o seu reino e prove ser digno de adentrar a Torre do Reino.</p>
                 <div className="quest-reward"><span>Recompensa: <strong>Acesso à Torre do Reino</strong></span><small>Uma sala de chat exclusiva para membros do seu reino.</small></div>
                <button className="quest-cta" onClick={() => alert('Abrir modal do quiz.')}>Iniciar o Teste</button>
              </div>
            </div>
          </div>
        </div>

        {/* --- NAVEGAÇÃO DO CARROSSEL --- */}
        <div className="carousel-navigation">
            <button onClick={goToPrevious} className="carousel-nav-arrow">‹</button>
            <div className="carousel-dots">
                {[...Array(totalQuests)].map((_, index) => (
                    <div key={index} className={`dot ${currentIndex === index ? 'active' : ''}`} />
                ))}
            </div>
            <button onClick={goToNext} className="carousel-nav-arrow">›</button>
        </div>
        
        <button className="skip-button" onClick={handleMinimize}>Lembrar-me Mais Tarde</button>
        <button className="complete-button" onClick={handleComplete}>Concluir Jornada (Debug)</button>
      </div>
    </div>
  );
}

export default OnboardingModal;