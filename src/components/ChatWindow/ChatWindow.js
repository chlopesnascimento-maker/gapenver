import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import './ChatWindow.css';
import RichTextEditor from '../RichTextEditor/RichTextEditor'; // Ajuste o caminho se necessário
import DOMPurify from 'dompurify';

// ALTERAÇÃO 1: Adicionamos 'deletedTimestamp' aqui
function ChatWindow({ user, conversaId, deletedTimestamp, isStaffChat }) {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);
  const mensagensEndRef = useRef(null);

  // A função de busca agora usa o timestamp
  const fetchMensagens = async () => {
    if (!conversaId) return;
    
    let query = supabase
      .from('mensagens')
      .select('*, remetente:remetente_id(id, nome, sobrenome, foto_url, cargo)')
      .eq('conversa_id', conversaId);

    // Se a data existir, aplicamos o filtro
    if (deletedTimestamp) {
      console.log('Aplicando filtro de data:', deletedTimestamp); // Linha de debug
      query = query.gt('created_at', deletedTimestamp);
    }

    // O resto da função é igual ao seu original
    query = query.order('created_at', { ascending: true });
    const { data, error: fetchError } = await query;

    if (fetchError) {
      console.error("Erro ao buscar mensagens:", fetchError);
      setError("Não foi possível carregar as mensagens.");
    } else {
      setMensagens(data);
    }
  };

const marcarComoLida = async () => {
    if (!conversaId || !user?.id) return;

    // Objeto base para o update
    const updatePayload = {
      last_read_at: new Date().toISOString()
    };

    // LÓGICA DEFENSIVA ADICIONADA AQUI:
    // Se este componente sabe que a conversa foi deletada (porque ele recebeu o timestamp),
    // vamos garantir que esse valor seja preservado no update.
    if (deletedTimestamp) {
      updatePayload.deleted_at = deletedTimestamp;
    }

    try {
      const { error } = await supabase
        .from('participantes_da_conversa')
        // Usamos o nosso novo payload seguro
        .update(updatePayload)
        .eq('conversa_id', conversaId)
        .eq('user_id', user.id);

      if (error) throw error;
      window.dispatchEvent(new CustomEvent('conversaLida', { detail: { conversaId } }));
    } catch (err) {
      console.error('Erro ao marcar como lida (versão segura):', err);
    }
  };

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensagens]);

  useEffect(() => {
    if (!conversaId) return;

    setLoading(true);
    fetchMensagens().then(() => setLoading(false));
    marcarComoLida();

    // SEU LISTENER ORIGINAL - SEGURO E FUNCIONAL
    const subscription = supabase
      .channel(`public:mensagens:conversa_id=eq.${conversaId}`)
      .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'mensagens',
          filter: `conversa_id=eq.${conversaId}`
        }, 
        () => {
          fetchMensagens(); // Mantivemos o seu fetchMensagens() original e robusto
          marcarComoLida();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  // ALTERAÇÃO 3: Adicionamos 'deletedTimestamp' à lista de dependências
  }, [conversaId, deletedTimestamp]);

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    
    // 1. Guarda o conteúdo que será enviado
    const conteudoParaEnviar = novaMensagem;
    
    if (!conteudoParaEnviar || conteudoParaEnviar === '<p></p>') {
      // A verificação agora é feita na cópia
      alert("A mensagem não pode estar vazia.");
      return;
    }

    // 2. ATUALIZAÇÃO OTIMISTA: Limpa a UI imediatamente
    setNovaMensagem('');
    setEnviando(true);

    // 3. Envia os dados para o Supabase em segundo plano
    const { error: insertError } = await supabase
      .from('mensagens')
      .insert({
        conteudo: conteudoParaEnviar, // Usa o conteúdo guardado
        conversa_id: conversaId,
        remetente_id: user.id
      });
      
    if (insertError) {
      console.error("Erro ao enviar mensagem:", insertError);
      alert(`Não foi possível enviar a mensagem. Erro: ${insertError.message}`);
      // BÔNUS: Em caso de erro, devolve a mensagem para a caixa de texto
      setNovaMensagem(conteudoParaEnviar);
    } else {
      // A atualização em tempo real já é feita pelo fetchMensagens() do listener,
      // mas podemos chamar aqui para garantir a atualização imediata caso o listener atrase.
      fetchMensagens();
    }
    
    setEnviando(false);
  };
  
  if (loading) return <div>Carregando mensagens...</div>;
  if (error) return <div>{error}</div>;

   return (
    // ALTERAÇÃO 2: Adicionamos a classe 'staff-chat' condicionalmente
    <div className={`chat-window ${isStaffChat ? 'staff-chat' : ''}`}>
      <div className="mensagens-feed">
        {mensagens.map(msg => {
          const remetenteProfile = msg.remetente;
          const nomeCompleto = remetenteProfile ? `${remetenteProfile.nome} ${remetenteProfile.sobrenome || ''}`.trim() : '';

          // ALTERAÇÃO 3: Verificamos se o autor da mensagem é da Staff
          const isRemetenteStaff = ['admin', 'oficialreal', 'guardareal'].includes(remetenteProfile?.cargo?.toLowerCase());

          return (
            <div 
              key={msg.id} 
              // ALTERAÇÃO 4: Adicionamos a classe 'staff-bubble' se o remetente for staff
              className={`mensagem-balao ${msg.remetente_id === user.id ? 'minha' : 'outrem'} ${isRemetenteStaff ? 'staff-bubble' : ''}`}
            >
              <img 
                src={remetenteProfile?.foto_url || 'https://i.imgur.com/SbdJgVb.png'} 
                alt={nomeCompleto} 
                className="mensagem-avatar"
              />
              <div className="mensagem-conteudo">
                <span className="remetente-nome">{nomeCompleto}</span>
                <div 
                  className="conteudo-formatado"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.conteudo) }} 
                />
              </div>
            </div>
          );
        })}
        <div ref={mensagensEndRef} />
      </div>

      <form className="mensagem-form" onSubmit={handleEnviarMensagem}>
        <RichTextEditor
            content={novaMensagem}
            onChange={setNovaMensagem}
        />
        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar'}
        </button>
      </form>
    </div>
  );
}

export default ChatWindow;