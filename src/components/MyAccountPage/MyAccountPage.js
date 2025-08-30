import React, { useState, useEffect } from 'react';
import './MyAccountPage.css';
import '../Shared/Form.css';
import { supabase } from '../../supabaseClient'; // Verifique se o caminho está correto

function MyAccountPage({ navigateTo, user: propUser, userData: propUserData }) {
  const [userData, setUserData] = useState(propUserData);
  const [user, setUser] = useState(propUser);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [sendingVerification, setSendingVerification] = useState(false);
  const [loading, setLoading] = useState(!propUser);

  useEffect(() => {
    const fetchUserIfNeeded = async () => {
      if (!user) {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error(error);
          setLoading(false);
          return;
        }
        const currentUser = data?.user ?? null;
        setUser(currentUser);
        setUserData(currentUser?.user_metadata || null);
        setLoading(false);
      }
    };
    fetchUserIfNeeded();
  }, [user]);

  const handleSendVerification = async () => {
    if (!user?.email) return;
    try {
      setSendingVerification(true);
      const { error } = await supabase.auth.resend({ type: 'signup', email: user.email });
      if (error) throw error;
      alert('E-mail de verificação enviado! Verifique sua caixa de entrada e spam.');
    } catch (err) {
      alert('Erro ao enviar e-mail: ' + err.message);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (deleteConfirmText.toUpperCase() !== 'DELETAR') {
      alert('Para confirmar a exclusão, digite DELETAR no campo.');
      return;
    }

    if (!window.confirm("Você tem certeza ABSOLUTA que deseja apagar sua conta? Esta ação não pode ser desfeita.")) {
        return;
    }

    setDeleting(true);
    try {
      // Chama a nossa nova Edge Function
      const { error } = await supabase.functions.invoke('delete-user');

      if (error) throw error;

      alert('Sua conta foi deletada com sucesso. Sentiremos sua falta!');
      await supabase.auth.signOut(); // Desloga o usuário
      navigateTo('home'); // Redireciona para a home

    } catch (err) {
      console.error(err);
      alert('Ocorreu um erro ao deletar sua conta: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) return <div className="form-page-container"><p>Carregando...</p></div>;

  const isVerified = Boolean(user?.email_confirmed_at);

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
    </div>
  );
}

export default MyAccountPage;