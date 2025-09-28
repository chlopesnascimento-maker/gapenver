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
            profiles!user_id (id, nome, sobrenome, foto_url, photoURL)
          )
        `)
        .in('id', conversaIds)
        .order('last_message_at', { ascending: false });

      // debug
      console.log('conversasData (com join):', conversasData, 'erro:', conversasError);

      // se veio bem formado (com participantes e profiles), usa direto
      const needsFallback = !conversasData || conversasData.some(c => !c.participantes || c.participantes.length === 0);

      if (!conversasError && !needsFallback) {
        setConversas(conversasData);
        setLoading(false);
        return;
      }

      // 3) fallback: buscar participantes e perfis separadamente e montar objeto
      console.warn('Usando fallback: montando participantes/profiles manualmente');

      const { data: participantesRows, error: partError } = await supabase
        .from('participantes_da_conversa')
        .select('conversa_id, user_id')
        .in('conversa_id', conversaIds);

      if (partError) throw partError;

      // mapa conversaId -> [userId]
      const mapaParticipantes = {};
      participantesRows.forEach(r => {
        mapaParticipantes[r.conversa_id] = mapaParticipantes[r.conversa_id] || [];
        mapaParticipantes[r.conversa_id].push(r.user_id);
      });

      // pega todos os userIds (exceto o user atual) para consultar profiles
      const allUserIdsSet = new Set();
      Object.values(mapaParticipantes).forEach(arr => {
        arr.forEach(u => {
          if (u !== user.id) allUserIdsSet.add(u);
        });
      });
      const allUserIds = Array.from(allUserIdsSet);

      // buscar profiles dos outros participantes
      let profilesById = {};
      if (allUserIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, nome, sobrenome, foto_url, photoURL')
          .in('id', allUserIds);

        if (profilesError) throw profilesError;
        profilesById = profilesData.reduce((acc, p) => {
          acc[p.id] = p;
          return acc;
        }, {});
      }

      // buscar dados das conversas (simples) para manter ordem e last_message_at
      const { data: conversasSimples, error: convSimError } = await supabase
        .from('conversas')
        .select('id, last_message_at')
        .in('id', conversaIds)
        .order('last_message_at', { ascending: false });

      if (convSimError) throw convSimError;

      // montar conversas com participantes + profiles colocados no mesmo shape esperado
      const conversasMontadas = conversasSimples.map(c => {
        const userIds = mapaParticipantes[c.id] || [];
        // montar array de objetos similar ao que o join traria
        const participantes = userIds.map(uid => ({
          user_id: uid,
          profiles: profilesById[uid] || null
        }));
        return {
          ...c,
          participantes
        };
      });

      console.log('conversasMontadas (fallback):', conversasMontadas, 'profilesById:', profilesById);
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
            const outros = (conversa.participantes || []).filter(p => p.user_id !== user.id);
            const primeiro = outros[0] || conversa.participantes?.find(p => !!p.profiles) || null;
            const profile = primeiro?.profiles || null;

            const nomeDisplay = buildNomeDisplay(profile);
            const fotoUrl = buildFotoUrl(profile);

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
