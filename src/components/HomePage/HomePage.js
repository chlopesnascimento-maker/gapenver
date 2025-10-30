import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './HomePage.css';
import PrimeiroCapituloModal from '../PrimeiroCapituloModal/PrimeiroCapituloModal';

function HomePage({ user, navigateTo }) {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isCapituloModalOpen, setIsCapituloModalOpen] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true); // Garante que o loading seja reativado se a função for chamada novamente
      const { data, error } = await supabase.rpc('get_homepage_dashboard_data');
      if (error) {
        console.error("Erro ao buscar dados do painel:", error);
      } else {
        setDashboardData(data);
      }
      setLoading(false);
    };
    fetchDashboardData();
  }, []); // Dependência vazia, roda apenas uma vez

  // Não mostramos nada até ter certeza se temos dados ou não
  if (loading && !dashboardData) {
    return <div className="painel-loading">Carregando informações do Reino...</div>;
  }

  // Se, após o loading, ainda não temos dados, mostramos um erro
  if (!loading && !dashboardData) {
    return <div className="painel-loading">Não foi possível carregar os dados do Reino.</div>;
  }

  return (
    <>
      {/* ===== NOVA SEÇÃO: PRIMEIRO CAPÍTULO ===== */}
      <section className="primeiro-capitulo-section">
        <div className="section-content">
          <h2 className="section-title">O Portal se Abre: Um Vislumbre de Gápenver</h2>
          <p className="section-text">
            As brumas ancestrais se dissipam, revelando os caminhos que deram início a tudo. As primeiras páginas das crônicas de Gápenver aguardam por você, sussurrando segredos e presságios. O Reino lhe oferece uma chave: desvende os mistérios do Capítulo Um, uma oferenda gratuita para todos os viajantes dispostos a atender ao chamado.
          </p>
          <button
            className="section-cta-button"
            onClick={() => setIsCapituloModalOpen(true)}
          >
            Desvendar o Primeiro Capítulo
          </button>
        </div>
      </section>
      {/* ========================================= */}

      {/* ===== PAINEL DO REINO (Conteúdo Original) ===== */}
      <div className="painel-container">
        {/* O header só aparece se tivermos dados */}
        {dashboardData && (
          <div className="painel-header">
            {user ? (
              <h1>Bem-vindo de volta ao Reino, {`${user.user_metadata.nome || ''} ${user.user_metadata.sobrenome || ''}`.trim() || 'Viajante'}.</h1>
            ) : (
              <h1>Bem-vindos ao Reino de <b>GÁPENVER</b></h1>
            )}
            <p>{dashboardData.lore_tip || 'Os ventos de Gápenver trazem novas histórias a cada dia.'}</p>
          </div>
        )}

        {/* O grid só aparece se tivermos dados */}
        {dashboardData && (
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

            {/* Card de Ações ou CTA */}
            {user ? (
              <div className="widget-card card-acoes">
                <h2>Suas Ações</h2>
                {dashboardData.unread_count > 0 && (
                   <p className="notificacao-painel">
                     Você tem {dashboardData.unread_count} {dashboardData.unread_count > 1 ? 'mensagens não lidas' : 'mensagem não lida'}.
                     <button onClick={() => navigateTo('mensagens')} className="widget-button">Ver Mensagens</button> {/* Usei button para consistência */}
                   </p>
                )}
                <button onClick={() => navigateTo('criarTopico')} className="widget-button full-width">Criar Novo Tópico</button>
                <button onClick={() => navigateTo('comunidade')} className="widget-button full-width">Ver Tópicos</button>
              </div>
            ) : (
              <div className="widget-card cta-card card-acoes">
                <h2>Faça Parte do Reino!</h2>
                <p>Crie sua conta para participar das crônicas, desvendar segredos e interagir com outros viajantes.</p>
                <button onClick={() => navigateTo('register')} className="widget-button full-width">CRIAR MINHA CONTA</button>
                <button onClick={() => navigateTo('login')} className="widget-button secondary full-width">JÁ SOU UM CIDADÃO</button>
              </div>
            )}

            {/* Card de Novos Cidadãos */}
            <div className="widget-card card-cid граждане"> {/* Note a classe aqui, se for intencional */}
              <h2>Novos Cidadãos</h2>
              <ul className="widget-list small">
                {dashboardData.new_members?.map(member => (
                  <li key={member.id}>
                    <img src={member.foto_url || 'https://i.imgur.com/SbdJgVb.png'} alt={member.nome} />
                    <span>{member.nome} {member.sobrenome || ''} chegou ao reino!</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Renderiza o modal (fora do fluxo normal) */}
      <PrimeiroCapituloModal
        isOpen={isCapituloModalOpen}
        onClose={() => setIsCapituloModalOpen(false)}
        user={user}
        navigateTo={navigateTo}
      />
    </>
  );
}

export default HomePage;