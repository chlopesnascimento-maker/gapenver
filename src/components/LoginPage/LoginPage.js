import React, { useState, useEffect } from 'react';
import '../Shared/Form.css';
import { supabase } from '../../supabaseClient'; 
// --- FUNÇÃO AUXILIAR PARA TRADUZIR ERROS ---
// Colocamos ela fora do componente para melhor organização.
const traduzErros = (mensagem) => {
  const mapa = {
    "Invalid login credentials": "Credenciais inválidas. Verifique seu e-mail e senha.",
    "Email not confirmed": "E-mail não confirmado. Por favor, verifique sua caixa de entrada.",
    "User already registered": "Este e-mail já está cadastrado.",
  };
  return mapa[mensagem] || "Ocorreu um erro inesperado. Tente novamente.";
};


function LoginPage({ navigateTo }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // --- FUNÇÃO handleLogin TOTALMENTE REESTRUTURADA ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Tenta fazer o login UMA VEZ
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      // 2. Se houver um erro, traduz e exibe a mensagem
      if (signInError) {
        throw signInError;
      }

// 3. Se o login for bem-sucedido, verifica o cargo do usuário
if (data.user) {
  const userRole =
    data.user.app_metadata?.roles?.[0]?.toLowerCase().trim() ||
    data.user.user_metadata?.cargo?.toLowerCase().trim();

  // Salva o cargo no localStorage
  localStorage.setItem('userRole', userRole);

  // 4. Redireciona com base no cargo
  if (userRole === 'banidos') {
    navigateTo('bannedPage');
  } else {
    navigateTo('home');
  }
}

    } catch (err) {
      // O 'catch' agora usa nossa função para mostrar um erro amigável
      setError(traduzErros(err.message));
    } finally {
      // O 'finally' só é responsável por parar o loading
      setIsLoading(false);
    }
  };

  // --- NOVA FUNÇÃO PARA O LOGIN COM GOOGLE ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
    });
    if (error) {
        setError('Não foi possível autenticar com o Google. Por favor, tente novamente.');
        console.error("Erro no login com Google:", error);
        setIsLoading(false);
    }
  };

  useEffect(() => {
    const senhaInput = document.getElementById('login-senha');
    const togglePassword = document.getElementById('toggle-login-password');
    // ... (o resto do seu useEffect continua igual e funcional)
    const capsLockWarning = document.getElementById('login-caps-lock-warning');
    if (!senhaInput || !togglePassword || !capsLockWarning) return;

    const eyeIconClosed = togglePassword.querySelector('.eye-icon-closed');
    const eyeIconOpen = togglePassword.querySelector('.eye-icon-open');

    const handleToggle = () => {
      const type = senhaInput.getAttribute('type') === 'password' ? 'text' : 'password';
      senhaInput.setAttribute('type', type);
      eyeIconClosed.style.display = type === 'password' ? 'block' : 'none';
      eyeIconOpen.style.display = type === 'password' ? 'none' : 'block';
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

        {/* --- NOVO BOTÃO E DIVISOR --- */}
        <button className="google-login-button" onClick={handleGoogleLogin} disabled={isLoading}>
    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png" alt="Google logo" className="google-logo" />
    Entrar com conta do Google
</button>
        <div className="divider"><span>ou entre com seu e-mail</span></div>
        {/* --- FIM DA ADIÇÃO --- */}

        <form onSubmit={handleLogin}>
          {/* O seu JSX continua o mesmo */}
          <div className="form-group">
            <label htmlFor="login-email">E-MAIL:</label>
            <input
              type="email"
              id="login-email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
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
                disabled={isLoading}
              />
              <span id="toggle-login-password" className="toggle-password-icon">
                <svg className="eye-icon-closed" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24">
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                </svg>
                <svg className="eye-icon-open" xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" style={{ display: 'none' }}>
                  <path d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z"/>
                </svg>
              </span>
            </div>
            <small id="login-caps-lock-warning" className="caps-lock-warning">CAPS LOCK ATIVADO</small>
          </div>
          <a href="#" onClick={() => navigateTo('forgotPassword')} className="forgot-password-link">
            Esqueci minha senha
          </a>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="cta-button" disabled={isLoading}>
            {isLoading ? 'ENTRANDO...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;