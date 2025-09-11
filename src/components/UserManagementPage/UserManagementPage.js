import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './UserManagementPage.css';
import EditUserModal from '../EditUserModal/EditUserModal';

function UserManagementPage({ navigateTo, user }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState("default");
    
  const roleHierarchy = {
    admin: 1,
    oficialreal: 2,
    guardareal: 3,
    viajante: 4,
    banidos: 5,
    default: 99
  };

  const fetchUsers = async () => {
    // Garantimos que o loading seja ativado no início de cada busca
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? null;
      const invokeOpts = {
        method: 'GET',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      };
      const { data, error: functionError } = await supabase.functions.invoke('list-users', invokeOpts);
      if (functionError) {
        throw new Error(functionError.message || 'Erro ao buscar usuários.');
      }
      const fetchedUsers = data || [];
      const sortedUsers = fetchedUsers.sort((a, b) => {
        const roleA = a.user_metadata?.cargo?.toLowerCase() || 'default';
        const roleB = b.user_metadata?.cargo?.toLowerCase() || 'default';
        const rankA = roleHierarchy[roleA] || roleHierarchy['default'];
        const rankB = roleHierarchy[roleB] || roleHierarchy['default'];
        return rankA - rankB;
      });
      setUsers(sortedUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userEmail) => {
    if (!window.confirm(`Você tem certeza que deseja deletar o usuário ${userEmail}? Esta ação é irreversível.`)) {
      return;
    }
    try {
      const { error } = await supabase.functions.invoke('delete-user-by-admin', {
        body: { user_id: userId },
      });
      if (error) throw error;
      setUsers(currentUsers => currentUsers.filter(u => u.id !== userId));
    } catch (err) {
      alert(`Falha ao deletar usuário: ${err.message}`);
    }
  };

  // ESTE useEffect RODA APENAS UMA VEZ E É RESPONSÁVEL PELO LOAD INICIAL
  useEffect(() => {
    const checkRoleAndFetch = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setError('Usuário não autenticado.');
            setLoading(false);
            return;
        }

        const role = (session.user.app_metadata?.roles?.[0] || '').toLowerCase();
        const ALLOWED_ROLES = ['admin', 'oficialreal', 'guardareal'];
        
        if (ALLOWED_ROLES.includes(role)) {
            fetchUsers();
        } else {
            setError('Acesso negado.');
            setLoading(false);
        }
    };
    checkRoleAndFetch();
  }, []); // A array vazia [] garante que ele só rode na montagem do componente.

  // ESTE useEffect APENAS ATUALIZA O CARGO DO USUÁRIO ATUAL. ELE NÃO BUSCA DADOS.
  // ISSO CORRIGE O LOOP INFINITO.
  useEffect(() => {
    if (user) {
      const userRole = (user.app_metadata?.roles?.[0] || 'default').toLowerCase();
      setCurrentUserRole(userRole);
    }
  }, [user]);

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUpdateSuccess = () => {
    setIsEditModalOpen(false);
    fetchUsers(); // Recarrega a lista de usuários após o sucesso da edição
  }
  
  if (loading) return <div className="user-management-container"><p>Carregando usuários...</p></div>;
  if (error) return <div className="user-management-container"><p className="error-message">Erro: {error}</p></div>;

  return (
    <div className="user-management-container">
      <div className="admin-page-header">
        <h1 className="admin-title">Gerenciamento de Usuários</h1>
        <button className="secondary-button" onClick={() => navigateTo('adminDashboard')}>
          &larr; Voltar ao Painel
        </button>
      </div>

      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Nome</th>
              <th>Sobrenome</th>
              <th>Cargo</th>
              <th>Foto</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => {
                const targetRole = u.user_metadata?.cargo?.toLowerCase() || 'default';
                return (
                  <tr key={u.id}>
                    <td>{u.email || 'N/A'}</td>
                    <td>{u.user_metadata?.nome || 'N/A'}</td>
                    <td>{u.user_metadata?.sobrenome || 'N/A'}</td>
                    <td>
                      <span className={`role-badge role-${targetRole}`}>
                        {u.user_metadata?.cargo || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {u.user_metadata?.foto_url ? (
                        <img src={u.user_metadata.foto_url} alt={u.user_metadata.nome} width="40" height="40" style={{ borderRadius: '50%' }} />
                      ) : ( 'Sem foto' )}
                    </td>
                    <td className="actions-cell">
                      {(() => {
                        const callerRank = roleHierarchy[currentUserRole] || roleHierarchy.default;
                        const targetRank = roleHierarchy[targetRole];
                        const canEdit = (callerRank < targetRank) || (currentUserRole === 'admin' && targetRole === 'admin');
                        if (canEdit) {
                          return (
                            <button className="action-button edit-button" title="Editar usuário" onClick={() => handleOpenEditModal(u)}>
                              ✏️
                            </button>
                          );
                        }
                        return null;
                      })()}
                      {currentUserRole === 'admin' && (
                        <button className="action-button delete-button" title="Deletar usuário" onClick={() => handleDeleteUser(u.id, u.email)}>
                          🗑️
                        </button>
                      )}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr><td colSpan="6" style={{ textAlign: 'center' }}>Nenhum usuário encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {editingUser && (
        <EditUserModal
          userToEdit={editingUser}
          currentUserRole={currentUserRole}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onUpdateSuccess={handleUpdateSuccess}
        />
      )}
    </div>
  );
}

export default UserManagementPage;