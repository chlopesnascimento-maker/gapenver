import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './EditUserModal.css'; 

function EditUserModal({ userToEdit, currentUserRole, isOpen, onClose, onUpdateSuccess }) {
  const [editedNome, setEditedNome] = useState('');
  const [editedSobrenome, setEditedSobrenome] = useState('');
  const [editedPassword, setEditedPassword] = useState('');
  const [editedRole, setEditedRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // NOVO: Criamos um estado para o novo campo de título
  const [editedTitulo, setEditedTitulo] = useState('');

  useEffect(() => {
    if (userToEdit) {
      const data = userToEdit.user_metadata ? userToEdit.user_metadata : userToEdit;

      setEditedNome(data.nome || '');
      setEditedSobrenome(data.sobrenome || '');
      setEditedRole(data.cargo || 'default');
      
      // NOVO: Populamos o estado do título com o valor do perfil
      setEditedTitulo(data.titulo || ''); 
      
      setEditedPassword('');
    }
  }, [userToEdit]);

  const handleUpdateUser = async () => {
    if (!userToEdit) return;
    setIsUpdating(true);
    try {
      // ALTERADO: Adicionamos o 'titulo' ao objeto de atualizações
      const updates = { 
        nome: editedNome, 
        sobrenome: editedSobrenome,
        titulo: editedTitulo // O título será enviado para a sua função Supabase
      };

      const { error } = await supabase.functions.invoke('update-user-by-admin', {
        body: { 
          user_id: userToEdit.id, 
          updates: updates,
          new_role: editedRole 
        },
      });

      if (error) throw error;
      alert('Usuário atualizado com sucesso!');
      onUpdateSuccess();
    } catch (err) {
      alert(`Falha ao atualizar usuário: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  let roleOptions = null;
  if (currentUserRole === 'admin') {
    roleOptions = (
      <>
        <option value="admin">Admin</option>
        <option value="oficialreal">Oficial Real</option>
        <option value="guardareal">Guarda Real</option>
        <option value="viajante">Viajante</option>
        <option value="banidos">Banido</option>
        <option value="default">Default</option>
      </>
    );
  } else if (currentUserRole === 'oficialreal' || currentUserRole === 'guardareal') {
    roleOptions = (
      <>
        <option value="viajante">Viajante</option>
        <option value="banidos">Banido</option>
      </>
    );
  }

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="modal-title">
          Editando: {userToEdit.user_metadata?.nome || userToEdit.nome} {userToEdit.user_metadata?.sobrenome || userToEdit.sobrenome}
        </h2>
        <div className="form-group">
          <label>Nome:</label>
          <input type="text" value={editedNome} onChange={(e) => setEditedNome(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Sobrenome:</label>
          <input type="text" value={editedSobrenome} onChange={(e) => setEditedSobrenome(e.target.value)} />
        </div>

        {/* NOVO: Campo de Título, visível apenas para admins */}
        {currentUserRole === 'admin' && (
          <div className="form-group">
            <label>Título (visível apenas para Staff):</label>
            <input 
              type="text" 
              value={editedTitulo} 
              onChange={(e) => setEditedTitulo(e.target.value)} 
              placeholder="Ex: Rei de Gápenver"
            />
          </div>
        )}

        {currentUserRole === 'admin' && (
          <div className="form-group">
            <label>Nova Senha (deixe em branco para não alterar):</label>
            <input type="password" value={editedPassword} onChange={(e) => setEditedPassword(e.target.value)} placeholder="••••••••" />
          </div>
        )}
        {(currentUserRole === 'admin' || currentUserRole === 'oficialreal' || currentUserRole === 'guardareal') && (
          <div className="form-group">
            <label>Cargo:</label>
            <select value={editedRole} onChange={(e) => setEditedRole(e.target.value)}>
              {roleOptions}
            </select>
          </div>
        )}
        <div className="modal-actions">
          <button className="cancel-button" onClick={onClose} disabled={isUpdating}>Cancelar</button>
          <button className="save-button" onClick={handleUpdateUser} disabled={isUpdating}>
            {isUpdating ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EditUserModal;