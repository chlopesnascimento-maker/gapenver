import React, { useState, useEffect } from 'react';
import './EditProfilePage.css';
import '../Shared/Form.css';

import Cropper from 'react-easy-crop';

function EditProfilePage({ navigateTo }) {
  const [newName, setNewName] = useState('');
  const [newSurname, setNewSurname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    maxLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  const [passwordsMatch, setPasswordsMatch] = useState(false);
  const [userData, setUserData] = useState({ nome: "Usuário", sobrenome: "Demo" });

  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    setPasswordValidations({
      minLength: newPassword.length >= 6,
      maxLength: newPassword.length <= 15,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    });
  }, [newPassword]);

  useEffect(() => {
    setPasswordsMatch(newPassword !== '' && newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

  const handleSaveChanges = (e) => {
    e.preventDefault();

    const querMudarNome = newName.trim() !== '' || newSurname.trim() !== '';
    const querMudarSenha = currentPassword.trim() !== '' || newPassword.trim() !== '' || confirmPassword.trim() !== '';

    if (!querMudarNome && !querMudarSenha) {
      setMessage("Nenhum campo preenchido.");
      setMessageType("error");
      return;
    }

    if (querMudarNome && (newName.trim() === '' || newSurname.trim() === '')) {
      setMessage("Preencha Nome e Sobrenome.");
      setMessageType("error");
      return;
    }

    if (querMudarSenha) {
      if (!currentPassword || !newPassword || !confirmPassword) {
        setMessage("Preencha todos os campos de senha.");
        setMessageType("error");
        return;
      }
      if (!passwordsMatch) {
        setMessage("As senhas novas não conferem.");
        setMessageType("error");
        return;
      }
    }

    setUserData({
      ...userData,
      nome: newName || userData.nome,
      sobrenome: newSurname || userData.sobrenome,
    });

    setMessage("Dados salvos (simulação)!");
    setMessageType("success");
    setNewName(""); setNewSurname(""); setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type)) {
      alert('Só aceitamos PNG ou JPEG.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('A imagem deve ter no máximo 2MB.');
      return;
    }
    setSelectedFile(file);
    setShowCropper(true);
  };

  const showCroppedImage = async () => {
    if (!selectedFile || !croppedAreaPixels) return;
    setCroppedImage(URL.createObjectURL(selectedFile));
    setShowCropper(false);
    setUserData((prev) => ({ ...prev, photoURL: URL.createObjectURL(selectedFile) }));
    alert("Foto de perfil atualizada (simulação).");
  };

  return (
    <div className="form-page-container">
      <div className="form-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            {userData?.photoURL ? (
              <img src={userData.photoURL} alt="Avatar" className="avatar-img" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="#e0e0e0">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 
                        1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            )}
            <label htmlFor="avatar-upload" className="avatar-edit-icon">✏️</label>
            <input type="file" id="avatar-upload" accept="image/png, image/jpeg" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
          {userData && <h3 className="profile-username">{userData.nome} {userData.sobrenome}</h3>}
          <h2 className="form-title">Editar Perfil</h2>
        </div>

        {showCropper && selectedFile && (
          <div className="crop-modal-overlay">
            <div className="crop-container">
              <Cropper
                image={URL.createObjectURL(selectedFile)}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={(e) => setZoom(parseFloat(e.target.value))}
                onCropComplete={(croppedArea, croppedPixels) => setCroppedAreaPixels(croppedPixels)}
              />
              <div className="crop-buttons">
                <button type="button" className="cta-button" onClick={showCroppedImage}>CONFIRMAR</button>
                <button type="button" className="cancel-button" onClick={() => setShowCropper(false)}>CANCELAR</button>
              </div>
            </div>
          </div>
        )}

        {message && (
          <p className={`feedback-message ${messageType}`}>
            {message}
          </p>
        )}

        <form onSubmit={handleSaveChanges} className="profile-form">
          <div className="profile-column">
            <h3 className="column-title">Dados Pessoais</h3>
            <div className="form-group">
              <label htmlFor="profile-nome">NOVO NOME:</label>
              <input type="text" id="profile-nome" value={newName} onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="profile-sobrenome">NOVO SOBRENOME:</label>
              <input type="text" id="profile-sobrenome" value={newSurname} onChange={(e) => setNewSurname(e.target.value)} />
            </div>
          </div>

          <div className="profile-column">
            <h3 className="column-title">Alterar Senha</h3>
            <div className="form-group">
              <label htmlFor="profile-password">SENHA ANTIGA:</label>
              <input type="password" id="profile-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="profile-new-password">NOVA SENHA:</label>
              <input type="password" id="profile-new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              <ul className="password-requirements">
                <li className={`requirement-item ${(passwordValidations.minLength && passwordValidations.maxLength) ? 'valid' : 'invalid'}`}>Entre 6 e 15 caracteres</li>
                <li className={`requirement-item ${passwordValidations.hasUpper ? 'valid' : 'invalid'}`}>Pelo menos 1 letra maiúscula</li>
                <li className={`requirement-item ${passwordValidations.hasLower ? 'valid' : 'invalid'}`}>Pelo menos 1 letra minúscula</li>
                <li className={`requirement-item ${passwordValidations.hasNumber ? 'valid' : 'invalid'}`}>Pelo menos 1 número</li>
              </ul>
            </div>
            <div className="form-group">
              <label htmlFor="profile-confirm-password">REPITA A NOVA SENHA:</label>
              <input type="password" id="profile-confirm-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              {confirmPassword && !passwordsMatch && <p className="requirement-item invalid">A senha deve ser igual a de cima</p>}
            </div>
          </div>
        </form>

        <button onClick={handleSaveChanges} className="cta-button">SALVAR ALTERAÇÕES</button>
      </div>
    </div>
  );
}

export default EditProfilePage;
