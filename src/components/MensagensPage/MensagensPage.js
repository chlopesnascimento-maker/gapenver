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

// NO SEU ARQUIVO MensagensPage.js

async function fetchConversas() {
  if (!user) return;
  setLoading(true);
  setError(null);

  try {
    // Chamada única para a nossa nova função inteligente!
    const { data, error } = await supabase.rpc('get_visible_conversations');

    if (error) {
      throw error;
    }

    // A função já retorna os dados no formato que precisamos
    console.log('Conversas recebidas da nova função RPC:', data);
    setConversas(data || []);

  } catch (err) {
    console.error('Erro em fetchConversas:', err);
    setError('Não foi possível carregar suas conversas.');
  } finally {
    setLoading(false);
  }
}

async function handleDeleteConversa(conversaId) {
  // Confirmação para evitar cliques acidentais
  const wantsToDelete = window.confirm(
    "Tem certeza que deseja apagar esta conversa? Ela desaparecerá da sua lista, mas a outra pessoa ainda poderá vê-la."
  );

  if (!wantsToDelete) {
    return;
  }

  try {
    const { error } = await supabase
      .from('participantes_da_conversa')
      .update({ deleted_at: new Date() }) // Define a data de hoje
      .eq('conversa_id', conversaId)
      .eq('user_id', user.id); // Apenas para o seu usuário

    if (error) {
      throw error;
    }

    // Se a conversa deletada era a que estava ativa, limpa a seleção
    if (activeConversaId === conversaId) {
      setActiveConversaId(null);
    }
    
    // Recarrega a lista de conversas, que agora virá sem a que foi deletada
    fetchConversas(); 
  } catch (err) {
    console.error("Erro ao deletar a conversa para o usuário:", err);
    alert("Não foi possível apagar a conversa. Tente novamente.");
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
                {/* BOTÃO DE DELETAR ADICIONADO AQUI */}
                <button
                  className="conversa-delete-btn"
                  onClick={(e) => {
                    e.stopPropagation(); // Impede que o clique selecione a conversa
                    handleDeleteConversa(conversa.id);
                  }}
                >
                  &times; {/* Isso é um 'X' */}
                </button>
                {/* FIM DA ADIÇÃO */}

              </div>
            );
          })}
        </div>
      </aside>

      <main className="chat-area">
  {activeConversaId ? (
    (() => {
      const activeConversa = conversas.find(c => c.id === activeConversaId);
      const deletedTimestamp = activeConversa ? activeConversa.my_deleted_at : null;

      // LINHA DE DEBUG PARA VER O QUE ESTAMOS ENVIANDO
      console.log("Enviando para ChatWindow ->", { conversaId: activeConversaId, deletedTimestamp });

      return (
        <ChatWindow
          user={user}
          conversaId={activeConversaId}
          deletedTimestamp={deletedTimestamp}
        />
      );
    })()
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
