import React from 'react';
import './EscolhaReinoModal.css';
import { jurarLealdadeAoReino } from '../../utils/userActions';

const reinos = [
  { id: 'gapenver', nome: 'GÁPENVER', cor: 'rgba(26, 42, 35, 0.8)', descricao: 'O reino central, conhecido por sua diplomacia, comércio e pela imponente capital de Apenver.' },
  { id: 'saraver', nome: 'SÁRAVER', cor: 'rgba(205, 164, 52, 0.8)', descricao: 'Um império desértico de guerreiros honrados, onde a força e a lealdade são forjadas sob o sol escaldante.' },
  { id: 'lootrak', nome: "LO'OTRAK", cor: 'rgba(22, 105, 105, 0.8)', descricao: 'Uma densa floresta encantada, lar de criaturas místicas e guardiões de segredos ancestrais.' },
  { id: 'corvusk', nome: 'CORVUSK', cor: 'rgba(30, 30, 80, 0.8)', descricao: 'As maiores e mais gélidas montanhas são o lar dos que sabem o peso da vitória e da dor.' },
];

function EscolhaReinoModal({ isOpen, onClose, onReinoEscolhido, user }) {
  if (!isOpen) {
    return null;
  }

  const handleEscolha = async (reino) => {
      const { success } = await jurarLealdadeAoReino(user.id, reino.id, reino.nome);
    if (success) {
      alert(`Lealdade jurada! Você agora é um Cidadão de ${reino.nome}.`);
      if (onReinoEscolhido) onReinoEscolhido(reino.id);
      onClose();
    } else {
      alert("Houve um erro ao processar seu juramento.");
    }
  };

  return (
    <div className="escolha-reino-overlay" onClick={onClose}>
      <div className="escolha-reino-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>ESCOLHA SEU REINO</h2>
        <p>Sua jornada começa com uma decisão, Viajante. A qual reino você jurará lealdade?</p>
        
        {/* A ESTRUTURA AGORA É SIMPLES: UM CONTAINER E OS CARDS DIRETAMENTE DENTRO */}
        <div className="reinos-container-esteira">
          {reinos.map((reino) => (
            <div key={reino.id} className="reino-card" style={{ backgroundColor: reino.cor }}>
              <h3>{reino.nome}</h3>
              <p className="reino-descricao">{reino.descricao}</p>
              <button className="reino-escolher-btn" onClick={() => handleEscolha(reino)}>
                Jurar Lealdade
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EscolhaReinoModal;