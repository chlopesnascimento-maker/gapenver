import React, { useState } from 'react';
import './MyAccountPage.css';
import '../Shared/Form.css';

function MyAccountPage({ navigateTo, user, userData }) {
  const [userDataState, setUserDataState] = useState(userData || null);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [checkingVerification, setCheckingVerification] = useState(false);

  const goToEditProfile = () => {
    if (typeof navigateTo === 'function') {
      navigateTo('editProfile');
    } else {
      console.warn('Função navigateTo não encontrada — passe navigateTo do App.js para MyAccountPage.');
    }
  };

  const handleSendVerification = () => {
    alert('Simulação: e-mail de verificação enviado!');
  };

  const handleCheckVerification = () => {
    setCheckingVerification(true);
    setTimeout(() => {
      alert('Simulação: status de verificação checado.');
      setCheckingVerification(false);
    }, 1500);
  };

  const handleDeleteAccount = (e) => {
    e.preventDefault();
    if (deleteConfirmText !== 'DELETAR') {
      alert('Para confirmar digite: DELETAR');
      return;
    }
    setDeleting(true);
    setTimeout(() => {
      alert('Simulação: conta excluída com sucesso. Você será deslogado.');
      setDeleting(false);
      navigateTo('login');
    }, 2000);
  };

  return (
    <div className="form-page-container">
      <div className="my-account-card">
        <h2 className="form-title">Minha Conta</h2>

        <div className="profile-row">
          <div className="profile-avatar-large">
            {userDataState?.photoURL ? (
              <img src={userDataState.photoURL} alt="Avatar" className="avatar-img"/>
            ) : (
              <div className="avatar-placeholder">
                {userDataState?.nome ? userDataState.nome.charAt(0).toUpperCase() : ''}
              </div>
            )}
          </div>

          <div className="profile-info">
            <p><strong>Nome:</strong> {(userDataState?.nome || '—') + (userDataState?.sobrenome ? ' ' + userDataState.sobrenome : '')}</p>
            <p><strong>E-mail:</strong> {user?.email || '—'}</p>
            <p><strong>Criado em:</strong> {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('pt-BR') : '—'}</p>
            <div className="profile-actions">
              <button
                className="cta-button"
                onClick={goToEditProfile}
              >
                EDITAR PERFIL
              </button>
            </div>
          </div>
        </div>

        <hr />

        <section className="security-section">
          <h3>Segurança</h3>
          <div className="verification-row">
            <p>E-mail verificado: {user?.emailVerified ? 'Sim' : 'Não'}</p>
            {!user?.emailVerified && (
              <>
                <button className="secondary-button" onClick={handleSendVerification}>
                  Enviar e-mail de verificação
                </button>
                <button
                  className="secondary-button"
                  onClick={handleCheckVerification}
                  disabled={checkingVerification}
                >
                  {checkingVerification ? 'Verificando...' : 'Checar status'}
                </button>
              </>
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
            />
          </div>
          <button
            className="danger-button"
            onClick={handleDeleteAccount}
            disabled={deleting || deleteConfirmText !== 'DELETAR'}
          >
            {deleting ? 'Apagando...' : 'Apagar minha conta'}
          </button>
        </section>
      </div>
    </div>
  );
}

export default MyAccountPage;
