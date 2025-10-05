import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './UserProfilePage.css';
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
    banner: 'https://i.imgur.com/aheiS8O.png',
    crest: 'https://i.imgur.com/aheiS8O.png',
    background: "https://i.imgur.com/url-fundo-lootrak.png"
  },
  'reinos independentes': {
    banner: 'https://i.imgur.com/link-banner-padrao.png',
    crest: 'https://i.imgur.com/link-brasao-madeira.png',
    background: null
  }
};

// --- NOVO: Adicionamos as descrições dos Reinos ---
const reinoDescriptions = {
  'gapenver': 'O Coração Verdejante. O último bastião da magia ancestral, onde a lealdade é forjada na natureza e nos laços de sangue.',
  'saraver': 'O Império do Sol. Terras douradas de comércio e conquista, onde a ambição brilha mais forte que o aço.',
  'corvusk': 'O Ninho do Corvo. Um reino de segredos e astúcia, governado nas sombras das montanhas congeladas por aqueles que valorizam o conhecimento acima de tudo.',
  "lo'otrak": 'A Bravura dos Mares. Nascidos para a nobreza e classe, como as bonanças martímas. Onde a coragem, força e inteligência são natas em cada um.',
  'reinos independentes': 'Viajantes sem bandeira, cuja lealdade pertence apenas ao caminho que trilham e às histórias que coletam.'
};

const roleDisplayNames = {
  'admin': 'Administrador',
  'oficialreal': 'Oficial Real',
  'guardareal': 'Guarda Real',
  'viajante': 'Viajante',
  'banidos': 'Banido',
  'default': 'Indefinido'
};

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
        .single();
      if (fetchError && fetchError.code !== 'PGRST116') {
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
    fetchProfile();
  };

  if (loading) return <div className="profile-page-container"><p>Carregando perfil...</p></div>;
  if (error) return <div className="profile-page-container"><p className="error-message">{error}</p></div>;
  if (!profile) return <div className="profile-page-container"><p>Perfil não encontrado.</p></div>;
  
  const { nome, sobrenome, foto_url, sobre_mim, reino, nota, nota_expires_at, cargo, titulo } = profile;
  const notaExpirou = nota_expires_at && new Date(nota_expires_at) < new Date();
  const reinoKey = reino?.toLowerCase() || 'reinos independentes';
  const assets = reinoAssets[reinoKey] || reinoAssets['reinos independentes'];
  const description = reinoDescriptions[reinoKey];
  const isStaff = ['admin', 'oficialreal', 'guardareal'].includes(cargo?.toLowerCase());
  const displayName = roleDisplayNames[cargo?.toLowerCase()] || roleDisplayNames['default'];
  
  const currentUserRole = user?.app_metadata?.roles?.[0]?.toLowerCase() || 'default';
  const profileUserRole = cargo?.toLowerCase() || 'default';
  const callerRank = roleHierarchy[currentUserRole];
  const targetRank = roleHierarchy[profileUserRole];
  const canEdit = user && profile && ((callerRank < targetRank) || (currentUserRole === 'admin' && profileUserRole === 'admin'));

  return (
    
    <div className={`profile-page-container theme-${reinoKey.replace(/'/g, "")}`}>
      <div className="profile-banner" style={{ backgroundImage: `url(${assets.banner})` }}>
        <div className="banner-overlay"></div>
         {/* 👇 A estrutura que imita 100% a lógica da StaffPage 👇 */}
        {isStaff ? (
          // Container que apenas posiciona o portal no lugar certo
          <div className="profile-avatar-positioner"> 
            {/* Container que gera a animação (copia o .avatar-portal-container) */}
            <div className="portal-fx-container"> 
              <img src={foto_url || '/default-avatar.png'} alt="Avatar do Usuário" className="portal-avatar-img"/>
            </div>
          </div>
        ) : (
          // O avatar original para não-staffs
          <img src={foto_url || '/default-avatar.png'} alt="Avatar do Usuário" className="profile-avatar"/>
        )}
      </div>

      <div className="profile-content-area">
        <div className="profile-header">
          <h1 className="profile-name">{nome} {sobrenome}</h1>
          {isStaff && titulo && (
            <h3 className="profile-title">{titulo}</h3>
          )}
          <h2 className={`profile-cargo cargo-${cargo?.toLowerCase()}`}>{displayName}</h2>
          {isStaff && (
            <img src="https://i.imgur.com/J6hJQ7i.png" alt="Insígnia da Staff" className="staff-badge" />
          )}
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
          <div className="profile-card about-card"><h2>Sobre Mim</h2><p>{sobre_mim || 'Nenhuma informação fornecida ainda.'}</p></div>
                            {/* --- ALTERADO: O card do Reino foi completamente substituído --- */}
                            
          <div className={`kingdom-card ${reinoKey.replace(/'/g, "")}`}>
    <h2>Reino Principal</h2>
    <img src={assets.crest} alt={`Brasão de ${reino}`} className="kingdom-crest" />
    <h4 className="kingdom-name">{reino}</h4>
    <p className="kingdom-description">{description}</p>
</div>
          <div className="profile-card extra-card"><h2>Conquistas</h2><p>Em breve...</p></div>
        </div>
      </div>

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