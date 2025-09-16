import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './ComunidadePage.css';

// Lista de categorias para o filtro, facilita a manutenção
const categorias = ['Todos', 'Personagens', 'Mundo', 'Geral', 'Regras'];

function ComunidadePage({ user, navigateTo }) {
  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('publico');

  // ==========================================================
  // ADIÇÃO 1: Novo estado para controlar o filtro de categoria
  // ==========================================================
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');

  const currentUserRole = user?.app_metadata?.roles?.[0]?.toLowerCase() || 'default';
  const isStaff = ['admin', 'oficialreal', 'guardareal'].includes(currentUserRole);

  useEffect(() => {
    const fetchTopicos = async () => {
      setLoading(true);
      setError(null);

      // ==========================================================
      // ALTERAÇÃO: Passamos o filtro de categoria para a nossa função no banco
      // ==========================================================
      const { data, error: fetchError } = await supabase.rpc('get_topicos_com_status_leitura', {
        categoria_filtro: categoriaSelecionada
      });

      if (fetchError) {
        console.error('Erro ao buscar tópicos:', fetchError);
        setError('Não foi possível carregar os tópicos.');
      } else {
        const filteredData = data.filter(topico => 
            activeTab === 'staff' ? topico.apenas_staff === true : topico.apenas_staff === false
        ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setTopicos(filteredData);
      }
      setLoading(false);
    };

    if (user) {
        fetchTopicos();
    }
  }, [activeTab, user, categoriaSelecionada]); // <-- Adicionamos o novo filtro como dependência

  const handleRowClick = (topicoId) => {
    navigateTo('topicoDetalhe', { topicId: topicoId });
  };

  return (
    <div className="comunidade-container">
      <div className="comunidade-header">
        <h1>Comunidade</h1>
        <button className="novo-topico-btn" onClick={() => navigateTo('criarTopico')}>Criar Novo Tópico</button>
      </div>

      <div className="comunidade-tabs">
        <button 
          className={`tab-btn ${activeTab === 'publico' ? 'active' : ''}`}
          onClick={() => { setActiveTab('publico'); setCategoriaSelecionada('Todos'); }}
        >
          Tópicos da Comunidade
        </button>
        {isStaff && (
          <button 
            className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => { setActiveTab('staff'); setCategoriaSelecionada('Todos'); }}
          >
            Sala da Staff
          </button>
        )}
      </div>

      {/* ========================================================== */}
      {/* ADIÇÃO 2: O menu de filtros por categoria                  */}
      {/* ========================================================== */}
      <div className="category-filters">
        {categorias.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${categoriaSelecionada === cat ? 'active' : ''}`}
            onClick={() => setCategoriaSelecionada(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="topicos-table">
          <thead>
            <tr>
              <th className="col-numero">N°</th>
              <th className="col-titulo">Título do Tópico</th>
              <th className="col-categoria">Assunto</th>
              <th className="col-autor">Criado Por</th>
              <th className="col-status">Status</th>
              <th className="col-resposta">Resposta da Staff</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Carregando tópicos...</td></tr>
            )}
            {error && (
              <tr><td colSpan="6" className="error-message" style={{ textAlign: 'center', padding: '20px' }}>{error}</td></tr>
            )}
            {!loading && !error && topicos.length === 0 && (
              <tr><td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>Nenhum tópico encontrado nesta seção.</td></tr>
            )}
            {!loading && !error && topicos.map(topico => (
              <tr 
                key={topico.id} 
                onClick={() => handleRowClick(topico.id)} 
                className={`clickable-row ${!topico.foi_lido ? 'nao-lido' : ''}`}
              >
                <td className="col-numero">{topico.id_serial}</td>
                <td className="col-titulo">{topico.titulo}</td>
                <td className="col-categoria">{topico.categoria}</td>
                <td className={`col-autor cargo-text-${topico.profile_cargo?.toLowerCase()}`}>{`${topico.profile_nome || ''} ${topico.profile_sobrenome || ''}`.trim()}</td>
                <td className="col-status">
                  {!topico.foi_lido && <span className="status-badge novo">NOVO</span>}
                </td>
                <td className="col-resposta">
                  {topico.ultima_resposta_staff_at ? '✔️' : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}



export default ComunidadePage;