import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './ComunidadePage.css';

const categorias = ['Todos', 'Personagens', 'Mundo', 'Geral', 'Regras'];

function ComunidadePage({ user, navigateTo }) {
  console.log('--- COMPONENTE RENDERIZOU ---', { user });

  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('publico');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');

  const currentUserRole = user?.app_metadata?.roles?.[0]?.toLowerCase() || 'default';
  const isStaff = ['admin', 'oficialreal', 'guardareal', 'autor'].includes(currentUserRole);

  useEffect(() => {
    console.log('-> useEffect disparado!', { activeTab, user, categoriaSelecionada });

    // Adicionamos uma guarda para não executar enquanto o Supabase ainda está verificando a sessão do usuário.
    if (user === undefined) {
      console.log('Usuário ainda é indefinido, aguardando...');
      return; // Sai do useEffect se o status do usuário ainda não foi definido.
    }

    const fetchTopicos = async () => {
      console.log('1. Iniciando fetchTopicos...');
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase.rpc('get_topicos_com_status_leitura', {
        categoria_filtro: categoriaSelecionada
      });

      console.log('2. Resposta do Supabase recebida:', { data, fetchError });

      if (fetchError) {
        console.error('3. ERRO DETECTADO no fetch!', fetchError);
        setError('Não foi possível carregar os tópicos.');
      } else {
        console.log('3. SUCESSO no fetch! Começando a filtrar os dados...');
        const filteredData = data.filter(topico =>
          activeTab === 'staff' ? topico.apenas_staff === true : topico.apenas_staff === false
        );
        
        console.log(`4. Dados filtrados (apenas onde apenas_staff é ${activeTab !== 'staff'}):`, filteredData);

        // A ordenação foi movida para fora do filter para clareza
        const sortedData = filteredData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        console.log('5. Definindo o estado dos tópicos com os dados ordenados.');
        setTopicos(sortedData);
      }
      
      console.log('6. Finalizando o fetch, definindo loading para false.');
      setLoading(false);
    };

    fetchTopicos();
    
  }, [activeTab, user, categoriaSelecionada]);

  // Suas outras funções (handleRowClick, etc) continuam as mesmas
  const handleRowClick = async (topicoId) => {
    if (!user) {
        // Se o usuário não estiver logado, apenas navega sem marcar como lido
        navigateTo('topicoDetalhe', { topicId: topicoId });
        return;
    }

    try {
        await supabase
        .from('topicos_lidos')
        .upsert({
            topico_id: topicoId,
            user_id: user.id,
            lido_em: new Date().toISOString()
        });
        setTopicos(prev =>
        prev.map(t =>
            t.id === topicoId ? { ...t, foi_lido: true } : t
        )
        );
    } catch (err) {
        console.error('Erro ao marcar tópico como lido:', err);
    }
    navigateTo('topicoDetalhe', { topicId: topicoId });
  };


  return (
    <div className="comunidade-container">
      {/* O resto do seu JSX continua o mesmo */}
      <div className="comunidade-header">
        <h1>Comunidade</h1>
        {/* Oculta o botão de criar tópico se o usuário não estiver logado */}
        {user && <button className="novo-topico-btn" onClick={() => navigateTo('criarTopico')}>Criar Novo Tópico</button>}
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
                  {user && !topico.foi_lido && <span className="status-badge novo">NOVO</span>}
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