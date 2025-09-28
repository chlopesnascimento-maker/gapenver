import React,

{ useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './NovaConversaModal.css';

function NovaConversaModal({ user, isOpen, onClose, onNewConversation }) {
  const [allUsers, setAllUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Busca todos os usuários (exceto o próprio) para a lista de busca
  useEffect(() => {
    if (!isOpen) return;

    const fetchAllUsers = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, nome, sobrenome, foto_url')
        .not('id', 'eq', user.id); // Exclui o seu próprio perfil da lista

      if (error) {
        console.error("Erro ao buscar usuários:", error);
      } else {
        setAllUsers(data);
      }
    };
    fetchAllUsers();
  }, [isOpen, user.id]);

 // DENTRO DE NovaConversaModal.js

const handleStartConversation = async () => {
    if (!selectedUser || !message.trim()) {
        setError("Por favor, selecione um destinatário e escreva uma mensagem.");
        return;
    }
    setLoading(true);
    setError('');

    try {
      // 1. Tenta encontrar uma conversa existente entre os dois usuários
      const { data: existingConvoId, error: findError } = await supabase
        .rpc('find_existing_conversation', {
          user1_id: user.id,
          user2_id: selectedUser.id
        });

      if (findError) throw findError;

      // 2. Se encontrou uma conversa antiga...
      if (existingConvoId) {
        // LÓGICA ANTIGA DE "RESSUSCITAR" REMOVIDA!
        // Agora nós apenas inserimos a mensagem. O gatilho faz o resto.
        const { error: messageError } = await supabase
          .from('mensagens')
          .insert({
            conversa_id: existingConvoId,
            remetente_id: user.id,
            conteudo: message.trim()
          });
        
        if (messageError) throw messageError;

      } else {
        // 3. Se não encontrou, cria a conversa e a mensagem do zero.
        const { error: rpcError } = await supabase
          .rpc('create_conversation_with_message', {
            other_user_id: selectedUser.id,
            message_content: message.trim()
          });

        if (rpcError) throw rpcError;
      }

      // 4. Sucesso em ambos os casos.
      // O alert não é mais necessário, a transição para a tela de mensagens é a confirmação.
      onNewConversation(); // Fecha o modal e atualiza a lista de conversas

    } catch (err) {
      console.error("Erro em handleStartConversation:", err);
      setError("Não foi possível enviar a mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Filtra os usuários com base no termo de busca
  const filteredUsers = searchTerm
    ? allUsers.filter(u => 
        `${u.nome} ${u.sobrenome}`.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];
  
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content nc-modal"> {/* nc-modal para estilos específicos */}
        <h2 className="modal-title">Nova Mensagem Privada</h2>

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
                                <img src={u.foto_url || 'URL_PADRAO'} alt={u.nome} />
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
            <textarea 
                rows="6" 
                placeholder="Escreva sua mensagem..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
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