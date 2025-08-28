import React, { useEffect } from 'react';
import './HomePage.css'; // Importando o CSS da HomePage

function HomePage() {
  // Este 'useEffect' encontra todas as seções e adiciona a animação de scroll
  // que tínhamos no nosso HTML original.
  useEffect(() => {
    const sections = document.querySelectorAll('.section');

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1 // A animação começa quando 10% do elemento está visível
    });

    sections.forEach(section => {
      observer.observe(section);
    });

    // Função de "limpeza" para otimização
    return () => sections.forEach(section => observer.unobserve(section));
  }, []); // O array vazio [] garante que este código rode apenas uma vez

  return (
    // Usamos <> (React.Fragment) para agrupar todos os elementos
    <>
      <div className="section">
        <h1>Bem-vindos ao Reino de <b>GÁPENVER</b></h1>
        <h2>Onde os rios sussurram segredos antigos.</h2>
        <a href="#" className="cta-button">COMPRAR AGORA</a>
      </div>

      <div className="section">
        <h2>Nas florestas encantadas, árvores brilham sob a lua.</h2>
        <a href="#" className="cta-button">COMPRAR AGORA</a>
      </div>

      <div className="section">
        <h2>Castelos imponentes tocam as nuvens com suas torres.</h2>
        <a href="#" className="cta-button">COMPRAR AGORA</a>
      </div>

      <div className="section">
        <h2>Heróis lendários forjam seu destino em cada aurora.</h2>
        <a href="#" className="cta-button">COMPRAR AGORA</a>
      </div>

      <div className="section">
        <h2>Magias ancestrais dançam no ar, esperando para serem descobertas.</h2>
        <a href="#" className="cta-button">COMPRAR AGORA</a>
      </div>

      <div className="section">
        <h2>Criaturas míticas espreitam nas sombras da noite eterna.</h2>
        <a href="#" className="cta-button">COMPRAR AGORA</a>
      </div>

      <div className="section">
        <h2>O tesouro perdido aguarda bravos aventureiros.</h2>
        <a href="#" className="cta-button">COMPRAR AGORA</a>
      </div>

      <div className="section">
        <h2>A profecia aguarda o escolhido para despertar o poder supremo.</h2>
        <a href="#" className="cta-button">COMPRAR AGORA</a>
      </div>

      <div className="section">
        <h2>No coração do reino, a esperança nunca se apaga.</h2>
        <a href="#" className="cta-button">COMPRAR AGORA</a>
      </div>
    </>
  );
}

export default HomePage;
