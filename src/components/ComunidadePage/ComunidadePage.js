import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import ContextMenu from '../Shared/ContextMenu/ContextMenu';
import MoverTopicoModal from '../MoverTopicoModal/MoverTopicoModal';
import './ComunidadePage.css';

const categorias = ['Todos', 'Personagens', 'Mundo', 'Geral', 'Regras'];

function ComunidadePage({ user, navigateTo }) {
  console.log('--- COMPONENTE RENDERIZOU ---', { user });
  const handleRowClick = (topicId) => {
    // Exemplo: navega para a página do tópico
    navigateTo('topicoDetalhe', { topicId });
  };

  const [topicos, setTopicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('publico');
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('Todos');

  const currentUserRole = user?.app_metadata?.roles?.[0]?.toLowerCase() || 'default';
  const isStaff = ['admin', 'oficialreal', 'guardareal', 'autor'].includes(currentUserRole);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [topicoParaMover, setTopicoParaMover] = useState(null);

  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: null,
    topico: null,
  });
  const longPressTimer = useRef();

  // Função para abrir modal de mover tópico
  const handleOpenMoveModal = (topico) => {
    setTopicoParaMover(topico);
    setIsMoveModalOpen(true);
  };

  // Função para mover para área staff/pública
  const handleToggleStaffArea = async (topico) => {
    const novoStatus = !topico.apenas_staff;
    const { error } = await supabase
      .from('topicos')
      .update({ apenas_staff: novoStatus })
      .eq('id', topico.id);
    if (error) {
      alert("Erro ao mover tópico: " + error.message);
    } else {
      fetchTopicos();
    }
  };

  // Função para fechar tópico
  const handleCloseTopic = async (topicoId) => {
    if (!window.confirm("Tem certeza que deseja fechar este tópico?")) return;
    const { error } = await supabase
      .from('topicos')
      .update({ status: 'fechado' })
      .eq('id', topicoId);
    if (error) {
      alert("Erro ao fechar tópico: " + error.message);
    } else {
      fetchTopicos();
    }
  };

       const fetchTopicos = async () => {
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase.rpc('get_topicos_com_status_leitura', {
      categoria_filtro: categoriaSelecionada
    });

    if (fetchError) {
      setError('Não foi possível carregar os tópicos.');
    } else {
      const filteredData = data.filter(topico =>
        activeTab === 'staff' ? topico.apenas_staff === true : topico.apenas_staff === false
      );
      const sortedData = filteredData.sort((a, b) => {
        if (b.is_pinned && !a.is_pinned) return -1;
        if (!b.is_pinned && a.is_pinned) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
      setTopicos(sortedData);
    }
    setLoading(false);
  };

  useEffect(() => {
    console.log('-> useEffect disparado!', { activeTab, user, categoriaSelecionada });

    // Adicionamos uma guarda para não executar enquanto o Supabase ainda está verificando a sessão do usuário.
    if (user === undefined) {
      console.log('Usuário ainda é indefinido, aguardando...');
      return; // Sai do useEffect se o status do usuário ainda não foi definido.
    }

    fetchTopicos();
    
  }, [activeTab, user, categoriaSelecionada]);

  // Suas outras funções (handleRowClick, etc) continuam as mesmas
const handleTogglePin = async (topico, isCurrentlyPinned) => {
  if (!isStaff) return;
  try {
    const { error: pinError } = await supabase
      .from('topicos')
      .update({ is_pinned: !isCurrentlyPinned })
      .eq('id', topico.id);
    if (pinError) {
      alert("Não foi possível alterar a fixação do tópico.");
    } else {
      // Atualiza a lista
      setTopicos(prev =>
        prev.map(t =>
          t.id === topico.id ? { ...t, is_pinned: !isCurrentlyPinned } : t
        )
      );
      // Ou recarrega do banco:
      // fetchTopicos();
    }
  } catch (err) {
    alert("Erro ao fixar/desafixar tópico.");
  }
};

const handleContextMenu = (event, topico) => {
  event.preventDefault();
  setContextMenu({
    isOpen: true,
    position: { x: event.clientX, y: event.clientY },
    topico,
  });
};
const handleTouchStart = (event, topico) => {
  longPressTimer.current = setTimeout(() => {
    const touch = event.touches[0];
    setContextMenu({
      isOpen: true,
      position: { x: touch.clientX, y: touch.clientY },
      topico,
    });
  }, 500);
};
const handleTouchEnd = () => clearTimeout(longPressTimer.current);
const closeContextMenu = () => setContextMenu({ isOpen: false, position: null, topico: null });

  return (
    <div className="comunidade-container">
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
            {!loading && !error && topicos.map(topico => (
              <tr
                key={topico.id}
                onClick={() => handleRowClick(topico.id)}
                className={`clickable-row ${!topico.foi_lido ? 'nao-lido' : ''}`}
                onContextMenu={isStaff ? (e) => handleContextMenu(e, topico) : undefined}
                onTouchStart={isStaff ? (e) => handleTouchStart(e, topico) : undefined}
                onTouchEnd={isStaff ? handleTouchEnd : undefined}
                onTouchMove={isStaff ? handleTouchEnd : undefined}
              >
                <td className="col-numero">
                  {topico.is_pinned && <span title="Tópico fixado" style={{marginRight: 4}}>📌</span>}
                  {topico.id_serial}
                </td>
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
        {contextMenu.isOpen && (
          <ContextMenu
            position={contextMenu.position}
            onClose={closeContextMenu}
            options={[
              {
                label: contextMenu.topico.is_pinned ? 'Desafixar tópico' : 'Fixar tópico',
                action: () => {
                  handleTogglePin(contextMenu.topico, contextMenu.topico.is_pinned);
                  closeContextMenu();
                }
              },
              {
                label: 'Mover tópico',
                action: () => {
                  handleOpenMoveModal(contextMenu.topico);
                  closeContextMenu();
                }
              },
              {
                label: contextMenu.topico.apenas_staff ? 'Mover para área pública' : 'Mover para área staff',
                action: () => {
                  handleToggleStaffArea(contextMenu.topico);
                  closeContextMenu();
                }
              },
              {
                label: 'Fechar tópico',
                action: () => {
                  handleCloseTopic(contextMenu.topico.id);
                  closeContextMenu();
                }
              },
            ]}
          />
        )}
        {/* Modal de mover tópico */}
        <MoverTopicoModal
          isOpen={isMoveModalOpen}
          onClose={() => setIsMoveModalOpen(false)}
          topico={topicoParaMover}
          onMoveSuccess={() => {
            setIsMoveModalOpen(false);
            fetchTopicos();
          }}
        />
      </div>
    </div>
  );
}



export default ComunidadePage;