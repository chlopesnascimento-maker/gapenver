import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import './TopicoDetalhePage.css';

// ==========================================================
// ADIÇÃO 1: O "dicionário" de tradução dos cargos
// ==========================================================
const roleDisplayNames = {
  'admin': 'Administrador',
  'oficialreal': 'Oficial Real',
  'guardareal': 'Guarda Real',
  'viajante': 'Viajante',
  'banidos': 'Banido',
  'default': 'Indefinido'
};



function TopicoDetalhePage({ user, pageState, navigateTo }) {
  const { topicId } = pageState;
  const [topico, setTopico] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novaResposta, setNovaResposta] = useState('');
  const [enviando, setEnviando] = useState(false);
  
  const currentUserRole = user?.app_metadata?.roles?.[0]?.toLowerCase() || 'default';
  const isStaff = ['admin', 'oficialreal', 'guardareal'].includes(currentUserRole);

  const fetchDados = useCallback(async () => {
    if (!topicId) {
        setError("ID do tópico não fornecido.");
        setLoading(false);
        return;
    }
    setLoading(true);
    setError(null);

    const { data: topicoData, error: topicoError } = await supabase
        .from('topicos').select('*, profiles(*)').eq('id', topicId).single();

    if (topicoError) {
        setError('Não foi possível carregar o tópico.');
        console.error("Erro ao buscar tópico:", topicoError);
        setLoading(false);
        return;
    }
    setTopico(topicoData);

    const { data: respostasData, error: respostasError } = await supabase
        .from('respostas').select('*, profiles(*)').eq('topico_id', topicId).order('created_at', { ascending: true });

    if (respostasError) {
        setError('Não foi possível carregar as respostas.');
        console.error("Erro ao buscar respostas:", respostasError);
    } else {
        setRespostas(respostasData);
    }
    
    setLoading(false);
  }, [topicId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

  useEffect(() => {
    // Se não houver usuário logado, não faz nada
    if (!user || !topicId) return;

    const marcarComoLido = async () => {
      // "upsert" tenta inserir; se já existir, ele não faz nada (ou atualiza, se quiséssemos)
      const { error } = await supabase
        .from('topicos_lidos')
        .upsert({
          topico_id: topicId,
          user_id: user.id
        });
        
      if (error) console.error("Erro ao marcar tópico como lido:", error);
    };

    marcarComoLido();
}, [topicId, user]); // Roda sempre que o tópico ou o usuário mudar

  const handleModerateAction = async (action, targetId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Você tem certeza que deseja executar a ação "${action}"?`)) return;

    const { error: moderateError } = await supabase.functions.invoke('moderate-content', {
      body: { action, targetId },
    });
    if (moderateError) {
      alert(`Erro ao moderar: ${moderateError.message || moderateError}`);
    } else {
      alert('Ação executada com sucesso!');
      if (action === 'delete_topic') {
        navigateTo('comunidade');
      } else {
        fetchDados();
      }
    }
  };

  const handleDeleteOwnReply = async (replyId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm("Você tem certeza que deseja excluir seu próprio comentário?")) return;
    
    const { error: deleteError } = await supabase.from('respostas').delete().eq('id', replyId);
    if (deleteError) {
        alert(`Erro ao excluir comentário: ${deleteError.message}`);
    } else {
        fetchDados();
    }
  };

  const handleEnviarResposta = async (e) => {
    e.preventDefault();
    if (!novaResposta.trim()) return;
    setEnviando(true);
    
    const { error: insertError } = await supabase
        .from('respostas').insert({ conteudo: novaResposta, topico_id: topicId, user_id: user.id });
        
    if (isStaff) {
        await supabase
            .from('topicos').update({ ultima_resposta_staff_at: new Date() }).eq('id', topicId);
    }

    setEnviando(false);
    if (insertError) {
        alert('Erro ao enviar resposta: ' + insertError.message);
    } else {
        setNovaResposta('');
        setMostrarFormulario(false);
        fetchDados();
    }
  };

  if (loading) return <div className="detalhe-container"><p>Carregando tópico...</p></div>;
  if (error) return <div className="detalhe-container"><p className="error-message">{error}</p></div>;
  if (!topico) return <div className="detalhe-container"><p>Tópico não encontrado.</p></div>;

  const isTopicClosed = topico.status === 'fechado';
  const isTopicAuthorStaff = ['admin', 'oficialreal', 'guardareal'].includes(topico.profiles.cargo?.toLowerCase());

  // ==========================================================
  // ADIÇÃO 2: Lógica para "traduzir" o cargo do autor do tópico
  // ==========================================================
  const autorCargoKey = topico.profiles.cargo?.toLowerCase() || 'default';
  const autorDisplayName = roleDisplayNames[autorCargoKey];


  return (
    <div className="detalhe-container">
        <button onClick={() => navigateTo('comunidade')} className="btn-voltar">
            &larr; Voltar para a Comunidade
        </button>
        
        {isStaff && (
                <div className="moderation-panel">
                    <strong>Ações de Moderação:</strong>
                    
                    {/* ========================================================== */}
                    {/* ALTERAÇÃO: Lógica para alternar entre os botões          */}
                    {/* ========================================================== */}
                    {isTopicClosed ? (
                        <button className="btn-open" onClick={() => handleModerateAction('open_topic', topico.id)}>
                            Abrir Tópico
                        </button>
                    ) : (
                        <button onClick={() => handleModerateAction('close_topic', topico.id)}>
                            Fechar Tópico
                        </button>
                    )}
                    
                    <button className="btn-delete" onClick={() => handleModerateAction('delete_topic', topico.id)}>
                        Excluir Tópico
                    </button>
                </div>
            )}
        
        <div className="post-card post-principal">
            <div className="autor-card">
                <img src={topico.profiles.foto_url || 'URL_PADRAO'} alt={topico.profiles.nome} />
                <h3>{`${topico.profiles.nome} ${topico.profiles.sobrenome}`}</h3>
                {/* ALTERAÇÃO 1: Usando o nome traduzido */}
                <span className={`cargo-badge cargo-${autorCargoKey}`}>{autorDisplayName}</span>
                {isTopicAuthorStaff && (
                    <img src="https://i.imgur.com/J6hJQ7i.png" alt="Insígnia da Staff" className="staff-badge" />
                )}
            </div>
            <div className="conteudo-card">
                <div className="conteudo-header">
                    <h2>{topico.titulo}</h2>
                    <span>{new Date(topico.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="conteudo-texto">{topico.conteudo}</p>
            </div>
        </div>

        {isTopicClosed && <div className="topic-closed-alert">Este tópico foi fechado para novas respostas de viajantes. Apenas a Staff pode responder.</div>}

        <h3 className="titulo-respostas">Respostas ({respostas.length})</h3>
        <div className="lista-respostas">
            {respostas.length > 0 ? (
                respostas.map(resposta => {
                    // ==========================================================
                    // ADIÇÃO 3: Lógica para "traduzir" o cargo de quem responde
                    // ==========================================================
                    const respostaCargoKey = resposta.profiles.cargo?.toLowerCase() || 'default';
                    const respostaDisplayName = roleDisplayNames[respostaCargoKey];
                    const isReplyAuthorStaff = ['admin', 'oficialreal', 'guardareal'].includes(respostaCargoKey);
                    const canDelete = user && (
                        (user.id === resposta.user_id) || 
                        (isStaff && resposta.profiles.cargo !== 'admin')
                    );

                    return (
                        <div key={resposta.id} className="post-card">
                            <div className="autor-card">
                                <img src={resposta.profiles.foto_url || 'URL_PADRAO'} alt={resposta.profiles.nome} />
                                <h3>{`${resposta.profiles.nome} ${resposta.profiles.sobrenome}`}</h3>
                                {/* ALTERAÇÃO 2: Usando o nome traduzido */}
                                <span className={`cargo-badge cargo-${respostaCargoKey}`}>{respostaDisplayName}</span>
                                {isReplyAuthorStaff && (
                                    <img src="https://i.imgur.com/J6hJQ7i.png" alt="Insígnia da Staff" className="staff-badge" />
                                )}
                            </div>
                            <div className="conteudo-card">
                                <div className="conteudo-header">
                                    <span>{new Date(resposta.created_at).toLocaleString('pt-BR')}</span>
                                </div>
                                <p className="conteudo-texto">{resposta.conteudo}</p>
                                
                                {canDelete && (
                                    <div className="reply-actions">
                                        <button 
                                            onClick={() => user.id === resposta.user_id ? handleDeleteOwnReply(resposta.id) : handleModerateAction('delete_reply', resposta.id)} 
                                            className="btn-excluir-comentario"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })
            ) : ( <p className="sem-respostas">Nenhuma resposta ainda. Seja o primeiro a responder!</p> )}
        </div>

        {user && (!isTopicClosed || isStaff) && (
            !mostrarFormulario ? (
                <button className="btn-mostrar-resposta" onClick={() => setMostrarFormulario(true)}>
                    Responder a este tópico
                </button>
            ) : ( 
                <form onSubmit={handleEnviarResposta} className="form-resposta">
                    <h4>Respondendo ao tópico de <span className="destaque-nome">#{topico.profiles.nome}</span></h4>
                    <textarea
                        value={novaResposta}
                        onChange={(e) => setNovaResposta(e.target.value)}
                        placeholder="Escreva sua resposta..."
                        rows="5"
                        required
                    />
                    <div className="form-resposta-actions">
                        <button type="button" className="btn-cancelar-resposta" onClick={() => setMostrarFormulario(false)}>Cancelar</button>
                        <button type="submit" className="btn-publicar" disabled={enviando}>
                            {enviando ? 'Enviando...' : 'Enviar Resposta'}
                        </button>
                    </div>
                </form>
            )
        )}
    </div>
  );
}

export default TopicoDetalhePage;