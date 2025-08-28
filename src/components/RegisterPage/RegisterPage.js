import React, { useState, useEffect } from 'react';
import '../Shared/Form.css'; // Usando o nosso CSS compartilhado

function RegisterPage({ navigateTo, setLoading }) {
  const [nome, setNome] = useState('');
  const [sobrenome, setSobrenome] = useState('');
  const [nascimento, setNascimento] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false); // mantém para desabilitar inputs/botão

  // NOVO: Estado para controlar a validação da senha
  const [passwordValidations, setPasswordValidations] = useState({
    minLength: false,
    maxLength: false,
    hasUpper: false,
    hasLower: false,
    hasNumber: false,
  });

  // Efeito que roda toda vez que a senha muda para validar os requisitos
  useEffect(() => {
    const validations = {
      minLength: password.length >= 6,
      maxLength: password.length <= 15,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };

    setPasswordValidations(validations);
  }, [password]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    // Verifica se todos os requisitos da senha foram cumpridos
    const allValid = Object.values(passwordValidations).every(v => v === true);
    if (!allValid) {
      setError('Por favor, cumpra todos os requisitos da senha.');
      return;
    }

    // Campos obrigatórios
    if (!email || !password || !nome || !sobrenome || !nascimento) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    // Ativa loading local + global (livrinho)
    setIsLoading(true);
    if (setLoading) setLoading(true);

    try {
      // 🔹 Aqui antes ia o Firebase
      // Agora só simulamos sucesso
      console.log("Usuário cadastrado (simulação):", {
        nome,
        sobrenome,
        nascimento,
        email
      });

      navigateTo('welcome');
    } catch (error) {
      setError('Ocorreu um erro ao criar a conta. Tente novamente.');
    } finally {
      setIsLoading(false);
      if (setLoading) setLoading(false);
    }
  };
  
  const handleDateInput = (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) value = value.substring(0, 2) + '/' + value.substring(2);
    if (value.length > 5) value = value.substring(0, 5) + '/' + value.substring(5, 9);
    setNascimento(value);
  };

  useEffect(() => {
    const senhaInput = document.getElementById('reg-senha');
    const togglePassword = document.getElementById('toggle-reg-password');
    const capsLockWarning = document.getElementById('reg-caps-lock-warning');
    const eyeIconClosed = togglePassword.querySelector('.eye-icon-closed');
    const eyeIconOpen = togglePassword.querySelector('.eye-icon-open');

    const handleToggle = () => {
      const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
      senhaInput.setAttribute('type', type);
      eyeIconClosed.style.display = (type === 'password') ? 'block' : 'none';
      eyeIconOpen.style.display = (type === 'password') ? 'none' : 'block';
    };

    const handleKeyUp = (event) => {
      capsLockWarning.style.display = event.getModifierState('CapsLock') ? 'block' : 'none';
    };
    
    togglePassword.addEventListener('click', handleToggle);
    senhaInput.addEventListener('keyup', handleKeyUp);

    return () => {
      togglePassword.removeEventListener('click', handleToggle);
      senhaInput.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return (
    <div className="form-page-container">
      <div className="form-container">
        <div className="form-title-container">
          <svg className="title-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"/></svg>
          <svg className="title-icon-svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 2 L12 6 L20 2 L12 22 Z"/></svg>
          <h2 className="form-title">CADASTRE-SE</h2>
          <svg className="title-icon-svg right" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4 2 L12 6 L20 2 L12 22 Z"/></svg>
          <svg className="title-icon-svg right" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2 L15 9 L22 9 L17 14 L19 21 L12 17 L5 21 L7 14 L2 9 L9 9 Z"/></svg>
        </div>

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label htmlFor="reg-nome">NOME:</label>
            <input
              type="text"
              id="reg-nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-sobrenome">SOBRENOME:</label>
            <input
              type="text"
              id="reg-sobrenome"
              value={sobrenome}
              onChange={(e) => setSobrenome(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-nascimento">DATA DE NASCIMENTO (dd/mm/aaaa):</label>
            <input
              type="text"
              id="reg-nascimento"
              maxLength="10"
              value={nascimento}
              onChange={handleDateInput}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-email">E-MAIL:</label>
            <input
              type="email"
              id="reg-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="reg-senha">SENHA:</label>
            <div className="password-wrapper">
              <input
                type="password"
                id="reg-senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <span id="toggle-reg-password" className="toggle-password-icon">
                <svg className="eye-icon-closed" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                <svg className="eye-icon-open" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" style={{display: 'none'}}><path d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z"/></svg>
              </span>
            </div>
            <small id="reg-caps-lock-warning" className="caps-lock-warning">CAPS LOCK ATIVADO</small>

            {/* A lista de requisitos da senha */}
            <ul className="password-requirements">
              <li className={`requirement-item ${passwordValidations.minLength && passwordValidations.maxLength ? 'valid' : 'invalid'}`}>
                Entre 6 e 15 caracteres
              </li>
              <li className={`requirement-item ${passwordValidations.hasUpper ? 'valid' : 'invalid'}`}>
                Pelo menos 1 letra maiúscula
              </li>
              <li className={`requirement-item ${passwordValidations.hasLower ? 'valid' : 'invalid'}`}>
                Pelo menos 1 letra minúscula
              </li>
              <li className={`requirement-item ${passwordValidations.hasNumber ? 'valid' : 'invalid'}`}>
                Pelo menos 1 número
              </li>
            </ul>
          </div>

          {error && <p className="error-message">{error}</p>}
          <p className="terms-text">
            Ao continuar, você concorda com nossos Termos de Uso e nossa Política de Privacidade.
          </p>

          <button
            type="submit"
            onClick={handleRegister}
            className="cta-button"
            disabled={isLoading}
          >
            {isLoading ? 'CADASTRANDO...' : 'CADASTRE-SE AGORA'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
