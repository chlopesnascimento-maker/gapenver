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
      </div>
    </div>
  );
}

export default AutorCard;