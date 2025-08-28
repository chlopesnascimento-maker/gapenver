import React from 'react';
import '../Shared/Form.css'; // Reutilizando nosso CSS de formulário

function ForgotPasswordPage({ navigateTo }) {
  return (
    // A ID foi adicionada aqui para que o CSS saiba onde aplicar os estilos
    <div id="forgot-password-page" className="form-page-container">
      <div className="form-container">
        {/* O logo foi removido daqui para evitar duplicidade com o cabeçalho */}
        
        <div className="form-title-container">
            <h2 className="form-title">RECUPERAR SENHA</h2>
        </div>
        
        <p className="fantasy-subtitle">Não consegue entrar? Procuraremos nos manuscritos mais antigos as runas que o permitirão acessar.</p>
        <p className="form-instruction">Para redefinir a senha, insira o endereço de e-mail associado à sua conta GÁPENVER.</p>

        <form>
            <div className="form-group">
                <label htmlFor="recovery-email">ENDEREÇO DE E-MAIL:</label>
                <input type="email" id="recovery-email" />
            </div>
        </form>
        <a href="#" onClick={(e) => e.preventDefault()} className="cta-button">ENVIAR LINK</a>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
