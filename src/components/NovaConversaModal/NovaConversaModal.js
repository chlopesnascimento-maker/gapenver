import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './NovaConversaModal.css';
import RichTextEditor from '../RichTextEditor/RichTextEditor';


function NovaConversaModal({ user, isOpen, onClose, onNewConversation }) {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Busca todos os usuários, agora com o cargo, e aplica a regra "Whisper Off"
  useEffect(() => {
    if (!isOpen) return;

    const fetchAllUsers = async () => {
      // Pega o cargo do usuário logado
      const { data: callerProfile } = await supabase.from('profiles').select('cargo').eq('id', user.id).single();
      const callerRole = callerProfile?.cargo;

      // Busca todos os outros usuários com seus cargos
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, foto_url, cargo')
        .not('id', 'eq', user.id);

      if (error) {
        console.error("Erro ao buscar usuários:", error);
      } else {
        // ===== REGRA "WHISPER OFF" APLICADA AQUI =====
        const filteredData = data.filter(profile => {
          // Se o perfil na lista for o 'autor'...
          if (profile.cargo === 'autor') {
            // ...só o mostre se quem está buscando for um 'admin'.
            return callerRole === 'admin';
          }
          // Todos os outros perfis são sempre mostrados.
          return true;
        });
        setAllUsers(filteredData);
      }
    };
    fetchAllUsers();
  }, [isOpen, user.id]);

  const handleStartConversation = async () => {
    if (!selectedUser || !message.trim()) {
      setError("Por favor, selecione um destinatário e escreva uma mensagem.");
      return;
    }
    setLoading(true);
    setError('');

    try {
        const { data: callerProfile } = await supabase.from('profiles').select('cargo').eq('id', user.id).single();
        const isAutor = callerProfile?.cargo === 'autor';

        // Tenta encontrar uma conversa existente primeiro
        const { data: existingConvoId, error: findError } = await supabase
            .rpc('find_existing_conversation', { user1_id: user.id, user2_id: selectedUser.id });

        if (findError) throw findError;

        if (existingConvoId) {
            // Se a conversa já existe, apenas envia a mensagem usando a função segura
            const { error: messageError } = await supabase.functions.invoke('send-private-message', {
                body: { conversa_id: existingConvoId, conteudo: message.trim() },
            });
            if (messageError) throw new Error(messageError.message);

        } else {
            // Se não existe, cria a conversa usando a nova RPC com a flag de permissão
            const { error: rpcError } = await supabase
                .rpc('create_conversation_with_message_and_flag', {
                    other_user_id: selectedUser.id,
                    message_content: message.trim(),
                    is_autor_initiating: isAutor // A "chave" que destrava a conversa!
                });
            if (rpcError) throw rpcError;
        }

        onNewConversation(); // Sucesso, fecha o modal e atualiza a lista

    } catch (err) {
      console.error("Erro em handleStartConversation:", err);
      setError(`Não foi possível enviar a mensagem. ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = searchTerm
    ? allUsers.filter(u => `${u.nome} ${u.sobrenome}`.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content nc-modal">
        <h2 className="modal-title">Nova Mensagem Privada</h2>
        <p className="modal-subtitle">Mensagens privadas são criptografadas, em caso de abuso, denuncie.</p>
        <div className="form-group">
            <label>Para:</label>
            {selectedUser ? (
                <div className="selected-user">
                    <span>{selectedUser.nome} {selectedUser.sobrenome}</span>
                    <button onClick={() => { setSelectedUser(null); setSearchTerm(''); }}>&times;</button>
                </div>
            ) : (
                <input 
                    type="text"
                    placeholder="Buscar por nome..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            )}
            
            {searchTerm && !selectedUser && (
                <div className="search-results">
                    {filteredUsers.length > 0 ? (
                        filteredUsers.map(u => (
                            <div key={u.id} className="result-item" onClick={() => { setSelectedUser(u); setSearchTerm(''); }}>
                                <img src={u.foto_url || 'https://i.imgur.com/SbdJgVb.png'} alt={u.nome} />
                                <span>{u.nome} {u.sobrenome}</span>
                            </div>
                        ))
                    ) : (
                        <p>Nenhum usuário encontrado.</p>
                    )}
                </div>
            )}
        </div>

        <div className="form-group">
            <label>Mensagem:</label>
            {/* <-- MUDANÇA 2: Substituímos a <textarea> pelo RichTextEditor --> */}
            <RichTextEditor
                content={message}
                onChange={setMessage}
            />
        </div>
        {error && <p className="error-message small-error">{error}</p>}
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose} disabled={loading}>Cancelar</button>
          <button className="save-button" onClick={handleStartConversation} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar Mensagem'}
          </button>
        </div>
      </div>
    </div>
  );
}
export default NovaConversaModal;