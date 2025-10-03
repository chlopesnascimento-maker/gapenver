import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient'; // Importe o Supabase
import './AdminDashboard.css';

function AdminDashboard({ navigateTo, user }) {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Função para chamar nossa Edge Function
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const { data, error: functionError } = await supabase.functions.invoke('get-analytics-data');

        if (functionError) {
          throw functionError;
        }
        
        console.log("Dados recebidos do Analytics:", data);
        setAnalyticsData(data);
      } catch (err) {
        console.error("Erro ao buscar dados do Analytics:", err);
        setError("Não foi possível carregar os dados do Analytics. Verifique o console.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []); // O array vazio [] garante que a busca aconteça apenas uma vez

  const userRole = user?.app_metadata?.roles?.[0];
  let title = 'Painel de Controle';
  let welcomeMessage = 'Bem-vindo(a).';
  if (userRole === 'admin') {
    title = 'Painel de Controle do Administrador';
    welcomeMessage = 'Bem-vindo, Majestade. O Reino aguarda suas ordens.';
  } else if (userRole === 'oficialreal') {
    title = 'Painel do Gestor';
    welcomeMessage = 'Bem-vindo, Oficial da Guarda Real.';
  } else if (userRole === 'guardareal') {
    title = 'Painel do Guarda';
    welcomeMessage = 'Bem-vindo, Sargento da Guarda Real.';
  }

  // Lógica para calcular totais e porcentagens para os widgets
  const totalUsers = analyticsData?.paises.reduce((acc, pais) => acc + pais.visitas, 0) || 0;
  const totalGender = (analyticsData?.genero.male || 0) + (analyticsData?.genero.female || 0);
  const malePercentage = totalGender > 0 ? ((analyticsData.genero.male / totalGender) * 100).toFixed(1) : 0;
  const femalePercentage = totalGender > 0 ? ((analyticsData.genero.female / totalGender) * 100).toFixed(1) : 0;
  const topCountries = analyticsData?.paises.sort((a, b) => b.visitas - a.visitas).slice(0, 5) || [];

  return (
    <div className="admin-dashboard-container">
      <h1 className="admin-title">{title}</h1>
      <p>{welcomeMessage}</p>
      
      {error && <p className="error-message">{error}</p>}

      <div className="admin-widgets-grid">
        
        {/* Widget de Gerenciar Usuários (INTACTO) */}
        {(userRole === 'admin' || userRole === 'oficialreal' || userRole === 'guardareal') && (
          <div className="admin-widget clickable" onClick={() => navigateTo('userManagement')}>
            <h3>Gerenciar Usuários</h3>
            <p className="widget-data">Ver Lista</p>
            <p>Veja e administre todos os cidadãos do reino.</p>
          </div>
        )}

        {/* --- NOVOS WIDGETS COM DADOS DO ANALYTICS --- */}
        <div className="admin-widget">
          <h3>Usuários Ativos (7d)</h3>
          {loading ? <p className="widget-data">...</p> : <p className="widget-data">{totalUsers}</p>}
          <p>Total de usuários únicos nos últimos 7 dias.</p>
        </div>

        <div className="admin-widget">
          <h3>Divisão por Gênero</h3>
          {loading ? <p>Carregando...</p> : (
            <div className="gender-distribution">
              <div className="gender-bar">
                <div className="gender-segment male" style={{ width: `${malePercentage}%` }} title={`Masculino: ${malePercentage}%`}></div>
                <div className="gender-segment female" style={{ width: `${femalePercentage}%` }} title={`Feminino: ${femalePercentage}%`}></div>
              </div>
              <div className="gender-labels">
                <span>♂ {malePercentage}%</span>
                <span>♀ {femalePercentage}%</span>
              </div>
            </div>
          )}
           <p>Baseado em usuários com Google Signals ativo.</p>
        </div>

        <div className="admin-widget">
          <h3>Principais Países</h3>
          {loading ? <p>Carregando...</p> : (
            <ul className="country-list">
              {topCountries.map(pais => (
                <li key={pais.nome}>
                  <span>{pais.nome}</span>
                  <span className="country-visits">{pais.visitas}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}

export default AdminDashboard;