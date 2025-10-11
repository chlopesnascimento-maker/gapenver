import React, { useState, useEffect, useRef } from 'react';
import './OnboardingModal.css';
import { marcarOnboardingConcluido } from '../../utils/userActions';

function OnboardingModal({ user, onClose, onOpenEscolhaReino, onOnboardingComplete }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(
    sessionStorage.getItem('onboardingMinimized') === 'true'
  );

  const [position, setPosition] = useState(() => {
    const savedPosition = localStorage.getItem('onboardingButtonPosition');
    return savedPosition ? JSON.parse(savedPosition) : { x: 0, y: 0 };
  });

  const buttonRef = useRef(null);
  const dragInfo = useRef({
    isDragging: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  useEffect(() => {
  const button = buttonRef.current;
  if (!button) return;

  // garante que o navegador não interfira
  button.style.touchAction = 'none';
  button.style.userSelect = 'none';
  button.style.webkitUserSelect = 'none';
  button.style.cursor = 'grab';

  const info = {
    dragging: false,
    offsetX: 0,
    offsetY: 0,
  };

  const onPointerDown = (e) => {
    if (e.button !== 0) return; // apenas botão esquerdo
    e.preventDefault();
    e.stopPropagation();
    info.dragging = true;
    info.offsetX = e.clientX - position.x;
    info.offsetY = e.clientY - position.y;
    button.setPointerCapture(e.pointerId);
    button.style.cursor = 'grabbing';
  };

  const onPointerMove = (e) => {
    if (!info.dragging) return;
    const x = e.clientX - info.offsetX;
    const y = e.clientY - info.offsetY;
    button.style.transform = `translate3d(${x}px, ${y}px, 0)`;
  };

  const onPointerUp = (e) => {
    if (!info.dragging) return;
    info.dragging = false;
    button.releasePointerCapture(e.pointerId);
    button.style.cursor = 'grab';

    // salva posição final
    const transform = button.style.transform.match(/-?\d+(\.\d+)?/g);
    if (transform) {
      const [x, y] = transform.map(Number);
      setPosition({ x, y });
      localStorage.setItem('onboardingButtonPosition', JSON.stringify({ x, y }));
    }
  };

  // listeners globais
  button.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', onPointerUp);

  return () => {
    button.removeEventListener('pointerdown', onPointerDown);
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
  };
}, []);

  const handleButtonClick = () => {
    if (!dragInfo.current.hasMoved) {
      handleExpand();
    }
  };

  const totalQuests = 3;

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % totalQuests);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => (prevIndex - 1 + totalQuests) % totalQuests);
  };

  const handleMinimize = () => {
    sessionStorage.setItem('onboardingMinimized', 'true');
    setIsMinimized(true);
  };

  const handleExpand = () => {
    sessionStorage.removeItem('onboardingMinimized');
    setIsMinimized(false);
  };

  const handleComplete = async () => {
    const { success } = await marcarOnboardingConcluido(user.id);
    if (success) {
      sessionStorage.removeItem('onboardingMinimized');
      onOnboardingComplete();
      onClose();
    } else {
      alert('Não foi possível salvar seu progresso.');
    }
  };

  if (isMinimized) {
    return (
      <button
        ref={buttonRef}
        className="onboarding-minimized-button draggable"
        onClick={handleButtonClick}
        style={{ transform: `translate(${position.x}px, ${position.y}px)` }}
      >
        <span>Jornada do Viajante</span>
      </button>
    );
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-carousel-viewport">
          <div
            className="onboarding-carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {/* Card 1 */}
            <div className="carousel-slide-item">
              <div className="quest-card">
                <h2 className="quest-title">Primeira Missão: Jure Lealdade</h2>
                <p className="quest-description">
                  Escolha o reino que irá representar. Sua decisão moldará sua identidade e o início de sua jornada.
                </p>
                <div className="quest-reward">
                  <span>Recompensa: <strong>Título de Cidadão do Reino</strong></span>
                  <small>Este título é aplicado automaticamente.</small>
                </div>
                <button className="quest-cta" onClick={onOpenEscolhaReino}>Escolher seu Reino</button>
              </div>
            </div>

            {/* Card 2 */}
            <div className="carousel-slide-item">
              <div className="quest-card">
                <h2 className="quest-title">Segunda Missão: Revele sua Face</h2>
                <p className="quest-description">
                  Um rosto dá identidade a um nome. Escolha a imagem que será exibida para todos os cidadãos do reino.
                </p>
                <div className="quest-reward">
                  <span>Recompensa: <strong>Emblema Pessoal</strong></span>
                  <small>Seu avatar será exibido publicamente.</small>
                </div>
                <button className="quest-cta" onClick={() => alert('Abrir modal de upload de foto.')}>
                  Forjar seu Emblema
                </button>
              </div>
            </div>

            {/* Card 3 */}
            <div className="carousel-slide-item">
              <div className="quest-card">
                <h2 className="quest-title">Terceira Missão: Prove seu Conhecimento</h2>
                <p className="quest-description">
                  Responda ao questionário sobre o seu reino e prove ser digno de adentrar a Torre do Reino.
                </p>
                <div className="quest-reward">
                  <span>Recompensa: <strong>Acesso à Torre do Reino</strong></span>
                  <small>Uma sala de chat exclusiva para membros do seu reino.</small>
                </div>
                <button className="quest-cta" onClick={() => alert('Abrir modal do quiz.')}>
                  Iniciar o Teste
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Navegação */}
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
