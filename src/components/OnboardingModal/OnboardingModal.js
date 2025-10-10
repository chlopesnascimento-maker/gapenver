import React, { useState } from 'react';
import { Carousel } from 'react-responsive-carousel';
import "react-responsive-carousel/lib/styles/carousel.min.css"; // Estilos base do carrossel
import './OnboardingModal.css'; // Nossos estilos customizados

// Importe a função que criamos para atualizar o cargo
import { atualizarCargoDoUsuario } from '../../utils/userActions'; // Verifique se o caminho está correto

function OnboardingModal({ user, onClose, onOpenEscolhaReino }) {
  
  // Função que será chamada quando o usuário escolher um reino
  const handleEscolherReino = async () => {
    // Futuramente, isso abrirá um modal para a escolha. Por enquanto, vamos simular.
    const reinoEscolhido = "Gápenver"; // Exemplo
    
    // Atualiza o cargo do usuário para "Cidadão"
    await atualizarCargoDoUsuario(user.id, 'Cidadão');
    
    alert(`Você agora é um Cidadão de ${reinoEscolhido}! O próximo passo será configurar seu perfil.`);
    // Aqui poderíamos avançar o carrossel ou fechar o modal
  };

  // Função para ser chamada quando o usuário pular ou fechar
  const handleSkip = async () => {
    // Marca o onboarding como completo no banco de dados para não mostrar de novo
    // (Esta função precisará ser criada, por enquanto, apenas fechamos)
    console.log("Usuário pulou o onboarding.");
    onClose(); // Chama a função onClose passada pelo App.js
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        <Carousel
          showThumbs={false}
          showStatus={false}
          infiniteLoop={true}
          centerMode={true}
          centerSlidePercentage={80}
          className="onboarding-carousel"
        >
          {/* Card 1: Escolher Reino */}
          <div className="quest-card">
            <h2 className="quest-title">Primeira Missão: Jure Lealdade</h2>
            <p className="quest-description">Escolha o reino que irá representar. Sua decisão moldará sua identidade e o início de sua jornada em Gápenver.</p>
            <button className="quest-cta" onClick={onOpenEscolhaReino}>Escolher seu Reino</button>
          </div>

          {/* Card 2: Foto de Perfil */}
          <div className="quest-card">
            <h2 className="quest-title">Segunda Missão: Revele sua Face</h2>
            <p className="quest-description">Um rosto dá identidade a um nome. Escolha a imagem que será exibida para todos os cidadãos do reino.</p>
            <button className="quest-cta" onClick={() => alert('Função para abrir o modal de upload de foto virá aqui.')}>Forjar seu Emblema</button>
          </div>

          {/* Card 3: O Quiz */}
          <div className="quest-card">
            <h2 className="quest-title">Terceira Missão: Prove seu Conhecimento</h2>
            <p className="quest-description">Responda ao questionário sobre o seu reino e prove ser digno de adentrar os salões internos da Torre do Reino.</p>
            <button className="quest-cta" onClick={() => alert('Função para abrir o modal do quiz virá aqui.')}>Iniciar o Teste</button>
          </div>
        </Carousel>

        <button className="skip-button" onClick={handleSkip}>Pular Jornada</button>
      </div>
    </div>
  );
}

export default OnboardingModal;