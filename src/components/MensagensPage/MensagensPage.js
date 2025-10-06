import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import ChatWindow from '../ChatWindow/ChatWindow';
import NovaConversaModal from '../NovaConversaModal/NovaConversaModal';
import ContextMenu from '../Shared/ContextMenu/ContextMenu';
import { useModal } from '../../contexts/ModalContext';
import './MensagensPage.css';

function MensagensPage({ user, navigateTo }) {
  const { askConfirmation } = useModal();
  const [conversas, setConversas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeConversaId, setActiveConversaId] = useState(null);
  const [isNewConversationModalOpen, setIsNewConversationModalOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: null,
    conversa: null,
  });
  const longPressTimer = useRef();

  useEffect(() => {
    const handleConversaLida = (event) => {
      const { conversaId } = event.detail;
      setConversas(conversasAtuais =>
        conversasAtuais.map(conversa =>
          conversa.id === conversaId
            ? { ...conversa, unread_count: 0 }
            : conversa
        )
      );
    };
    window.addEventListener('conversaLida', handleConversaLida);
    return () => {
      window.removeEventListener('conversaLida', handleConversaLida);
    };
  }, []);

  async function fetchConversas() {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc('get_visible_conversations_with_pin');
      if (rpcError) throw rpcError;

      // <-- CORREÇÃO 1: Lógica de ordenação completa -->
      // Ordena por múltiplos critérios:
      data.sort((a, b) => {
        // 1. Se 'b' está fixado e 'a' não, 'b' vem primeiro.
        if (b.is_pinned && !a.is_pinned) return 1;
        if (!b.is_pinned && a.is_pinned) return -1;
        
        // 2. Se ambos têm o mesmo status de 'pinned', ordena pela data da última mensagem (mais recente primeiro).
        return new Date(b.last_message_at) - new Date(a.last_message_at);
      });

      setConversas(data || []);
    } catch (err) {
      console.error('Erro em fetchConversas:', err);
      setError('Não foi possível carregar suas conversas.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConversas();
  }, [user]);

  const handleTogglePin = async (conversa, isCurrentlyPinned) => {
    const { error: pinError } = await supabase
      .from('participantes_da_conversa')
      .update({ is_pinned: !isCurrentlyPinned })
      .eq('conversa_id', conversa.id)
      .eq('user_id', user.id);
    if (pinError) {
      alert("Não foi possível alterar a fixação da conversa.");
    } else {
      fetchConversas();
    }
  };

  async function handleDeleteConversa(conversaId) {
    const wantsToDelete = await askConfirmation(
      "Tem certeza que deseja apagar esta conversa? Ela desaparecerá da sua lista, mas a outra pessoa ainda poderá vê-la.",
      "Confirmar Exclusão"
    );
    if (!wantsToDelete) return;

    try {
      const { error: deleteError } = await supabase
        .from('participantes_da_conversa')
        .update({ deleted_at: new Date() })
        .eq('conversa_id', conversaId)
        .eq('user_id', user.id);
      if (deleteError) throw deleteError;

      if (activeConversaId === conversaId) {
        setActiveConversaId(null);
      }
      fetchConversas();
    } catch (err) {
      console.error("Erro ao deletar a conversa:", err);
      alert("Não foi possível apagar a conversa.");
    }
  }

  const handleContextMenu = (event, conversa) => {
    event.preventDefault();
    setContextMenu({ isOpen: true, position: { x: event.clientX, y: event.clientY }, conversa });
  };

  const handleTouchStart = (event, conversa) => {
    longPressTimer.current = setTimeout(() => {
      const touch = event.touches[0];
      setContextMenu({ isOpen: true, position: { x: touch.clientX, y: touch.clientY }, conversa });
    }, 500);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer.current);
  };

  const closeContextMenu = () => {
    setContextMenu({ isOpen: false, position: null, conversa: null });
  };

  return (
    <div className={`mensagens-container ${activeConversaId ? 'chat-ativo' : ''}`}>
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
            const participanteAlvo = outros.length > 0 ? outros[0] : null;
            const profile = participanteAlvo?.profiles;
            const isStaffConv = ['admin', 'oficialreal', 'guardareal', 'autor'].includes(profile?.cargo?.toLowerCase());
            const nomeDisplay = profile ? `${profile.nome} ${profile.sobrenome || ''}`.trim() : 'Conversa';
            const fotoUrl = profile?.foto_url || 'https://i.imgur.com/SbdJgVb.png';

            return (
              <div
                key={conversa.id}
                className={`conversa-item ${conversa.id === activeConversaId ? 'active' : ''} ${isStaffConv ? 'staff-conversa' : ''}`}
                onClick={() => setActiveConversaId(conversa.id)}
                onContextMenu={(e) => handleContextMenu(e, conversa)}
                onTouchStart={(e) => handleTouchStart(e, conversa)}
                onTouchEnd={handleTouchEnd}
                onTouchMove={handleTouchEnd}
              >
                {conversa.is_pinned && <div className="pin-icon">📌</div>}
                <div className="conversa-avatar-wrapper">
                  <img src={fotoUrl} alt={nomeDisplay} onError={(e) => { e.currentTarget.src = 'https://i.imgur.com/SbdJgVb.png'; }} />
                  {conversa.unread_count > 0 && (<span className="unread-badge">{conversa.unread_count}</span>)}
                </div>
                <div className="conversa-info">
                  <span className="conversa-nome">{nomeDisplay}</span>
                  <span className="conversa-preview">Última mensagem...</span>
                </div>
                
                {/* <-- CORREÇÃO 2: Ícone "G" da Staff recolocado aqui --> */}
                {isStaffConv && <div className="staff-g-icon"></div>}
              </div>
            );
          })}
        </div>
      </aside>
      <main className="chat-area">
        {activeConversaId ? (
          (() => {
            const activeConversa = conversas.find(c => c.id === activeConversaId);
            const outros = (activeConversa?.participantes || []).filter(p => p.user_id !== user.id);
            const participanteAlvo = outros.length > 0 ? outros[0] : null;
            const profile = participanteAlvo?.profiles;
            const deletedTimestamp = activeConversa ? activeConversa.my_deleted_at : null;
            const isStaffChat = activeConversa?.participantes?.some(p => ['admin', 'oficialreal', 'guardareal', 'autor'].includes(p.profiles?.cargo?.toLowerCase())) || false;
            return (
              <ChatWindow
                user={user}
                conversaId={activeConversaId}
                deletedTimestamp={deletedTimestamp}
                isStaffChat={isStaffChat}
                participantProfile={profile}
                onCloseChat={() => setActiveConversaId(null)}
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
      <NovaConversaModal user={user} isOpen={isNewConversationModalOpen} onClose={() => setIsNewConversationModalOpen(false)} onNewConversation={() => { setIsNewConversationModalOpen(false); fetchConversas(); }} />
      {contextMenu.isOpen && (
        <ContextMenu
          position={contextMenu.position}
          onClose={closeContextMenu}
          options={[
            {
              label: contextMenu.conversa.is_pinned ? 'Desafixar Conversa' : 'Fixar Conversa',
              action: () => {
                handleTogglePin(contextMenu.conversa, contextMenu.conversa.is_pinned);
                closeContextMenu();
              }
            },
            {
              label: 'Visitar Perfil',
              action: () => {
                const otherParticipant = contextMenu.conversa.participantes.find(p => p.user_id !== user.id);
                if (otherParticipant) {
                  navigateTo('userProfile', { userId: otherParticipant.user_id });
                }
                closeContextMenu();
              }
            },
            {
              label: 'Apagar Conversa',
              className: 'delete-option',
              action: () => {
                handleDeleteConversa(contextMenu.conversa.id);
                closeContextMenu();
              }
            },
          ]}
        />
      )}
    </div>
  );
}

export default MensagensPage;