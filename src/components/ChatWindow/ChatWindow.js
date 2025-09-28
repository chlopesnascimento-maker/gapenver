import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import './ChatWindow.css';

function ChatWindow({ user, conversaId }) {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mensagensEndRef = useRef(null);

  const fetchMensagens = async () => {
    if (!conversaId) return;
    
    const { data, error: fetchError } = await supabase
      .from('mensagens')
      .select('*, remetente:remetente_id(id, nome, sobrenome, foto_url)')
      .eq('conversa_id', conversaId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      console.error("Erro ao buscar mensagens:", fetchError);
      setError("Não foi possível carregar as mensagens.");
    } else {
      setMensagens(data);
    }
  };

  // === NOVO: marca conversa como lida ao abrir ===
  const marcarComoLida = async () => {
  if (!conversaId || !user?.id) return;
  try {
    const { data, error } = await supabase
      .from('participantes_da_conversa')
      .update({ last_read_at: new Date().toISOString() })
      .eq('conversa_id', conversaId)
      .eq('user_id', user.id);

    if (error) throw error;
    console.log('marcarComoLida: sucesso', data);

    // NOTIFICA O HEADER IMEDIATAMENTE NESSA ABA
    window.dispatchEvent(new CustomEvent('conversaLida', { detail: { conversaId } }));
  } catch (err) {
    console.error('Erro ao marcar como lida:', err);
  }
};

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  useEffect(() => {
    if (!conversaId) return;

    setLoading(true);
    fetchMensagens().then(() => setLoading(false));
    marcarComoLida(); // marca como lida logo que abrir

    const subscription = supabase
      .channel(`public:mensagens:conversa_id=eq.${conversaId}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`
        }, 
        () => {
          fetchMensagens();
          marcarComoLida(); // marca como lida quando chega msg nova e você está na conversa
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };

  }, [conversaId]);

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    if (!novaMensagem.trim()) return;

    setEnviando(true);
    
    const { error: insertError } = await supabase
      .from('mensagens')
      .insert({
        conteudo: novaMensagem,
        conversa_id: conversaId,
        remetente_id: user.id
      });

    if (insertError) {
      console.error("Erro ao enviar mensagem:", insertError);
      alert(`Não foi possível enviar a mensagem. Erro: ${insertError.message}`);
    } else {
      setNovaMensagem('');
      fetchMensagens();
      marcarComoLida();
    }
    setEnviando(false);
  };

  if (loading) return <div>Carregando mensagens...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className="chat-window">
      <div className="mensagens-feed">
        {mensagens.map(msg => {
          const remetenteProfile = msg.remetente;
          const nomeCompleto = remetenteProfile ? `${remetenteProfile.nome} ${remetenteProfile.sobrenome || ''}`.trim() : '';

          return (
            <div 
              key={msg.id} 
              className={`mensagem-balao ${msg.remetente_id === user.id ? 'minha' : 'outrem'}`}
            >
              <img 
                src={remetenteProfile?.foto_url || 'https://i.imgur.com/SbdJgVb.png'} 
                alt={nomeCompleto} 
                className="mensagem-avatar"
              />
              <div className="mensagem-conteudo">
                <span className="remetente-nome">{nomeCompleto}</span>
                <p>{msg.conteudo}</p>
              </div>
            </div>
          );
        })}
        <div ref={mensagensEndRef} />
      </div>

      <form className="mensagem-form" onSubmit={handleEnviarMensagem}>
        <input
          type="text"
          placeholder="Digite sua mensagem..."
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          disabled={enviando}
        />
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;
