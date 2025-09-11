import React, { useState, useEffect, useRef } from 'react';
import './EditProfilePage.css'; // Supondo que você tenha um CSS para esta página
import '../Shared/Form.css';
import { supabase } from '../../supabaseClient';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../../utils/cropUtils'; // Supondo que você tenha este utilitário

function EditProfilePage({ navigateTo, onProfileUpdate }) {
  // --- ESTADOS EXISTENTES ---
  const [newName, setNewName] = useState('');
  const [newSurname, setNewSurname] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userData, setUserData] = useState({ nome: '', sobrenome: '', photoURL: null });
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // --- ESTADOS PARA O CROPPER DE IMAGEM ---
  const [imageSrc, setImageSrc] = useState(null); // url do arquivo selecionado para o cropper (object url)
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImageBlob, setCroppedImageBlob] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  // --- preview separado (object url) para exibição local antes do upload remoto ---
  const [previewURL, setPreviewURL] = useState(null);

  // refs para armazenar os object URLs atuais e poder revogar
  const imageObjectUrlRef = useRef(null);
  const previewObjectUrlRef = useRef(null);

  // --- NOVOS ESTADOS PARA O PERFIL DO REINO ---
  const [reino, setReino] = useState('Reinos Independentes');
  const [nota, setNota] = useState('');
  const [sobreMim, setSobreMim] = useState('');

  // --- ESTADOS DE VALIDAÇÃO DE SENHA ---
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false, maxLength: false, hasUpper: false,
    hasLower: false, hasNumber: false,
  });
  const [passwordsMatch, setPasswordsMatch] = useState(false);

  // --- constante de tamanho máximo (2 MB) ---
  const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Pega dados rápidos do metadata
        setUserData({
          nome: user.user_metadata?.nome || '',
          sobrenome: user.user_metadata?.sobrenome || '',
          photoURL: user.user_metadata?.photoURL || null,
        });

        // Pega dados completos da tabela profiles
        const { data: profile } = await supabase
          .from('profiles')
          .select('reino, sobre_mim')
          .eq('id', user.id)
          .single();

        if (profile) {
          setReino(profile.reino || 'Reinos Independentes');
          setSobreMim(profile.sobre_mim || '');
        }
      }
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    setPasswordValidations({
      minLength: newPassword.length >= 6, maxLength: newPassword.length <= 15,
      hasUpper: /[A-Z]/.test(newPassword), hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
    });
  }, [newPassword]);

  useEffect(() => {
    setPasswordsMatch(newPassword !== '' && newPassword === confirmPassword);
  }, [newPassword, confirmPassword]);

  // cleanup final: revoga quaisquer object URLs remanescentes quando o componente desmontar
  useEffect(() => {
    return () => {
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
        imageObjectUrlRef.current = null;
      }
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  const handleSaveChanges = async (e) => {
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    setMessage(null);
    setMessageType(null);
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não encontrado.");

      let publicUrl = userData.photoURL;

      // guarda valor anterior para poder reverter preview se necessário
      const previousPreview = previewURL;
      const previousPhotoURL = userData.photoURL;

      if (croppedImageBlob) {
        // gera filePath único
        const filePath = `${user.id}/${Date.now()}_avatar.jpeg`;

        // upload - blob funciona, mas informo tipo para evitar surpresas
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, croppedImageBlob, { upsert: true, contentType: croppedImageBlob.type || 'image/jpeg' });

        if (uploadError) {
          // se o upload falhar, desfazemos a preview local e informamos o erro
          // revoga preview object url se existir
          if (previewObjectUrlRef.current) {
            URL.revokeObjectURL(previewObjectUrlRef.current);
            previewObjectUrlRef.current = null;
          }
          setPreviewURL(previousPhotoURL); // volta para a URL anterior (pode ser null)
          setCroppedImageBlob(null);
          throw uploadError;
        }

        // Obtem publicUrl do arquivo enviado
        const { data: { publicUrl: supaPublicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
        publicUrl = supaPublicUrl;
      }

      // Prepara os updates para a tabela 'profiles'
      const profileUpdates = {
        reino,
        nota,
        sobre_mim: sobreMim,
        nota_expires_at: nota ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null
      };
      if (newName.trim()) profileUpdates.nome = newName.trim();
      if (newSurname.trim()) profileUpdates.sobrenome = newSurname.trim();
      if (publicUrl !== userData.photoURL) profileUpdates.foto_url = publicUrl;

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', user.id);
      if (profileError) throw profileError;

      // Prepara os updates para 'user_metadata' para manter a sincronia
      const authUpdates = {};
      if (newName.trim()) authUpdates.nome = newName.trim();
      if (newSurname.trim()) authUpdates.sobrenome = newSurname.trim();
      if (publicUrl !== userData.photoURL) authUpdates.photoURL = publicUrl;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await supabase.auth.updateUser({ data: authUpdates });
        if (authError) throw authError;
        if (onProfileUpdate) onProfileUpdate(authUpdates);
        setUserData(prev => ({ ...prev, ...authUpdates }));
      } else if (publicUrl !== userData.photoURL) {
        // se apenas publicUrl mudou e não havia outros metadata, atualiza localmente
        setUserData(prev => ({ ...prev, photoURL: publicUrl }));
      }

      // Senha
      if (newPassword) {
        if (!passwordsMatch) throw new Error("As senhas novas não conferem.");
        const { error: passError } = await supabase.auth.updateUser({ password: newPassword });
        if (passError) throw passError;
      }

      // Sucesso: revogar quaisquer objectURLs temporárias (visuais) e limpar estados
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
        imageObjectUrlRef.current = null;
      }
      if (previewObjectUrlRef.current) {
        // a preview local provavelmente foi usada apenas para visual; revogamos e limpamos
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
      setPreviewURL(null);
      setCroppedImageBlob(null);

      setMessage("Alterações salvas com sucesso!");
      setMessageType("success");

      // Limpa campos após salvar
      setNewName(""); setNewSurname(""); setCurrentPassword("");
      setNewPassword(""); setConfirmPassword("");
      setNota('');
    } catch (err) {
      console.error(err);
      setMessage(err.message || "Erro ao salvar alterações.");
      setMessageType("error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validação de tamanho (2MB)
    if (file.size > MAX_FILE_SIZE) {
      setMessage("Arquivo muito grande. O tamanho máximo permitido é 2 MB.");
      setMessageType("error");
      // limpa input (se quiser forçar)
      e.target.value = null;
      return;
    }

    // somente aceitar imagens (defensivo)
    if (!file.type.startsWith('image/')) {
      setMessage("Formato inválido. Selecione uma imagem.");
      setMessageType("error");
      e.target.value = null;
      return;
    }

    // revoga object url anterior do imageSrc, se houver
    if (imageObjectUrlRef.current) {
      URL.revokeObjectURL(imageObjectUrlRef.current);
      imageObjectUrlRef.current = null;
    }

    const objectUrl = URL.createObjectURL(file);
    imageObjectUrlRef.current = objectUrl;
    setImageSrc(objectUrl);
    setShowCropper(true);

    // limpa mensagens antigas
    setMessage(null);
    setMessageType(null);
  };

  const showCroppedImage = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedBlob) throw new Error("Erro ao gerar imagem recortada.");

      // revogar preview anterior se existir
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }

      const previewObjectUrl = URL.createObjectURL(croppedBlob);
      previewObjectUrlRef.current = previewObjectUrl;
      setPreviewURL(previewObjectUrl);
      setCroppedImageBlob(croppedBlob);

      // fechamos cropper
      setShowCropper(false);
    } catch (e) {
      console.error(e);
      setMessage("Erro ao processar a imagem recortada.");
      setMessageType("error");
      setShowCropper(false);
    } finally {
      // revogar imageSrc (arquivo selecionado) pois já temos o blob recortado como preview
      if (imageObjectUrlRef.current) {
        URL.revokeObjectURL(imageObjectUrlRef.current);
        imageObjectUrlRef.current = null;
      }
      setImageSrc(null);
    }
  };

  return (
    <div className="form-page-container">
      <div className="form-container">
        <div className="profile-header">
          <div className="profile-avatar-large">
            { (previewURL || userData?.photoURL) ? (
              <img src={previewURL || userData.photoURL} alt="Avatar" className="avatar-img" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="#e0e0e0"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            )}
            <label htmlFor="avatar-upload" className="avatar-edit-icon">✏️</label>
            <input type="file" id="avatar-upload" accept="image/png, image/jpeg, image/webp" style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
          {userData && <h3 className="profile-username">{userData.nome} {userData.sobrenome}</h3>}
          <h2 className="form-title">Editar Perfil</h2>
        </div>

        {showCropper && imageSrc && (
          <div className="crop-modal-overlay">
            <div className="crop-container">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(area, pixels) => setCroppedAreaPixels(pixels)}
                showGrid={true}
              />
              <div className="zoom-slider">
                <input type="range" min={1} max={3} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))}/>
              </div>
              <div className="crop-buttons">
                <button type="button" className="cta-button" onClick={showCroppedImage}>CONFIRMAR</button>
                <button type="button" className="cancel-button" onClick={() => {
                  // revoga imageSrc se cancelar
                  if (imageObjectUrlRef.current) {
                    URL.revokeObjectURL(imageObjectUrlRef.current);
                    imageObjectUrlRef.current = null;
                  }
                  setImageSrc(null);
                  setShowCropper(false);
                }}>CANCELAR</button>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSaveChanges} className="profile-form">
          {/* --- COLUNA 1: DADOS PESSOAIS --- */}
          <div className="profile-column">
            <h3 className="column-title">Dados Pessoais</h3>
            <div className="form-group">
              <label htmlFor="profile-nome">NOVO NOME:</label>
              <input type="text" id="profile-nome" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={userData.nome || "Seu nome"}/>
            </div>
            <div className="form-group">
              <label htmlFor="profile-sobrenome">NOVO SOBRENOME:</label>
              <input type="text" id="profile-sobrenome" value={newSurname} onChange={(e) => setNewSurname(e.target.value)} placeholder={userData.sobrenome || "Seu sobrenome"}/>
            </div>
             <div className="form-group">
              <label htmlFor="profile-about">SOBRE MIM (máx. 400 caracteres):</label>
              <textarea id="profile-about" maxLength={400} rows={4} value={sobreMim} onChange={(e) => setSobreMim(e.target.value)} placeholder="Escreva um pouco sobre você..."/>
              <p style={{ fontSize: '12px', color: '#888' }}>{sobreMim.length}/400 caracteres</p>
            </div>
          </div>

          {/* --- NOVA COLUNA 2: IDENTIDADE DO REINO --- */}
          <div className="profile-column">
            <h3 className="column-title">Identidade do Reino</h3>
            <div className="form-group">
              <label htmlFor="reino">SEU REINO PRINCIPAL:</label>
              <select id="reino" value={reino} onChange={(e) => setReino(e.target.value)}>
                <option value="Reinos Independentes">Reinos Independentes</option>
                <option value="Gapenver">Gapenver</option>
                <option value="Saraver">Saraver</option>
                <option value="Corvusk">Corvusk</option>
                <option value="Lo'otrak">Lo'otrak</option>
              </select>
            </div>
             <div className="form-group">
              <label htmlFor="nota">NOTA (dura 24h):</label>
              <input id="nota" type="text" value={nota} onChange={(e) => setNota(e.target.value)} maxLength="60" placeholder="Deixe um pensamento..."/>
            </div>

          </div>

          {/* --- COLUNA 3: ALTERAR SENHA --- */}
          <div className="profile-column">
            <h3 className="column-title">Alterar Senha</h3>
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

        <button onClick={handleSaveChanges} className="cta-button" disabled={isLoading}>
          {isLoading ? 'SALVANDO...' : 'SALVAR ALTERAÇÕES'}
        </button>

        {message && (<p className={`feedback-message ${messageType}`}>{message}</p>)}
      </div>
    </div>
  );
}

export default EditProfilePage;
