import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './HomePage.css';

// ADICIONAMOS A PROP 'navigateTo' AQUI
function HomePage({ user, navigateTo }) { 
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ... (seu useEffect continua igual)
    const fetchDashboardData = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_homepage_dashboard_data');
      if (error) {
        console.error("Erro ao buscar dados do painel:", error);
      } else {
        setDashboardData(data);
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="painel-loading">Carregando informações do Reino...</div>;
  }
  if (!dashboardData) {
    return <div className="painel-loading">Não foi possível carregar os dados do Reino.</div>;
  }

  return (
    <div className="painel-container">
      <div className="painel-header">
        {user ? (
          <h1>Bem-vindo de volta ao Reino, {`${user.user_metadata.nome || ''} ${user.user_metadata.sobrenome || ''}`.trim() || 'Viajante'}.</h1>
        ) : (
          <h1>Bem-vindos ao Reino de <b>GÁPENVER</b></h1>
        )}
        <p>{dashboardData.lore_tip || 'Os ventos de Gápenver trazem novas histórias a cada dia.'}</p>
      </div>

   <div className="painel-grid">
        {/* Card de Atividade Recente */}
        <div className="widget-card card-atividade">
          <h2>Atividade Recente no Reino</h2>
          <ul className="widget-list">
            {dashboardData.recent_topics?.map(topic => (
              <li key={topic.id}>
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('topicoDetalhe', { topicId: topic.id }); }}>
                  "{topic.titulo}"
                </a>
                <span>por {topic.nome} {topic.sobrenome}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Card de Ações do Usuário */}
        {user ? (
          <div className="widget-card card-acoes">
            <h2>Suas Ações</h2>
            {dashboardData.unread_count > 0 && (
              <p className="notificacao-painel">
                Você tem {dashboardData.unread_count} {dashboardData.unread_count > 1 ? 'mensagens não lidas' : 'mensagem não lida'}.
                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('mensagens'); }} className="widget-button">Ver Mensagens</a>
              </p>
            )}
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('criarTopico'); }} className="widget-button full-width">Criar Novo Tópico</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('comunidade'); }} className="widget-button full-width">Ver Tópicos</a>
          </div>
        ) : (
          <div className="widget-card cta-card card-acoes">
            <h2>Faça Parte do Reino!</h2>
            <p>Crie sua conta para participar...</p>
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('register'); }} className="widget-button full-width">CRIAR MINHA CONTA</a>
            <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('login'); }} className="widget-button secondary full-width">JÁ SOU UM CIDADÃO</a>
          </div>
        )}

        {/* Card de Novos Cidadãos */}
        <div className="widget-card card-cidadaos">
          <h2>Novos Cidadãos</h2>
          <ul className="widget-list small">
            {dashboardData.new_members?.map(member => (
              <li key={member.id}>
                <img src={member.foto_url || 'https://i.imgur.com/SbdJgVb.png'} alt={member.nome} />
                <span>{member.nome} {member.sobrenome} chegou ao reino!</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default HomePage;