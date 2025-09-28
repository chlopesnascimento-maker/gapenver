import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import ChatWindow from '../ChatWindow/ChatWindow';
import NovaConversaModal from '../NovaConversaModal/NovaConversaModal';
import './MensagensPage.css';

function MensagensPage({ user }) {
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeConversaId, setActiveConversaId] = useState(null);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);

  useEffect(() => {
    fetchConversas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

async function fetchConversas() {
  if (!user) return;
  setLoading(true);
  setError(null);

  try {
    // 1) pega IDs de conversa do usuário
    const { data: participacoes, error: participacaoError } = await supabase
      .from('participantes_da_conversa')
      .select('conversa_id')
      .eq('user_id', user.id);

    console.log('DEBUG participacoes:', participacoes, 'error:', participacaoError);
    if (participacaoError) throw participacaoError;

    const conversaIds = participacoes.map(p => p.conversa_id);
    if (conversaIds.length === 0) {
      setConversas([]);
      setLoading(false);
      return;
    }

    // 2) tentativa direta com join (o ideal)
    const { data: conversasData, error: conversasError } = await supabase
      .from('conversas')
      .select(`
        id,
        last_message_at,
        participantes:participantes_da_conversa (
          user_id,
          profiles!participantes_da_conversa_user_id_fkey (
            id, nome, sobrenome, foto_url, photoURL
          )
        )
      `)
      .in('id', conversaIds)
      .order('last_message_at', { ascending: false });

    console.log(
      'DEBUG conversasData (join):',
      JSON.stringify(conversasData, null, 2),
      'error:',
      conversasError
    );

    const needsFallback =
      !conversasData ||
      conversasData.some(c => !c.participantes || c.participantes.length < 2);

    if (!conversasError && !needsFallback) {
      setConversas(conversasData);
      setLoading(false);
      return;
    }

    // 3) fallback: buscar participantes (com tentativa de trazer profiles) e preencher o que faltar
    console.warn('Usando fallback: montando participantes/profiles manualmente');

    const { data: participantesRows, error: partError } = await supabase
      .from('participantes_da_conversa')
      .select(`
        conversa_id,
        user_id,
        profiles!participantes_da_conversa_user_id_fkey (
          id, nome, sobrenome, foto_url, photoURL
        )
      `)
      .in('conversa_id', conversaIds);

    if (partError) throw partError;
    console.log("DEBUG participantesRows raw:", participantesRows);

    // normaliza e cria mapa conversaId -> [{ user_id, profiles }]
    const mapaParticipantes = {};
    const missingProfileIds = new Set();

    participantesRows.forEach(r => {
      // perfil pode vir como array ([]) ou objeto ({}) dependendo do join
      let prof = null;
      if (Array.isArray(r.profiles) && r.profiles.length) prof = r.profiles[0];
      else if (r.profiles && typeof r.profiles === 'object') prof = r.profiles;

      if (!prof) missingProfileIds.add(r.user_id);

      mapaParticipantes[r.conversa_id] = mapaParticipantes[r.conversa_id] || [];
      mapaParticipantes[r.conversa_id].push({
        user_id: r.user_id,
        profiles: prof || null
      });
    });

    // se tiver usuários sem profile via join, busca direto na tabela profiles
    let missingProfiles = [];
    if (missingProfileIds.size > 0) {
      const ids = Array.from(missingProfileIds);
      const { data: fetchedMissingProfiles, error: missingProfilesError } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, foto_url, photoURL')
        .in('id', ids);

      if (missingProfilesError) throw missingProfilesError;
      missingProfiles = fetchedMissingProfiles || [];
      console.log('DEBUG missingProfiles fetched:', missingProfiles);

      // atribui os profiles encontrados aos participantes faltantes no mapa
      missingProfiles.forEach(p => {
        Object.keys(mapaParticipantes).forEach(convId => {
          mapaParticipantes[convId] = mapaParticipantes[convId].map(part => {
            if (part.user_id === p.id && !part.profiles) {
              return { ...part, profiles: p };
            }
            return part;
          });
        });
      });
    }

    // 4) buscar dados simples das conversas (pra manter ordem / last_message_at)
    const { data: conversasSimples, error: convSimError } = await supabase
      .from('conversas')
      .select('id, last_message_at')
      .in('id', conversaIds)
      .order('last_message_at', { ascending: false });

    if (convSimError) throw convSimError;

    // montar conversas com participantes + profiles no mesmo shape esperado
    const conversasMontadas = conversasSimples.map(c => {
      const participantes = mapaParticipantes[c.id] || [];
      return {
        ...c,
        participantes
      };
    });

    console.log('conversasMontadas (fallback):', JSON.stringify(conversasMontadas, null, 2));
    setConversas(conversasMontadas);
    setLoading(false);
  } catch (err) {
    console.error('Erro em fetchConversas:', err);
    setError('Não foi possível carregar suas conversas.');
    setLoading(false);
  }
}

  // helper: monta nome
  const buildNomeDisplay = (profile) => {
    if (!profile) return 'Conversa';
    const first = profile.nome || '';
    const last = profile.sobrenome || '';
    const nome = `${first} ${last}`.trim();
    return nome || 'Conversa';
  };

  // helper: monta url da foto com fallbacks
  const buildFotoUrl = (profile) => {
    if (!profile) return 'https://i.imgur.com/SbdJgVb.png';
    // checa campos diferentes possíveis
    const raw = profile.foto_url || profile.photoURL || profile.photoUrl || profile.photo || null;
    if (!raw) return 'https://i.imgur.com/SbdJgVb.png';
    // se já for uma URL completa
    if (raw.startsWith('http')) return raw;
    // se for um path do Storage (ex: "avatars/uuid.jpg"), tenta compor publicUrl
    // Substitua 'YOUR_BUCKET_NAME' pelo nome do bucket de vocês (se usarem Storage)
    try {
      // se você usa bucket público:
      const { data } = supabase.storage.from('YOUR_BUCKET_NAME').getPublicUrl(raw);
      if (data?.publicUrl) return data.publicUrl;
    } catch (e) {
      // ignore
      console.warn('Erro ao tentar gerar publicUrl do storage:', e);
    }
    // fallback final: retorna raw (pode quebrar mas mostra o que tem)
    return raw;
  };

  return (
    <div className="mensagens-container">
      <aside className="lista-conversas-sidebar">
        <div className="sidebar-header">
          <h2>Mensagens</h2>
          <button className="nova-mensagem-btn" onClick={() => setIsNewConversationModalOpen(true)}>+</button>
        </div>

        <div className="conversas-list">
          {loading && <p>Carregando conversas...</p>}
          {error && <p className="error-message">{error}</p>}

          {!loading && conversas.map(conversa => {
          // helper (pode colocar no topo do componente)
const getProfileFromParticipante = (participante) => {
  if (!participante) return null;

  // Se for array (caso do join com Supabase)
  if (Array.isArray(participante.profiles) && participante.profiles.length) {
    return participante.profiles[0];
  }

  // Se for objeto (join normal ou fallback)
  if (participante.profiles && typeof participante.profiles === 'object') {
    return participante.profiles;
  }

  // Se o schema tiver os campos direto
  if (participante.nome || participante.foto_url || participante.photoURL) {
    return {
      nome: participante.nome || '',
      sobrenome: participante.sobrenome || '',
      foto_url: participante.foto_url || participante.photoURL || null
    };
  }

  return null;
};


const outros = (conversa.participantes || []).filter(p => p.user_id !== user.id);
const participanteAlvo = outros.length > 0 ? outros[0] : null;
const profile = getProfileFromParticipante(participanteAlvo);

 console.log("DEBUG conversa:", {
    conversaId: conversa.id,
    participantes: conversa.participantes,
    userAtual: user.id
  });

const nomeDisplay = buildNomeDisplay(profile);
const fotoUrl = buildFotoUrl(profile);
;

            return (
              <div 
                key={conversa.id}
                className={`conversa-item ${conversa.id === activeConversaId ? 'active' : ''}`}
                onClick={() => setActiveConversaId(conversa.id)}
              >
                <img src={fotoUrl} alt={nomeDisplay} onError={(e) => { e.currentTarget.src = 'https://i.imgur.com/SbdJgVb.png'; }} />
                <div className="conversa-info">
                  <span className="conversa-nome">{nomeDisplay}</span>
                  <span className="conversa-preview">Última mensagem...</span>
                </div>
              </div>
            );
          })}
        </div>
      </aside>

      <main className="chat-area">
        {activeConversaId ? (
         <ChatWindow user={user} conversaId={activeConversaId} />
        ) : (
          <div className="sem-conversa-selecionada">
            <h3>Selecione uma conversa para começar</h3>
            <p>Suas mensagens privadas aparecerão aqui.</p>
          </div>
        )}
      </main>

      <NovaConversaModal
        user={user}
        isOpen={isNewConversationModalOpen}
        onClose={() => setIsNewConversationModalOpen(false)}
        onNewConversation={() => {
            setIsNewConversationModalOpen(false);
            fetchConversas();
        }}
      />
    </div>
  );
}

export default MensagensPage;
