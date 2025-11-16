import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import './UserProfilePage.css';
import EditUserModal from '../EditUserModal/EditUserModal';
import { HIERARQUIA_CARGOS } from '../../constants/roles';
import { getBaseCargo } from '../../utils/helpers';

// Mapeamento dos banners e brasões dos reinos (continua o mesmo)
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
  },

  'staff': {
    banner: 'https://i.imgur.com/0Kaqfw5.png', // <-- SUBSTITUA AQUI
    crest: 'https://i.imgur.com/COLOQUE-SEU-LINK-BRASAO-STAFF.png', // <-- SUBSTITUA AQUI
    background: 'https://i.imgur.com/0Kaqfw5.png'           // <-- SUBSTITUA AQUI
  }
};

const reinoDescriptions = {
  'gapenver': 'O Coração Verdejante. O último bastião da magia ancestral, onde a lealdade é forjada na natureza e nos laços de sangue.',
  'saraver': 'O Império do Sol. Terras douradas de comércio e conquista, onde a ambição brilha mais forte que o aço.',
  'corvusk': 'O Ninho do Corvo. Um reino de segredos e astúcia, governado nas sombras das montanhas congeladas por aqueles que valorizam o conhecimento acima de tudo.',
  "lo'otrak": 'A Bravura dos Mares. Nascidos para a nobreza e classe, como as bonanças marítimas. Onde a coragem, força e inteligência são natas em cada um.',
  'reinos independentes': 'Viajantes sem bandeira, cuja lealdade pertence apenas ao caminho que trilham e às histórias que coletam.',
  'staff': 'Os Pilares do Reino. Guardiões da ordem e arquitetos do mundo, dedicados a manter o equilíbrio e a justiça em Gapenver.'
};

// -- ANTIGOS MAPAS DE CARGOS REMOVIDOS --
// const roleDisplayNames = { ... };
// const roleHierarchy = { ... };

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
  
    // Extrai as propriedades do perfil
const { nome, sobrenome, foto_url, sobre_mim, reino, nota, nota_expires_at, cargo, titulo } = profile;

// Traduz o cargo completo para o cargo-base
const profileBaseCargo = getBaseCargo(cargo);
const currentUserBaseCargo = getBaseCargo(user?.app_metadata?.roles?.[0]);

// Pega a prioridade de cada um usando o MAPA CENTRAL
const targetRank = HIERARQUIA_CARGOS[profileBaseCargo] || 99;
const callerRank = HIERARQUIA_CARGOS[currentUserBaseCargo] || 99;

// FUNÇÃO INTELIGENTE para gerar NOME DE EXIBIÇÃO e NOME DE CLASSE CSS
const getCargoInfo = (fullCargo, baseCargo) => {
  const displayNames = {
    'autor': 'Saudações',
    'admin': 'Administrador',
    'oficialreal': 'Luminir',
    'guardareal': 'Mehalkir',
    'viajante': 'Viajante',
    'banido': 'Banido',
  };

  const displayName = fullCargo?.includes(' de ') ? fullCargo : displayNames[baseCargo] || 'Indefinido';
  
  // Converte o cargo base para um nome de classe válido (ex: "oficialreal" -> "oficial-real")
  const className = baseCargo.replace(/ /g, '-');

  return { displayName, className };
};
const { displayName, className: cargoClassName } = getCargoInfo(cargo, profileBaseCargo);

// Lógica de status e permissão
const isAutor = profileBaseCargo === 'autor';

// --- LÓGICA DE VISIBILIDADE DO BOTÃO ATUALIZADA ---
let calculatedCanEdit = false; // Começa como falso
  if (user && profile) { // Apenas checa se o usuário está logado e o perfil existe
    
    // Regra 1: Autor pode ver todos os botões
    if (currentUserBaseCargo === 'autor') {
      calculatedCanEdit = true;
    } 
    
    // Regra 2: Admin pode ver todos, exceto Autor
    else if (currentUserBaseCargo === 'admin') {
      if (profileBaseCargo !== 'autor') {
        calculatedCanEdit = true; 
      }
    } 
    
    // Regra 3 & 4: Luminir, Mehalkir e TODOS OS OUTROS
    else {
      // Esta é a lógica de hierarquia que cobre todos os outros casos
      // usando seu arquivo HIERARQUIA_CARGOS
      calculatedCanEdit = (callerRank < targetRank);
    }
  }
const canEdit = calculatedCanEdit;
const isRegularStaff = ['admin', 'oficialreal', 'guardareal'].includes(profileBaseCargo);

// --- Lógica de assets ---
const notaExpirou = nota_expires_at && new Date(nota_expires_at) < new Date();
const reinoKey = isRegularStaff 
                 ? 'staff' 
                 : (reino?.toLowerCase() || 'reinos independentes');
const assets = reinoAssets[reinoKey] || reinoAssets['reinos independentes'];
const description = reinoDescriptions[reinoKey];


  return (
    <div className={`profile-page-container theme-${reinoKey.replace(/'/g, "")}`}>
      <div className="profile-banner" style={{ backgroundImage: `url(${assets.banner})` }}>
        <div className="banner-overlay"></div>
        {(isAutor || isRegularStaff) ? (
          <div className="profile-avatar-positioner"> 
            <div className="portal-fx-container"> 
              <img src={foto_url || '/default-avatar.png'} alt="Avatar do Usuário" className="portal-avatar-img"/>
            </div>
          </div>
        ) : (
          <img src={foto_url || '/default-avatar.png'} alt="Avatar do Usuário" className="profile-avatar"/>
        )}
      </div>

      <div className="profile-content-area">
        <div className="profile-header">
          <h1 className="profile-name">{nome} {sobrenome}</h1>
          {(isAutor || isRegularStaff) && titulo && (
            <h3 className="profile-title">{titulo}</h3>
          )}
          <h2 className={`profile-cargo cargo-${cargoClassName}`}>{displayName}</h2>
          
          {isAutor && (
            <img src="https://i.imgur.com/Wu6llM0.png" alt="Insígnia do Autor" className="autor-badge-profile" />
          )}
          {isRegularStaff && (
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
                            
          <div className={`kingdom-card ${reinoKey.replace(/'/g, "")}`}>
            <h2>Reino Principal</h2>
            <img src={assets.crest} alt={`Brasão de ${reino}`} className="kingdom-crest" />
            <p className="kingdom-description">{description}</p>
          </div>
          <div className="profile-card extra-card"><h2>Conquistas</h2><p>Em breve...</p></div>
        </div>
      </div>

      <EditUserModal
        userToEdit={profile}
        currentUserRole={currentUserBaseCargo} // Enviando o cargo-base para o modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onUpdateSuccess={handleUpdateSuccess}
      />
    </div>
  );
}

export default UserProfilePage;