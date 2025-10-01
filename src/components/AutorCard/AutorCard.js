import React from 'react';
import './AutorCard.css'; // Importa seu próprio CSS isolado

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
  const isStaff = ['admin', 'oficialreal', 'guardareal'].includes(cargoKey);

  return (
    <div className="autor-card-container">
      <img 
        src={profile.foto_url || 'URL_PADRAO_AVATAR'} 
        alt={profile.nome} 
        className="autor-avatar-img" 
      />
      <div className="autor-info-stack">
        <h3>{`${profile.nome} ${profile.sobrenome}`}</h3>
        <span className={`autor-cargo-text cargo-${cargoKey}`}>{displayName}</span>
        {isStaff && (
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