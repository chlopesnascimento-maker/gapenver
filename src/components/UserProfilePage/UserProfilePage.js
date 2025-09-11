import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './UserProfilePage.css';
// ==========================================================
// PASSO 1: Importar nosso modal reutilizável
// ==========================================================
import EditUserModal from '../EditUserModal/EditUserModal';

// Mapeamento dos banners e brasões dos reinos
const reinoAssets = {
  'gapenver': {
    banner: 'https://i.imgur.com/5qP53OJ.png',
    crest: 'https://i.imgur.com/5qP53OJ.png',
    background: 'https://i.imgur.com/c535d4.png'
  },
  'saraver': {
    banner: 'https://i.imgur.com/aU8Q8kV.png',
    crest: 'https://i.imgur.com/aU8Q8kV.png',
    background: 'https://i.imgur.com/url-fundo-saraver.png'
  },
  'corvusk': {
    banner: 'https://i.imgur.com/icWVvHn.png',
    crest: 'https://i.imgur.com/icWVvHn.png',
    background: 'https://i.imgur.com/url-fundo-corvusk.png'
  },
  "lo'otrak": {
    banner: 'https://i.imgur.com/5WmAmH3.png',
    crest: 'https://i.imgur.com/5WmAmH3.png',
    background: "https://i.imgur.com/url-fundo-lootrak.png"
  },
  'reinos independentes': {
    banner: 'https://i.imgur.com/link-banner-padrao.png',
    crest: 'https://i.imgur.com/link-brasao-madeira.png',
    background: null
  }
};

const roleDisplayNames = {
  'admin': 'Administrador',
  'oficialreal': 'Oficial Real',
  'guardareal': 'Guarda Real',
  'viajante': 'Viajante',
  'banidos': 'Banido',
  'default': 'Indefinido'
};

// ==========================================================
// PASSO 2: Trazer a mesma lógica de hierarquia que já usamos
// ==========================================================
const roleHierarchy = {
  admin: 1,
  oficialreal: 2,
  guardareal: 3,
  viajante: 4,
  banidos: 5,
  default: 99
};

function UserProfilePage({ user, viewUserId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ==========================================================
  // PASSO 3: Criar um estado para controlar a abertura do modal
  // ==========================================================
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchProfile = async () => {
      const targetId = viewUserId || user?.id;
      if (!targetId) return;

      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetId)
        .single(); // Usar .single() é mais direto para buscar um único item

      if (fetchError && fetchError.code !== 'PGRST116') { // Ignora o erro "nenhuma linha encontrada"
        console.error("Erro detalhado ao buscar perfil:", fetchError);
        setError("Não foi possível carregar o perfil. Verifique o console.");
      } else if (data) {
        setProfile(data);
      } else {
        setError("Perfil não encontrado.");
      }
      setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, [viewUserId, user]);

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    fetchProfile(); // Re-busca os dados do perfil para mostrar as informações atualizadas
  };

  if (loading) {
    return <div className="profile-page-container"><p>Carregando perfil...</p></div>;
  }
  if (error) {
    return <div className="profile-page-container"><p className="error-message">{error}</p></div>;
  }
  if (!profile) {
    return <div className="profile-page-container"><p>Perfil não encontrado.</p></div>;
  }
  
  const { nome, sobrenome, foto_url, sobre_mim, reino, nota, nota_expires_at, cargo } = profile;
  const notaExpirou = nota_expires_at && new Date(nota_expires_at) < new Date();
  const reinoKey = reino?.toLowerCase() || 'reinos independentes';
  const assets = reinoAssets[reinoKey] || reinoAssets['reinos independentes'];
  const isStaff = ['admin', 'oficialreal', 'guardareal'].includes(cargo?.toLowerCase());
  const displayName = roleDisplayNames[cargo?.toLowerCase()] || roleDisplayNames['default'];
  
  // ==========================================================
  // PASSO 4: Verificar se o usuário LOGADO pode editar o perfil VISTO
  // ==========================================================
  const currentUserRole = user?.app_metadata?.roles?.[0]?.toLowerCase() || 'default';
  const profileUserRole = cargo?.toLowerCase() || 'default';

  const callerRank = roleHierarchy[currentUserRole];
  const targetRank = roleHierarchy[profileUserRole];
  
  const canEdit = user && profile && (
    (callerRank < targetRank) || 
    (currentUserRole === 'admin' && profileUserRole === 'admin')
  );

  return (
    <div className="profile-page-container">
      <div className="profile-banner" style={{ backgroundImage: `url(${assets.banner})` }}>
        <div className="banner-overlay"></div>
        <img src={foto_url || 'URL_PADRAO_AVATAR'} alt="Avatar do Usuário" className="profile-avatar"/>
      </div>

      <div className="profile-content-area">
        <div className="profile-header">
          <h1 className="profile-name">{nome} {sobrenome}</h1>
          <h2 className={`profile-cargo cargo-${cargo?.toLowerCase()}`}>{displayName}</h2>
          {isStaff && (
            <img src="https://i.imgur.com/J6hJQ7i.png" alt="Insígnia da Staff" className="staff-badge" />
          )}

          {/* ========================================================== */}
          {/* PASSO 5: Adicionar o botão, visível apenas se 'canEdit' for true */}
          {/* ========================================================== */}
          {canEdit && (
            <button 
              className="profile-edit-button" 
              onClick={() => setIsEditModalOpen(true)}
            >
              Editar esse Perfil
            </button>
          )}

          {!notaExpirou && nota && (
            <div className="profile-note">"{nota}"</div>
          )}
        </div>
        
        <div className="profile-main-grid">
          {/* ... O restante do seu JSX continua aqui ... */}
          <div className="profile-card about-card"><h2>Sobre Mim</h2><p>{sobre_mim || 'Nenhuma informação fornecida ainda.'}</p></div>
          <div className="profile-card main-info-card" style={{ backgroundImage: assets.background ? `url(${assets.background})` : 'none' }}><div className="card-overlay"><h2>Reino Principal</h2><div className="kingdom-badge"><img src={assets.crest} alt={`Brasão de ${reino}`} className="kingdom-crest"/><h3>{reino}</h3></div></div></div>
          <div className="profile-card extra-card"><h2>Conquistas</h2><p>Em breve...</p></div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* PASSO 6: Adicionar o componente do modal no final */}
      {/* Ele só será visível quando isEditModalOpen for true */}
      {/* ========================================================== */}
      <EditUserModal
        userToEdit={profile}
        currentUserRole={currentUserRole}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateSuccess={handleUpdateSuccess}
      />
    </div>
  );
}

export default UserProfilePage;