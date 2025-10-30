// src/components/PrimeiroCapituloModal/PrimeiroCapituloModal.js
import React from 'react';
import './PrimeiroCapituloModal.css';

function PrimeiroCapituloModal({ isOpen, onClose, user, navigateTo }) {
  if (!isOpen) {
    return null;
  }

  // Ação para o botão "Ler Agora"
  const handleLerAgora = () => {
    // navigateTo('leitorCapitulo', { capituloId: 1 }); // Exemplo de rota
    alert("Navegação para o leitor do Capítulo 1 ainda não implementada."); // Placeholder
    onClose();
  };

  // Ações para os botões de não logado
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
        {/* Adicione sua imagem de fundo aqui se desejar, via CSS ou tag <img> */}
        <h2 className="capitulo-modal-title">Pssst... Um Segredo do Reino para Você!</h2>
        <p className="capitulo-modal-text">
          Opa! E aí, viajante? Chega mais... Tenho uma coisa aqui que, digamos... escorregou da prateleira dos arquivos mais... reservados. Sabe como é, desajeitado que sou! Mas olha só que sorte a sua: caiu bem no início das Crônicas de Gápenver! Falei com o Rei Lúcio, e ele concordou que um gostinho do começo não faria mal a uma alma curiosa e disposta a aprender. É o Capítulo Um, onde a aventura realmente começa a esquentar, sabe? Dá uma lida rápida aqui, com discrição... o Sacerdote Chefe tem ouvidos por toda parte, e apesar de ele ter um bom coração, digamos que ele prefere que a lore seja revelada... no tempo certo, hehe. Vai fundo, vale cada palavra!
        </p>
        <div className="capitulo-modal-actions">
          {user ? (
            // Botão para usuário logado
            <button className="capitulo-cta-button" onClick={handleLerAgora}>
              Ler o Primeiro Capítulo Agora
            </button>
          ) : (
            // Botões para usuário não logado
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
        <button className="capitulo-close-button" onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

export default PrimeiroCapituloModal;