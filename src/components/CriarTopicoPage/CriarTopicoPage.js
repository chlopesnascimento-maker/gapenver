import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './CriarTopicoPage.css';
import RichTextEditor from '../RichTextEditor/RichTextEditor';
import ConfirmacaoModal from '../Shared/ConfirmacaoModal/ConfirmacaoModal';

function CriarTopicoPage({ user, navigateTo }) {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoria, setCategoria] = useState('Geral'); // Categoria padrão
  const [apenasStaff, setApenasStaff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal de confirmação/alerta
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    message: '',
    onConfirm: null,
    onCancel: null,
  });

  // Função utilitária para alertas simples
  const showAlert = (message) => {
    setConfirmModal({
      isOpen: true,
      message,
      onConfirm: () => setConfirmModal((prev) => ({ ...prev, isOpen: false })),
      onCancel: null,
    });
  };

  const currentUserRole = user?.app_metadata?.roles?.[0]?.toLowerCase() || 'default';
  const isStaff = ['admin', 'oficialreal', 'guardareal'].includes(currentUserRole);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validação simples
    if (!titulo.trim() || !conteudo.trim()) {
      setError('O título e o conteúdo não podem estar vazios.');
      setLoading(false);
      return;
    }

    const { data, error: insertError } = await supabase
      .from('topicos')
      .insert({
        titulo: titulo,
        conteudo: conteudo,
        categoria: categoria,
        user_id: user.id,
        apenas_staff: isStaff ? apenasStaff : false // Garante que não-staff não possa criar tópico privado
      })
      .select()
      .single();

    setLoading(false);

    if (insertError) {
      console.error('Erro ao criar tópico:', insertError);
      setError('Não foi possível criar o tópico. Tente novamente.');
    } else {
      showAlert('Tópico criado com sucesso!');
      // Após fechar o modal, redireciona para a comunidade
      setConfirmModal({
        isOpen: true,
        message: 'Tópico criado com sucesso!',
        onConfirm: () => {
          setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          navigateTo('comunidade');
        },
        onCancel: null,
      });
    }
  };

  return (
    <div className="criar-topico-container">
      <h1 className="criar-topico-titulo-pagina">Criar Novo Tópico</h1>
      <form onSubmit={handleSubmit} className="criar-topico-form">
        <div className="form-group">
          <label htmlFor="titulo">Título do Tópico</label>
          <input
            type="text"
            id="titulo"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Um título breve e descritivo"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="categoria">Assunto</label>
          <select 
            id="categoria" 
            value={categoria} 
            onChange={(e) => setCategoria(e.target.value)}
          >
            <option value="Geral">Geral</option>
            <option value="Personagens">Personagens</option>
            <option value="Mundo">Mundo</option>
            <option value="Regras">Regras</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="conteudo">Sua Mensagem</label>
          <RichTextEditor
            id="conteudo"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Descreva sua dúvida ou o assunto que quer discutir..."
            rows="10"
            required
          ></RichTextEditor>
        </div>

        {isStaff && (
          <div className="form-group-checkbox">
            <input
              type="checkbox"
              id="apenasStaff"
              checked={apenasStaff}
              onChange={(e) => setApenasStaff(e.target.checked)}
            />
            <label htmlFor="apenasStaff">Tópico visível apenas para a Staff</label>
          </div>
        )}
        
        {error && <p className="error-message">{error}</p>}

        <div className="form-actions">
          <button type="button" onClick={() => navigateTo('comunidade')} className="btn-cancelar">
            Cancelar
          </button>
          <button type="submit" className="btn-publicar" disabled={loading}>
            {loading ? 'Publicando...' : 'Publicar Tópico'}
          </button>
        </div>
      </form>
      {/* Modal de confirmação/alerta */}
      <ConfirmacaoModal
        isOpen={confirmModal.isOpen}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={confirmModal.onCancel || (() => setConfirmModal((prev) => ({ ...prev, isOpen: false })))}
      />
    </div>
  );
}

export default CriarTopicoPage;