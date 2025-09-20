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

  const fetchConversas = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);

    const { data: participacoes, error: participacaoError } = await supabase
      .from('participantes_da_conversa')
      .select('conversa_id')
      .eq('user_id', user.id);

    if (participacaoError) {
      console.error("Erro ao buscar participações:", participacaoError);
      setError("Não foi possível carregar suas conversas.");
      setLoading(false);
      return;
    }

    const conversaIds = participacoes.map(p => p.conversa_id);
    
    if (conversaIds.length === 0) {
        setConversas([]);
        setLoading(false);
        return;
    }

    // ===== MUDANÇA NA QUERY =====
    // Alteramos a forma como os perfis são buscados para seguir o padrão que já funciona no ChatWindow.
    const { data: conversasData, error: conversasError } = await supabase
      .from('conversas')
      .select(`
        id,
        last_message_at,
        participantes:participantes_da_conversa (
          profile:profiles (id, nome, sobrenome, foto_url)
        )
      `)
      .in('id', conversaIds)
      .order('last_message_at', { ascending: false });

    if (conversasError) {
      console.error("Erro ao buscar detalhes das conversas:", conversasError);
      setError("Não foi possível carregar os detalhes das conversas.");
    } else {
      setConversas(conversasData);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConversas();
  }, [user]);

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
            
            // ===== MUDANÇA NA LÓGICA =====
            // Agora acessamos 'p.profile' em vez de 'p.profiles', seguindo a nova query.
            const outroParticipante = conversa.participantes.find(p => p.profile && p.profile.id !== user.id);
            const profile = outroParticipante?.profile;

            const nomeDisplay = profile ? `${profile.nome} ${profile.sobrenome}` : 'Conversa';
            const fotoUrl = profile?.foto_url || 'https://i.imgur.com/SbdJgVb.png';

            return (
              <div 
                key={conversa.id} 
                className={`conversa-item ${conversa.id === activeConversaId ? 'active' : ''}`}
                onClick={() => setActiveConversaId(conversa.id)}
              >
                <img src={fotoUrl} alt={nomeDisplay} />
                <div className="conversa-info">
                  <span className="conversa-nome">{nomeDisplay}</span>
                  <span className="conversa-preview">Última mensagem...</span>
                </div>
              </div>
            )
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