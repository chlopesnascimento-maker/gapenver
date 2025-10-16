import React, { useState, useEffect } from "react";
import "../Shared/Form.css";
import { supabase } from "../../supabaseClient";
import Turnstile from "react-turnstile";

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
  const [captchaToken, setCaptchaToken] = useState(null);
  const [isCaptchaReady, setIsCaptchaReady] = useState(false);


  // --- HANDLE LOGIN OTIMIZADO ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const t0 = performance.now();

    try {
      // tenta pegar o token imediatamente
      const token =
        captchaToken ||
        (window.turnstile && window.turnstile.getResponse
          ? window.turnstile.getResponse()
          : null);

      const tBeforeSupabase = performance.now();
      console.log("[TIMING] Captcha ready:", tBeforeSupabase - t0, "ms");

      // login não bloqueante — envia mesmo sem token
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken: token || undefined,
        },
      });

      const tAfterSupabase = performance.now();
      console.log("[TIMING] Supabase response:", tAfterSupabase - tBeforeSupabase, "ms total:", tAfterSupabase - t0, "ms");

      if (signInError) throw signInError;

      if (data.user) {
        const userRole =
          data.user.app_metadata?.roles?.[0]?.toLowerCase().trim() ||
          data.user.user_metadata?.cargo?.toLowerCase().trim();

        localStorage.setItem("userRole", userRole);

        // Redirecionamento
        if (userRole === "banidos") {
          navigateTo("bannedPage");
        } else {
          navigateTo("home");
        }
      }

// validação assíncrona (em background)
const tryValidateTurnstile = async (uid, tok) => {
  try {
    const res = await fetch(
      `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/validate-turnstile`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tok, userId: uid }),
      }
    );
    const result = await res.json();
    if (!result.success) {
      console.warn("⚠️ CAPTCHA inválido — sessão será encerrada.");
      await supabase.auth.signOut();
      navigateTo("login");
    } else {
      console.log("✅ CAPTCHA validado com sucesso.");
    }
  } catch (err) {
    console.error("Erro ao validar Turnstile:", err);
  }
};

// Se o token já existe, valida agora
if (token) {
  tryValidateTurnstile(data.user.id, token);
} else {
  // fallback: espera até 20 segundos pro token aparecer
  console.log("🕒 Aguardando token em background...");
  let waited = 0;
  const checkInterval = setInterval(() => {
    if (window.turnstile && window.turnstile.getResponse) {
      const tok = window.turnstile.getResponse();
      if (tok) {
        clearInterval(checkInterval);
        console.log("✅ Token obtido após", waited / 1000, "s");
        tryValidateTurnstile(data.user.id, tok);
      }
    }
    waited += 2000;
    if (waited >= 20000) {
      clearInterval(checkInterval);
      console.warn("⏳ Nenhum token gerado após 20s — revogando por segurança.");
      tryValidateTurnstile(data.user.id, null);
    }
  }, 2000);
}


    } catch (err) {
      setError(traduzErros(err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIN GOOGLE ---
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
  useEffect(() => {
    const senhaInput = document.getElementById("login-senha");
    const togglePassword = document.getElementById("toggle-login-password");
    const capsLockWarning = document.getElementById("login-caps-lock-warning");
    if (!senhaInput || !togglePassword || !capsLockWarning) return;

    const eyeIconClosed = togglePassword.querySelector(".eye-icon-closed");
    const eyeIconOpen = togglePassword.querySelector(".eye-icon-open");

    const handleToggle = () => {
      const type =
        senhaInput.getAttribute("type") === "password" ? "text" : "password";
      senhaInput.setAttribute("type", type);
      eyeIconClosed.style.display = type === "password" ? "block" : "none";
      eyeIconOpen.style.display = type === "password" ? "none" : "block";
    };

    const handleKeyUp = (event) => {
      capsLockWarning.style.display = event.getModifierState("CapsLock")
        ? "block"
        : "none";
    };

    togglePassword.addEventListener("click", handleToggle);
    senhaInput.addEventListener("keyup", handleKeyUp);

    return () => {
      togglePassword.removeEventListener("click", handleToggle);
      senhaInput.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // --- INICIALIZA TURNSTILE ASSÍNCRONO E SEM BLOQUEAR ---
  useEffect(() => {
    const renderTurnstile = () => {
      if (
        !window.turnstile ||
        document.getElementById("turnstile-container").children.length > 0
      )
        return;
      window.turnstile.render("#turnstile-container", {
  sitekey: "0x4AAAAAAB6zX8rwVn8Dri1a",
  callback: (token) => {
    setCaptchaToken(token);
    setIsCaptchaReady(true);
  },
  "expired-callback": () => setIsCaptchaReady(false),
  theme: "light",
});

    };

    if (window.turnstile) {
      renderTurnstile();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.defer = true;
      script.onload = renderTurnstile;
      document.head.appendChild(script);
    }
  }, []);

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
                >
                  <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zm0 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
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

          {/* Contêiner oculto do Turnstile */}
          <div id="turnstile-container" style={{ display: "none" }}></div>

          <button
  type="submit"
  className="cta-button"
  disabled={isLoading || !isCaptchaReady}
>
  {isLoading
    ? "ENTRANDO..."
    : !isCaptchaReady
    ? "AGUARDANDO SENTINELAS..."
    : "ENTRAR"}
</button>

        </form>
      </div>
    </div>
  );
}

export default LoginPage;
