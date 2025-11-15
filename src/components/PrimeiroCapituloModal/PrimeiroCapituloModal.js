import React from 'react';
import './PrimeiroCapituloModal.css';

function PrimeiroCapituloModal({ isOpen, onClose, user, navigateTo }) {
  if (!isOpen) {
    return null;
  }

  const handleLerAgora = () => {
    // navigateTo('leitorCapitulo', { capituloId: 1 });
    alert("Navegação para o leitor do Capítulo 1 ainda não implementada.");
    onClose();
  };

  const handleCadastro = () => {
    navigateTo('register');
    onClose();
  };
  const handleLogin = () => {
    navigateTo('login');
    onClose();
  };

  return (
    <div className="capitulo-modal-overlay" onClick={onClose}>
      <div className="capitulo-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* O botão fechar foi movido para fora da área de rolagem */}
        <button className="capitulo-close-button" onClick={onClose}>&times;</button>
        
        {/* <-- MUDANÇA 1: Criamos um wrapper para o conteúdo que deve rolar --> */}
        <div className="capitulo-modal-scrollable-area">
          <h2 className="capitulo-modal-title">Um Convite do Reino: O Primeiro Capítulo</h2>
          <p className="capitulo-modal-text">
            As brumas ancestrais se dissipam, revelando os caminhos que deram início a tudo. As primeiras páginas das crônicas de Gápenver aguardam por você, sussurrando segredos e presságios. O Reino lhe oferece uma chave: desvende os mistérios do Capítulo Um, uma oferta gratuita para todos os viajantes dispostos a atender ao chamado.
          </p>
          {/* Adicione mais texto aqui se quiser testar a rolagem */}
        </div>

        {/* <-- MUDANÇA 2: A área de ações agora fica separada, no rodapé do modal --> */}
        <div className="capitulo-modal-actions">
          {user ? (
            <button className="capitulo-cta-button" onClick={handleLerAgora}>
              Ler o Primeiro Capítulo Agora
            </button>
          ) : (
            <>
              <button className="capitulo-cta-button secondary" onClick={handleLogin}>
                Já Sou Cidadão (Login)
              </button>
              <button className="capitulo-cta-button" onClick={handleCadastro}>
                Tornar-se Cidadão (Cadastre-se)
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default PrimeiroCapituloModal;