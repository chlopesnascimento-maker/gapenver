import React, { useState, useEffect, useRef } from 'react';
import './OnboardingModal.css';
import {  marcarOnboardingConcluido,  buscarQuestsConcluidas, marcarQuestConcluida} from '../../utils/userActions';

function OnboardingModal({ user, onClose, onOpenEscolhaReino, onOnboardingComplete }) {
  const [questsPendentes, setQuestsPendentes] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isMinimized, setIsMinimized] = useState(
    sessionStorage.getItem('onboardingMinimized') === 'true'
  );
  const [position, setPosition] = useState(() => {
    const savedPosition = localStorage.getItem('onboardingButtonPosition');
    return savedPosition ? JSON.parse(savedPosition) : { x: 0, y: 0 };
  });

  const buttonRef = useRef(null);

  // === 🔹 1. Define as quests base ===
  const todasQuests = [
    {
      id: 'escolher_reino',
      titulo: 'Primeira Missão: Jure Lealdade',
      descricao:
        'Escolha o reino que irá representar. Sua decisão moldará sua identidade e o início de sua jornada.',
      recompensa: 'Título de Cidadão do Reino',
      detalhe: 'Este título é aplicado automaticamente.',
      cta: 'Escolher seu Reino',
      acao: async () => {
  await onOpenEscolhaReino();
  },
    },


    {
      id: 'criar_avatar',
      titulo: 'Segunda Missão: Revele sua Face',
      descricao:
        'Um rosto dá identidade a um nome. Escolha a imagem que será exibida para todos os cidadãos do reino.',
      recompensa: 'Emblema Pessoal',
      detalhe: 'Seu avatar será exibido publicamente.',
      cta: 'Forjar seu Emblema',
      acao: () => alert('Abrir modal de upload de foto.'),
    },
    {
      id: 'quiz_reino',
      titulo: 'Terceira Missão: Prove seu Conhecimento',
      descricao:
        'Responda ao questionário sobre o seu reino e prove ser digno de adentrar a Torre do Reino.',
      recompensa: 'Acesso à Torre do Reino',
      detalhe: 'Uma sala de chat exclusiva para membros do seu reino.',
      cta: 'Iniciar o Teste',
      acao: () => alert('Abrir modal do quiz.'),
    },
  ];

  // === 🔹 2. Busca progresso do usuário ===
  useEffect(() => {
    const fetchQuests = async () => {
      if (!user?.id) return;
      const concluidas = await buscarQuestsConcluidas(user.id);
      const pendentes = todasQuests.filter((q) => !concluidas.includes(q.id));
      setQuestsPendentes(pendentes);
      setCurrentIndex(0);
    };
    fetchQuests();
  }, [user?.id]);

  // === 🔹 3. Lógica de arrastar o botão minimizado ===
  useEffect(() => {
    const button = buttonRef.current;
    if (!button) return;
    button.style.touchAction = 'none';
    button.style.userSelect = 'none';
    button.style.webkitUserSelect = 'none';
    button.style.cursor = 'grab';

    const info = { dragging: false, offsetX: 0, offsetY: 0 };
    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
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
      const transform = button.style.transform.match(/-?\d+(\.\d+)?/g);
      if (transform) {
        const [x, y] = transform.map(Number);
        setPosition({ x, y });
        localStorage.setItem('onboardingButtonPosition', JSON.stringify({ x, y }));
      }
    };
    button.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    return () => {
      button.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, []);

  // === 🔹 4. Navegação do carrossel ===
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % questsPendentes.length);
  };
  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + questsPendentes.length) % questsPendentes.length);
  };

  // === 🔹 5. Minimizar / expandir ===
  const handleMinimize = () => {
    sessionStorage.setItem('onboardingMinimized', 'true');
    setIsMinimized(true);
  };
  const handleExpand = () => {
    sessionStorage.removeItem('onboardingMinimized');
    setIsMinimized(false);
  };
  const handleButtonClick = () => handleExpand();

  // === 🔹 6. Finalização manual (debug) ===
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

  // === 🔹 7. Estado minimizado ===
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

  // === 🔹 8. Se não há mais quests pendentes ===
  if (questsPendentes.length === 0) {
    return null;
  }

  // === 🔹 9. Renderização principal ===
  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <div className="onboarding-carousel-viewport">
          <div
            className="onboarding-carousel-track"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {questsPendentes.map((quest) => (
              <div key={quest.id} className="carousel-slide-item">
                <div className="quest-card">
                  <h2 className="quest-title">{quest.titulo}</h2>
                  <p className="quest-description">{quest.descricao}</p>
                  <div className="quest-reward">
                    <span>
                      Recompensa: <strong>{quest.recompensa}</strong>
                    </span>
                    <small>{quest.detalhe}</small>
                  </div>
                  <button className="quest-cta" onClick={quest.acao}>
                    {quest.cta}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navegação */}
        {questsPendentes.length > 1 && (
          <div className="carousel-navigation">
            <button onClick={goToPrevious} className="carousel-nav-arrow">
              ‹
            </button>
            <div className="carousel-dots">
              {questsPendentes.map((_, index) => (
                <div
                  key={index}
                  className={`dot ${currentIndex === index ? 'active' : ''}`}
                />
              ))}
            </div>
            <button onClick={goToNext} className="carousel-nav-arrow">
              ›
            </button>
          </div>
        )}

        <button className="skip-button" onClick={handleMinimize}>
          Lembrar-me Mais Tarde
        </button>
        <button className="complete-button" onClick={handleComplete}>
          Concluir Jornada (Debug)
        </button>
      </div>
    </div>
  );
}

export default OnboardingModal;
