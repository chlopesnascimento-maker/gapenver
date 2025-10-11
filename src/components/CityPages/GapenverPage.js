import React from 'react';
import './CityPage.css'; // Usaremos um CSS compartilhado para as cidades

function GapenverPage() {
  return (
    <div className="city-page-container">
      <div className="city-card">
        <div className="city-header">
          <img 
            src="https://i.imgur.com/AnC6dG6.png" // Troque pela imagem/brasão de Gapenver
            alt="Brasão de Gapenver" 
            className="city-crest" 
            onError={(e) => { e.target.onerror = null; e.target.src='https://i.imgur.com/AMZWB9O.jpeg'; }} // Fallback para o logo principal
          />
          <h1 className="city-title">Gapenver</h1>
        </div>
        
        {/* Foto e Brazão acima do texto */}

<div className="city-container">
  {/* Cardzão com imagem centralizada */}
  <div className="city-banner">
    <img 
      src="https://i.imgur.com/v0z10ns.png" 
      alt="Brasão de Gapenver"
    />
  </div>
  </div>

        <div className="city-content">
          <p>
            <h3>
              Entre os reinos vizinhos, poucos nomes carregam tanto peso quanto Gápenver, chamada por muitos de “O Reino do Verde e da Onça”.
              Não é uma cidade feita para ostentar ouro, mas para lembrar que tradição é uma forma de poder. Suas muralhas, erguidas em pedra cinza-escura reforçada com metal, sustentam há séculos os estandartes verde-musgo que balançam como um juramento constante de disciplina e honra.
            </h3>

<p>No coração da cidade ergue-se o Palácio da Alvorada, fortaleza coroada por torres finas e cúpulas de cobre oxidado. Com o passar do tempo, o metal assumiu a mesma cor verde profunda das bandeiras da cidade. Ao nascer do sol, os reflexos em tom de esmeralda iluminam o horizonte, lembrando a todos que Gápenver se mantém desperta quando outros reinos ainda dormem.</p>

<p>A cidade se organiza em círculos concêntricos, cada qual com sua função:</p>

<p>• O Círculo dos Escudos, onde vivem guerreiros, cavaleiros e mestres de armas.</p>

<p>• O Círculo das Vozes, onde mercadores, pregadores e bardos transformam o mercado num palco vivo.</p>

<p>• O Círculo das Raízes, o mais antigo, guardião de templos, árvores sagradas e da respeitada Escola dos Livros Silenciosos.</p>

Mas nenhum lugar define Gápenver como a Praça da Onça. Ali repousa a estátua colossal de bronze escurecido de uma onça pintada, eternizada no salto. Seus olhos de jade parecem vigiar os que passam, e a lenda diz que, em noites de lua nova, quem ousa tocar sua pata sente o coração disparar — um chamado à coragem que nem todos conseguem suportar.
          </p>
          <p>
            Conhecida por sua academia de artes e por ser o centro nevrálgico das decisões do reino, Gapenver é um lugar de oportunidades e perigos em igual medida.
          </p>
        </div>

        {/* Aqui podemos adicionar seções interativas no futuro */}
        <div className="interactive-section">
          <h2>Locais Notáveis</h2>
          <ul>
            <li>O Brasão</li>
            <li>Palácio Real do Sol Nascente</li>
            <li>A Grande Biblioteca de Ouro</li>
            <li>Mercado das Especiarias</li>
            <li>Torre dos Sentinelas</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default GapenverPage;
