import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './ComunidadePage.css';

// Componente para o Status do Tópico (lógica de "Novo")
function TopicoStatus({ topico }) {
    const umDiaAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const dataCriacao = new Date(topico.created_at);

    // Se o tópico foi criado nas últimas 24h, é "Novo"
    if (dataCriacao > umDiaAtras) {
        return <span className="status-badge novo">NOVO</span>;
    }
    
    // Futuramente, podemos adicionar a lógica de "Novas Respostas" aqui
    return null; // Não mostra nada se não for novo
}

function ComunidadePage({ user, navigateTo }) {
  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('publico');

  const currentUserRole = user?.app_metadata?.roles?.[0]?.toLowerCase() || 'default';
  const isStaff = ['admin', 'oficialreal', 'guardareal'].includes(currentUserRole);

  useEffect(() => {
    const fetchTopicos = async () => {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('topicos')
        .select(`
          id,
          id_serial,
          titulo,
          categoria,
          created_at,
          ultima_resposta_staff_at,
          profiles ( nome, sobrenome )
        `)
        .order('created_at', { ascending: false });

      if (activeTab === 'staff') {
        query = query.eq('apenas_staff', true);
      } else {
        query = query.eq('apenas_staff', false);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) {
        console.error('Erro ao buscar tópicos:', fetchError);
        setError('Não foi possível carregar os tópicos.');
      } else {
        setTopicos(data);
      }
      setLoading(false);
    };

    if (user) { // Garante que a busca só ocorra se o usuário estiver logado
        fetchTopicos();
    }
  }, [activeTab, user]);

 const handleRowClick = (topicoId) => {
  navigateTo('topicoDetalhe', { topicId: topicoId });
};

  return (
    <div className="comunidade-container">
      <div className="comunidade-header">
        <h1>Comunidade</h1>
        <button className="novo-topico-btn" onClick={() => navigateTo('criarTopico')}>
  Criar Novo Tópico
</button>
      </div>

      <div className="comunidade-tabs">
        <button 
          className={`tab-btn ${activeTab === 'publico' ? 'active' : ''}`}
          onClick={() => setActiveTab('publico')}
        >
          Tópicos da Comunidade
        </button>
        {isStaff && (
          <button 
            className={`tab-btn ${activeTab === 'staff' ? 'active' : ''}`}
            onClick={() => setActiveTab('staff')}
          >
            Sala da Staff
          </button>
        )}
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
              <tr><td colSpan="6">Carregando tópicos...</td></tr>
            )}
            {error && (
              <tr><td colSpan="6" className="error-message">{error}</td></tr>
            )}
            {!loading && !error && topicos.length === 0 && (
              <tr><td colSpan="6">Nenhum tópico encontrado nesta seção.</td></tr>
            )}
            {!loading && !error && topicos.map(topico => (
              <tr key={topico.id} onClick={() => handleRowClick(topico.id)} className="clickable-row">
                <td className="col-numero">{topico.id_serial}</td>
                <td className="col-titulo">{topico.titulo}</td>
                <td className="col-categoria">{topico.categoria}</td>
                <td className="col-autor">{`${topico.profiles.nome} ${topico.profiles.sobrenome}`}</td>
                <td className="col-status">
                  <TopicoStatus topico={topico} />
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