import React from 'react';
import './AutorCard.css'; // Importa seu próprio CSS isolado

// <-- MUDANÇA 1: Adicionado 'autor' à lista de nomes de exibição (se já não estiver)
const roleDisplayNames = {
    'admin': 'Administrador',
  'oficialreal': 'Oficial Real',
  'guardareal': 'Guarda Real',
  'viajante': 'Viajante',
  'banidos': 'Banido',
  'default': 'Indefinido'
};

function AutorCard({ profile }) {
  if (!profile) return null;

  const cargoKey = profile.cargo?.toLowerCase() || 'default';
  const displayName = roleDisplayNames[cargoKey];

  // <-- MUDANÇA 2: Criamos variáveis separadas para cada tipo de cargo
  const isAutor = cargoKey === 'autor';
  const isRegularStaff = ['admin', 'oficialreal', 'guardareal'].includes(cargoKey);

  return (
    <div className="autor-card-container">
      <img 
        src={profile.foto_url || 'URL_PADRAO_AVATAR'} 
        alt={profile.nome} 
        className="autor-avatar-img" 
      />
      <div className="autor-info-stack">
        <h3>{`${profile.nome} ${profile.sobrenome || ''}`}</h3>
        <span className={`autor-cargo-text cargo-${cargoKey}`}>{displayName}</span>
        
        {/* <-- MUDANÇA 3: Lógica para exibir a insígnia correta --> */}
        {isAutor && (
          <img 
            src="https://i.imgur.com/fWhR33L.png" 
            alt="Insígnia do Autor" 
            className="autor-autor-badge" // Usamos uma nova classe CSS
          />
        )}
        {isRegularStaff && (
          <img 
            src="https://i.imgur.com/J6hJQ7i.png" 
            alt="Insígnia da Staff" 
            className="autor-staff-badge" 
          />
        )}

        <div className="autor-curtidas-container">
          <svg className="autor-curtidas-icone" viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
          <span>{profile.total_curtidas || 0}</span>
        </div>
      </div>
    </div>
  );
}

export default AutorCard;