import React, { useState, useEffect } from 'react';
import '../Shared/Form.css'; // Reutilizando nosso CSS de formulário

function LoginPage({ navigateTo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    // 🔹 Simulação de login
    console.log("Login simulado com:", { email, password });
    alert(`Bem-vindo de volta, ${email}!`);
    navigateTo('home');
  };

  useEffect(() => {
    const senhaInput = document.getElementById('login-senha');
    const togglePassword = document.getElementById('toggle-login-password');
    const capsLockWarning = document.getElementById('login-caps-lock-warning');
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
            <h2 className="form-title">LOGIN</h2>
        </div>

        <form onSubmit={handleLogin}>
            <div className="form-group">
                <label htmlFor="login-email">E-MAIL:</label>
                <input 
                  type="email" 
                  id="login-email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
            </div>
            <div className="form-group">
                <label htmlFor="login-senha">SENHA:</label>
                <div className="password-wrapper">
                    <input 
                      type="password" 
                      id="login-senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <span id="toggle-login-password" className="toggle-password-icon">
                        <svg className="eye-icon-closed" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>
                        <svg className="eye-icon-open" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" style={{display: 'none'}}><path d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z"/></svg>
                    </span>
                </div>
                <small id="login-caps-lock-warning" className="caps-lock-warning">CAPS LOCK ATIVADO</small>
            </div>
            <a href="#" onClick={() => navigateTo('forgotPassword')} className="forgot-password-link">Esqueci minha senha</a>
            {error && <p className="error-message">{error}</p>}
            <button type="submit" className="cta-button">ENTRAR</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
