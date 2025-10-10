import React, { useState, useEffect, useRef } from 'react';
import './EscolhaReinoModal.css';
import { jurarLealdadeAoReino } from '../../utils/userActions'; // Importa nossa função de juramento

const reinos = [
  { id: 'gapenver', nome: 'GÁPENVER', cor: 'rgba(26, 42, 35, 0.8)', descricao: 'O reino central, conhecido por sua diplomacia, comércio e pela imponente capital de Apenver.' },
  { id: 'saraver', nome: 'SÁRAVER', cor: 'rgba(205, 164, 52, 0.8)', descricao: 'Um império desértico de guerreiros honrados, onde a força e a lealdade são forjadas sob o sol escaldante.' },
  { id: 'lootrak', nome: "LO'OTRAK", cor: 'rgba(22, 105, 105, 0.8)', descricao: 'Uma densa floresta encantada, lar de criaturas místicas e guardiões de segredos ancestrais.' },
  { id: 'corvusk', nome: 'CORVUSK', cor: 'rgba(30, 30, 80, 0.8)', descricao: 'As maiores e mais gélidas montanhas são o lar dos que sabem o peso da vitória e da dor.' },
];

// --- LÓGICA DE CLONAGEM ---
// Mostramos 3 slides, então clonamos 1 no início e 1 no fim para o efeito de loop
const clonesIniciais = reinos.slice(reinos.length - 1);
const clonesFinais = reinos.slice(0, 1);
const itemsCarrossel = [...clonesIniciais, ...reinos, ...clonesFinais];


function EscolhaReinoModal({ isOpen, onClose, onReinoEscolhido, user }) {
  const [currentIndex, setCurrentIndex] = useState(1); // Começa no primeiro item REAL
  const [isTransitioning, setIsTransitioning] = useState(true);
  const trackRef = useRef(null);

  const goToNext = () => {
    if (!isTransitioning) return;
    setCurrentIndex(prevIndex => prevIndex + 1);
    setIsTransitioning(true);
  };

  const goToPrevious = () => {
    if (!isTransitioning) return;
    setCurrentIndex(prevIndex => prevIndex - 1);
    setIsTransitioning(true);
  };

  const handleTransitionEnd = () => {
    // Quando a animação para os slides clonados termina, fazemos o "salto" invisível
    if (currentIndex === 0) { // Se chegamos no clone do final (à esquerda)
      setIsTransitioning(false); // Desliga a animação para o salto
      setCurrentIndex(reinos.length); // Pula para o último item REAL
    } else if (currentIndex === itemsCarrossel.length - 1) { // Se chegamos no clone do início (à direita)
      setIsTransitioning(false); // Desliga a animação para o salto
      setCurrentIndex(1); // Pula para o primeiro item REAL
    }
  };
  
  // Efeito para reativar a transição após o "salto"
  useEffect(() => {
      if (!isTransitioning) {
        // Força a reativação da transição em um "tick" do navegador
        requestAnimationFrame(() => setIsTransitioning(true));
      }
  }, [isTransitioning]);


  if (!isOpen) return null;

  const handleEscolha = async (reino) => {
    const { success } = await jurarLealdadeAoReino(user.id, reino.nome);

    if (success) {
      alert(`Lealdade jurada! Você agora é um Cidadão de ${reino.nome}.`);
      if (onReinoEscolhido) onReinoEscolhido(reino.id);
      onClose();
    } else {
      alert("Houve um erro ao processar seu juramento. Por favor, tente novamente.");
    }
  };

  const slideOffset = (1 - currentIndex) * (100 / 3);

  return (
    <div className="escolha-reino-overlay" onClick={onClose}>
      <div className="escolha-reino-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>ESCOLHA SEU REINO</h2>
        <p>Sua jornada começa com uma decisão. A qual reino você jurará lealdade?</p>
        
        <div className="custom-carousel-container">
          <button onClick={goToPrevious} className="carousel-arrow left-arrow">‹</button>
          <div className="carousel-viewport">
            <div 
              ref={trackRef}
              className={`carousel-track ${isTransitioning ? '' : 'no-transition'}`}
              style={{ transform: `translateX(${slideOffset}%)` }}
              onTransitionEnd={handleTransitionEnd}
            >
              {itemsCarrossel.map((reino, index) => (
                // A key precisa ser única, então combinamos id e index por causa dos clones
                <div key={`${reino.id}-${index}`} className="carousel-slide">
                  <div className="reino-card" style={{ backgroundColor: reino.cor }}>
                    <h3>{reino.nome}</h3>
                    <p className="reino-descricao">{reino.descricao}</p>
                    <button className="reino-escolher-btn" onClick={() => handleEscolha(reino)}>
                      Jurar Lealdade
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button onClick={goToNext} className="carousel-arrow right-arrow">›</button>
        </div>
      </div>
    </div>
  );
}

export default EscolhaReinoModal;