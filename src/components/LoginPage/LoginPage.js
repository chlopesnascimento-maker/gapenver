import React, { useState, useEffect } from "react";
import "../Shared/Form.css";
import { supabase } from "../../supabaseClient";
import "./LoginPage.css";


// --- FUNÇÃO AUXILIAR PARA TRADUZIR ERROS ---
const traduzErros = (mensagem) => {
  const mapa = {
    "Invalid login credentials": "Credenciais inválidas. Verifique seu e-mail e senha.",
    "Email not confirmed": "E-mail não confirmado. Por favor, verifique sua caixa de entrada.",
    "User already registered": "Este e-mail já está cadastrado.",
  };
  return mapa[mensagem] || "Ocorreu um erro inesperado. Tente novamente.";
};

function LoginPage({ navigateTo }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  // Estados do Turnstile removidos

  // --- LOGIN COM EMAIL E SENHA ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    setIsLoading(true);

    try {
      // Chamada de login limpa, sem o captchaToken
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        const userRole = data.user.app_metadata?.roles?.[0]?.toLowerCase().trim() || data.user.user_metadata?.cargo?.toLowerCase().trim();
        localStorage.setItem("userRole", userRole);
        
        if (userRole === "banidos") {
          navigateTo("bannedPage");
        } else {
          navigateTo("home");
        }
      }
    } catch (err) {
      setError(traduzErros(err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIN COM GOOGLE ---
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError("Não foi possível autenticar com o Google. Por favor, tente novamente.");
      console.error("Erro no login com Google:", error);
      setIsLoading(false);
    }
  };

  // --- EFEITO DE SENHA / CAPS LOCK ---
// --- EFEITO DE SENHA / CAPS LOCK ---
  useEffect(() => {
    const senhaInput = document.getElementById("login-senha");
    const togglePassword = document.getElementById("toggle-login-password");
    const capsLockWarning = document.getElementById("login-caps-lock-warning");

    // Funções de evento
    const handleToggle = () => {
      if (!senhaInput || !togglePassword) return;
      
      const eyeIconClosed = togglePassword.querySelector(".eye-icon-closed");
      const eyeIconOpen = togglePassword.querySelector(".eye-icon-open");
      
      if (!eyeIconClosed || !eyeIconOpen) return;

      const type = senhaInput.getAttribute("type") === "password" ? "text" : "password";
      senhaInput.setAttribute("type", type);
      eyeIconClosed.style.display = type === "password" ? "block" : "none";
      eyeIconOpen.style.display = type === "password" ? "none" : "block";
    };

    const handleKeyUp = (event) => {
      if (capsLockWarning) {
        capsLockWarning.style.display = event.getModifierState("CapsLock") ? "block" : "none";
      }
    };

    // --- Adiciona os listeners ---
    if (togglePassword) {
      togglePassword.addEventListener("click", handleToggle);
    }
    if (senhaInput) {
      senhaInput.addEventListener("keyup", handleKeyUp);
    }

    // --- Função de Limpeza Única ---
    // Isso será executado quando o componente "morrer"
    return () => {
      if (togglePassword) {
        togglePassword.removeEventListener("click", handleToggle);
      }
      if (senhaInput) {
        senhaInput.removeEventListener("keyup", handleKeyUp);
      }
    };
  }, []); // O array vazio [] garante que isso só rode uma vez

  return (
    <div className="form-page-container">
      <div className="form-container">
        <div className="form-title-container">
          <h2 className="form-title">LOGIN</h2>
        </div>

        <button
          className="google-login-button"
          onClick={handleGoogleLogin}
          disabled={isLoading}
        >
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/768px-Google_%22G%22_logo.svg.png"
            alt="Google logo"
            className="google-logo"
          />
          Entrar com conta do Google
        </button>

        <div className="divider">
          <span>ou entre com seu e-mail</span>
        </div>

        <form onSubmit={handleLogin}>
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
               <svg
  className="eye-icon-closed"
  xmlns="http://www.w3.org/2000/svg"
  width="22"
  height="22"
  viewBox="0 0 24 24"
  fill="currentColor" /* Adicionado para garantir que ele pegue a cor do CSS */
>
  <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L21.73 22 23 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
</svg>
                <svg
                  className="eye-icon-open"
                  xmlns="http://www.w3.org/2000/svg"
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  style={{ display: "none" }}
                >
                  <path d="M12 6c3.79 0 7.17 2.13 8.82 5.5C19.17 14.87 15.79 17 12 17s-7.17-2.13-8.82-5.5C4.83 8.13 8.21 6 12 6m0-2C7 4 2.73 7.11 1 11.5 2.73 15.89 7 19 12 19s9.27-3.11 11-7.5C21.27 7.11 17 4 12 4zm0 5c1.38 0 2.5 1.12 2.5 2.5S13.38 14 12 14s-2.5-1.12-2.5-2.5S10.62 9 12 9m0-2c-2.48 0-4.5 2.02-4.5 4.5S9.52 16 12 16s4.5-2.02 4.5-4.5S14.48 7 12 7z" />
                </svg>
              </span>
            </div>
            <small id="login-caps-lock-warning" className="caps-lock-warning">
              CAPS LOCK ATIVADO
            </small>
          </div>

          <a
            href="#"
            onClick={() => navigateTo("forgotPassword")}
            className="forgot-password-link"
          >
            Esqueci minha senha
          </a>

          {error && <p className="error-message">{error}</p>}

          {/* Componente Turnstile REMOVIDO */}

          <button
            type="submit"
            className="cta-button"
            disabled={isLoading} // Lógica de disabled simplificada
          >
            {isLoading ? "ENTRANDO..." : "ENTRAR"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;