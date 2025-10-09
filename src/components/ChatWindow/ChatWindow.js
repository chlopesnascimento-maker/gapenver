import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../../supabaseClient';
import './ChatWindow.css';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import DOMPurify from 'dompurify';
import ConfirmacaoModal from '../Shared/ConfirmacaoModal/ConfirmacaoModal'; // Importação do modal

function ChatWindow({ user, conversaId, deletedTimestamp, isStaffChat, participantProfile, onCloseChat }) {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [enviando, setEnviando] = useState(false);

  const [mensagemAtiva, setMensagemAtiva] = useState(null);
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false);

  const mensagensEndRef = useRef(null);

  // Estado do modal de confirmação/alerta
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  // Função utilitária para alertas simples
  const showAlert = (message) => {
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      onCancel: null,
    });
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = (e) => setIsMobile(e.matches);
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else mq.addListener(handler);
    return () => {
      if (mq.removeEventListener) mq.removeEventListener('change', handler);
      else mq.removeListener(handler);
    };
  }, []);

  const fetchMensagens = async () => {
    if (!conversaId) return;
    try {
      let query = supabase
        .from('mensagens')
        .select('*, remetente:remetente_id(id, nome, sobrenome, foto_url, cargo)')
        .eq('conversa_id', conversaId);

      if (deletedTimestamp) {
        query = query.gt('created_at', deletedTimestamp);
      }

      query = query.order('created_at', { ascending: true });
      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error("Erro ao buscar mensagens:", fetchError);
        setError("Não foi possível carregar as mensagens.");
      } else {
        setMensagens(data || []);
      }
    } catch (err) {
      console.error('Erro inesperado ao buscar mensagens:', err);
      setError("Não foi possível carregar as mensagens.");
    }
  };

  const marcarComoLida = async () => {
    if (!conversaId || !user?.id) return;
    const updatePayload = { last_read_at: new Date().toISOString() };
    if (deletedTimestamp) updatePayload.deleted_at = deletedTimestamp;

    try {
      const { error } = await supabase
        .from('participantes_da_conversa')
        .update(updatePayload)
        .eq('conversa_id', conversaId)
        .eq('user_id', user.id);

      if (error) throw error;
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
    marcarComoLida();

    const subscription = supabase
      .channel(`public:mensagens:conversa_id=eq.${conversaId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensagens', filter: `conversa_id=eq.${conversaId}` }, () => {
        fetchMensagens();
        marcarComoLida();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [conversaId, deletedTimestamp]);

  // Envio de mensagem
  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    const conteudoParaEnviar = novaMensagem;
    if (!conteudoParaEnviar || conteudoParaEnviar === '<p></p>') {
      showAlert("A mensagem não pode estar vazia.");
      return;
    }

    setNovaMensagem('');
    setEnviando(true);

    const { error: insertError } = await supabase.from('mensagens').insert({
      conteudo: conteudoParaEnviar,
      conversa_id: conversaId,
      remetente_id: user.id
    });

    if (insertError) {
      console.error("Erro ao enviar mensagem:", insertError);
      showAlert(`Não foi possível enviar a mensagem. Erro: ${insertError.message}`);
      setNovaMensagem(conteudoParaEnviar);
    } else {
      fetchMensagens();
    }

    setEnviando(false);
  };

  useEffect(() => {
    window.dispatchEvent(new CustomEvent('chatActive', { detail: { active: true } }));
    return () => {
      window.dispatchEvent(new CustomEvent('chatActive', { detail: { active: false } }));
    };
  }, []);

  if (loading) return <div>Carregando mensagens...</div>;
  if (error) return <div>{error}</div>;

  const participantName = participantProfile ? `${participantProfile.nome} ${participantProfile.sobrenome || ''}`.trim() : 'Conversa';

  const BlurOverlayPortal = () => {
    if (!isMobile || !mensagemAtiva) return null;
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div
        className="chat-blur-overlay-portal"
        onClick={() => setMensagemAtiva(null)}
        aria-hidden="true"
      />,
      document.body
    );
  };

  return (
    <>
      <BlurOverlayPortal />

      <div className={`chat-window ${isStaffChat ? 'staff-chat' : ''}`}>
        <div className="chat-window-header">
          <button onClick={onCloseChat} className="back-button" aria-label="Voltar">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
            </svg>
          </button>
          <img src={participantProfile?.foto_url || 'https://i.imgur.com/SbdJgVb.png'} alt={participantName} />
          <h3>{participantName}</h3>
        </div>

        <div className="mensagens-feed">
          {mensagens.map(msg => {
            const remetenteProfile = msg.remetente;
            const nomeCompleto = remetenteProfile ? `${remetenteProfile.nome} ${remetenteProfile.sobrenome || ''}`.trim() : '';

            const cargoRemetente = remetenteProfile?.cargo?.toLowerCase();
            const isRemetenteAutor = cargoRemetente === 'autor';
            const isRemetenteStaff = ['admin', 'oficialreal', 'guardareal'].includes(cargoRemetente);

            const isActive = mensagemAtiva === msg.id;

            return (
              <div
                key={msg.id}
                onClick={() => setMensagemAtiva(prev => (prev === msg.id ? null : msg.id))}
                className={`mensagem-balao ${msg.remetente_id === user.id ? 'minha' : 'outrem'} ${isRemetenteAutor ? 'autor-bubble' : (isRemetenteStaff ? 'staff-bubble' : '')} ${isActive ? 'active' : ''}`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMensagemAtiva(prev => (prev === msg.id ? null : msg.id)); }}
                aria-pressed={isActive}
              >
                <img
                  src={remetenteProfile?.foto_url || 'https://i.imgur.com/SbdJgVb.png'}
                  alt={nomeCompleto}
                  className="mensagem-avatar"
                />
                <div className="mensagem-conteudo">
                  <span className="remetente-nome">{nomeCompleto}</span>
                  <div className="conteudo-formatado" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.conteudo) }} />
                </div>
              </div>
            );
          })}
          <div ref={mensagensEndRef} />
        </div>

        <form className="mensagem-form" onSubmit={handleEnviarMensagem}>
          <RichTextEditor content={novaMensagem} onChange={setNovaMensagem} />
          <button type="submit" disabled={enviando}>
            {enviando ? 'Enviando...' : 'Enviar'}
          </button>
        </form>
      </div>

      {/* Modal de confirmação/alerta */}
      <ConfirmacaoModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel || (() => setConfirmModal((prev) => ({ ...prev, isOpen: false })))}
      />
    </>
  );
}

export default ChatWindow;