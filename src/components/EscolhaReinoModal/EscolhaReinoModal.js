import React from 'react';
import './EscolhaReinoModal.css';
import { jurarLealdadeAoReino, marcarQuestConcluida } from '../../utils/userActions';

const reinos = [
  { 
    id: 'gapenver', 
    nome: 'GÁPENVER', 
    descricao: 'Conhecido por ser a casa de guerreiros lendários. Força, coragem e integridade são naturais por aqui.',
    cardImage: 'https://i.imgur.com/dhL5Y8h.png',
    buttonImage: 'https://i.imgur.com/fYTjWp5.png'
  },
  { 
    id: 'saraver', 
    nome: 'SÁRAVER', 
    descricao: 'Um império desértico de guerreiros honrados, onde a força e a lealdade são forjadas sob o sol escaldante.',
    cardImage: 'https://i.imgur.com/P0qOwMs.png',
    buttonImage: 'https://i.imgur.com/ILP3oSW.png'
  },
  { 
    id: "lo'otrak", 
    nome: "LO'OTRAK",
    descricao: "Na costa dos mares, Lo'otrak é a casa de nobres e elegantes guerreiros, cuja graça é tão vivaz quanto suas habilidades.",
    cardImage: 'https://i.imgur.com/Pi6dUrn.png',
    buttonImage: 'https://i.imgur.com/5KnuKD6.png'
  },
  { 
    id: 'corvusk', 
    nome: 'CORVUSK', 
    descricao: 'As maiores e mais gélidas montanhas são o lar dos que sabem o peso da persistência e da resiliência.',
    cardImage: 'https://i.imgur.com/QupuFn4.png',
    buttonImage: 'https://i.imgur.com/L6POxcw.png'
  },
];

function EscolhaReinoModal({ isOpen, onClose, onReinoEscolhido, user }) {
  if (!isOpen) {
    return null;
  }

  const handleEscolha = async (reino) => {
  const { success } = await jurarLealdadeAoReino(user.id, reino.id, reino.nome);
  if (success) {
    // ✅ Marca a quest como concluída no Supabase
    await marcarQuestConcluida(user.id, 'escolher_reino');

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
        
        <div className="reinos-container-esteira">
          {reinos.map((reino) => (
            <div 
              key={reino.id} 
              className="reino-card" 
              >
              <div 
                className="reino-card-background" 
                style={{ backgroundImage: `url(${reino.cardImage})` }}
              ></div>
              <div className="reino-card-overlay"></div>
              {/* ======================== */}
              
              <div className="reino-card-content">
                <h3>{reino.nome}</h3>
                <p className="reino-descricao">{reino.descricao}</p>
                <button className="reino-escolher-btn" onClick={() => handleEscolha(reino)}>
                  <img 
                    src={reino.buttonImage} 
                    alt={`Jurar Lealdade a ${reino.nome}`} 
                    loading="lazy"
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EscolhaReinoModal;