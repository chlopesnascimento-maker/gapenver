import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';
import './CriarTopicoPage.css';

function CriarTopicoPage({ user, navigateTo }) {
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [categoria, setCategoria] = useState('Geral'); // Categoria padrão
  const [apenasStaff, setApenasStaff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      .select() // Pede ao Supabase para retornar o registro que acabamos de criar
      .single(); // Pois sabemos que criamos apenas um

    setLoading(false);

    if (insertError) {
      console.error('Erro ao criar tópico:', insertError);
      setError('Não foi possível criar o tópico. Tente novamente.');
    } else {
      alert('Tópico criado com sucesso!');
      // Redireciona o usuário para a página do novo tópico (que criaremos a seguir)
      console.log('Redirecionar para o tópico com ID:', data.id);
      // navigateTo('topicDetail', { topicId: data.id }); 
      navigateTo('comunidade'); // Por enquanto, volta para a lista
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
          <textarea
            id="conteudo"
            value={conteudo}
            onChange={(e) => setConteudo(e.target.value)}
            placeholder="Descreva sua dúvida ou o assunto que quer discutir..."
            rows="10"
            required
          ></textarea>
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
    </div>
  );
}

export default CriarTopicoPage;