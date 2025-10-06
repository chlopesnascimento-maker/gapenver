import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './EditUserModal.css'; 

function EditUserModal({ userToEdit, currentUserRole, isOpen, onClose, onUpdateSuccess }) {
  const [editedNome, setEditedNome] = useState('');
  const [editedSobrenome, setEditedSobrenome] = useState('');
  const [editedPassword, setEditedPassword] = useState('');
  const [editedRole, setEditedRole] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [editedTitulo, setEditedTitulo] = useState('');

  useEffect(() => {
    if (userToEdit) {
      const data = userToEdit.user_metadata ? userToEdit.user_metadata : userToEdit;
      setEditedNome(data.nome || '');
      setEditedSobrenome(data.sobrenome || '');
      setEditedRole(data.cargo || 'default');
      setEditedTitulo(data.titulo || ''); 
      setEditedPassword('');
    }
  }, [userToEdit]);

  const handleUpdateUser = async () => {
    if (!userToEdit) return;
    setIsUpdating(true);
    try {
      const updates = { 
        nome: editedNome, 
        sobrenome: editedSobrenome,
        titulo: editedTitulo
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
  // <-- ALTERAÇÃO 1: Permite que 'autor' veja a mesma lista de cargos que o 'admin'
  if (['admin', 'autor'].includes(currentUserRole)) {
    roleOptions = (
      <>
        <option value="admin">Admin</option>
        <option value="oficialreal">Oficial Real</option>
        <option value="guardareal">Guarda Real</option>
        <option value="viajante">Viajante</option>
        <option value="banidos">Banido</option>
        <option value="default">Default</option>
        {/* Note que a opção "autor" não está aqui de propósito */}
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

        {/* <-- ALTERAÇÃO 2: Permite que 'autor' veja e edite o campo de Título */}
        {['admin', 'autor'].includes(currentUserRole) && (
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

        {/* <-- ALTERAÇÃO 3: Permite que 'autor' veja e edite o campo de Senha */}
        {['admin', 'autor'].includes(currentUserRole) && (
          <div className="form-group">
            <label>Nova Senha (deixe em branco para não alterar):</label>
            <input type="password" value={editedPassword} onChange={(e) => setEditedPassword(e.target.value)} placeholder="••••••••" />
          </div>
        )}
        
        {/* A lógica aqui já funciona corretamente com a mudança em 'roleOptions' */}
        {(currentUserRole === 'admin' || currentUserRole === 'oficialreal' || currentUserRole === 'guardareal' || currentUserRole === 'autor') && (
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