import React, { useState, useEffect, useCallback } from 'react';
import './MyAccountPage.css';
import '../Shared/Form.css';
import { supabase } from '../../supabaseClient';
import ConfirmacaoModal from '../Shared/ConfirmacaoModal/ConfirmacaoModal';

function MyAccountPage({ navigateTo }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);

  // Modal de confirmação/alerta
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

  // Função utilitária para confirmação
  const askConfirmation = (message) => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        message,
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          resolve(false);
        },
      });
    });
  };

  const fetchUserData = useCallback(async () => {
    setLoading(true);

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser) {
      console.error('Erro ao buscar usuário:', authError);
      setLoading(false);
      return;
    }
    setUser(authUser);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('nome, sobrenome, foto_url')
      .eq('id', authUser.id)
      .single();

    if (profileError) {
      console.error('Erro ao buscar perfil na tabela:', profileError);
    }
    
    const finalUserData = {
      nome: authUser.user_metadata?.nome || profileData?.nome,
      sobrenome: authUser.user_metadata?.sobrenome || profileData?.sobrenome,
      photoURL: authUser.user_metadata?.photoURL || profileData?.foto_url,
      aboutMe: authUser.user_metadata?.aboutMe || ''
    };
    
    setUserData(finalUserData);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleSendVerification = async () => {
    if (!user?.email) return;
    try {
      setSendingVerification(true);
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (error) throw error;
      showAlert('E-mail de verificação enviado! Verifique sua caixa de entrada e spam.');
    } catch (err) {
      showAlert('Erro ao enviar e-mail: ' + err.message);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmText.toUpperCase() !== 'DELETAR') {
      showAlert('Para confirmar a exclusão, digite DELETAR no campo.');
      return;
    }
    const confirmed = await askConfirmation("Você tem certeza ABSOLUTA que deseja apagar sua conta? Esta ação não pode ser desfeita.");
    if (!confirmed) return;
    setDeleting(true);
    try {
      const { error } = await supabase.functions.invoke('delete-user');
      if (error) throw error;
      showAlert('Sua conta foi deletada com sucesso. Sentiremos sua falta!');
      await supabase.auth.signOut();
      navigateTo('home');
    } catch (err) {
      console.error(err);
      showAlert('Ocorreu um erro ao deletar sua conta: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };
  
  if (loading) return <div className="form-page-container"><p>Carregando...</p></div>;

  const isVerified = Boolean(user?.email_confirmed_at);
  
  let roleDisplay = null;
  const userRoles = user?.app_metadata?.roles;

  if (userRoles && userRoles.length > 0) {
    const primaryRole = userRoles[0];
    if (primaryRole === 'admin') {
      roleDisplay = { name: 'Administrador', style: { color: '#e74c3c', fontWeight: 'bold' } };
    } else if (primaryRole === 'viajante') {
      roleDisplay = { name: 'Viajante', style: { color: '#3498db', fontWeight: 'bold' } };
    } else if (primaryRole === 'oficialreal') {
      roleDisplay = { name: 'Oficial Real', style: { color: '#f39c12', fontWeight: 'bold' } };
    } else if (primaryRole === 'moderadores') {
      roleDisplay = { name: 'Moderador', style: { color: '#2ecc71', fontWeight: 'bold' } };
    } else {
      roleDisplay = { name: primaryRole, style: { fontWeight: 'normal' } };
    }
  }

  return (
    <div className="form-page-container">
      <div className="my-account-card">
        <h2 className="form-title">Minha Conta</h2>

        <div className="profile-row">
          <div className="profile-avatar-large">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-placeholder">
                {userData?.nome ? userData.nome.charAt(0).toUpperCase() : '?'}
              </div>
            )}
          </div>
          

          <div className="profile-info">
            <p><strong>Nome:</strong> {`${userData?.nome || ''} ${userData?.sobrenome || ''}`.trim()}</p>
            {roleDisplay && (
              <p>
                <strong>Título:</strong> <span style={roleDisplay.style}>{roleDisplay.name}</span>
              </p>
            )}
            <p><strong>E-mail:</strong> {user?.email || '—'}</p>
            <p><strong>Criado em:</strong> {user?.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : '—'}</p>
            
              <div className="profile-actions">
              <button className="cta-button" onClick={() => navigateTo('editProfile')}>
                EDITAR PERFIL
              </button>
            </div>
          </div>
        </div>

        <hr />


        <section className="security-section">
          <h3>Segurança</h3>
          <div className="verification-row">
            <p>E-mail verificado: {isVerified ? 'Sim' : 'Não'}</p>
            {!isVerified && (
              <button
                className="secondary-button"
                onClick={handleSendVerification}
                disabled={sendingVerification}
              >
                {sendingVerification ? 'Enviando...' : 'Reenviar e-mail de verificação'}
              </button>
            )}
          </div>
        </section>

        <hr />

        <section className="danger-section">
          <h3>Apagar Conta</h3>
          <p className="warning">Esta ação é irreversível e removerá todos os seus dados.</p>
          <div className="form-group">
            <label>Digite <strong>DELETAR</strong> para confirmar:</label>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="DELETAR"
            />
          </div>
          <button
            className="danger-button"
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirmText.toUpperCase() !== 'DELETAR'}
          >
            {deleting ? 'Processando...' : 'Apagar minha conta'}
          </button>
        </section>
      </div>
      {/* Modal de confirmação/alerta */}
      <ConfirmacaoModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel || (() => setConfirmModal((prev) => ({ ...prev, isOpen: false })))}
      />
    </div>
  );
}

export default MyAccountPage;