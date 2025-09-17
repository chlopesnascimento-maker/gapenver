import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import './TopicoDetalhePage.css';
import AutorCard from '../AutorCard/AutorCard';
import MoverTopicoModal from '../MoverTopicoModal/MoverTopicoModal';

function TopicoDetalhePage({ user, pageState, navigateTo }) {
  // --- ESTADOS ---
  const { topicId } = pageState;
  const [topico, setTopico] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [novaResposta, setNovaResposta] = useState('');
  const [enviando, setEnviando] = useState(false);
  
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  
  // --- NOVOS ESTADOS PARA A EDIÇÃO ---
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editReason, setEditReason] = useState('');

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

    // Buscamos as respostas incluindo o perfil de quem AUTOR e de quem EDITOU
    const { data: respostasData, error: respostasError } = await supabase
      .from('respostas')
      .select('*, profiles:user_id(nome, sobrenome, cargo, foto_url), editor:editado_por_user_id(nome, sobrenome)')
      .eq('topico_id', topicId)
      .order('created_at', { ascending: true });

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

  const handleModerateAction = async (action, targetId, payload = {}) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Você tem certeza que deseja executar a ação "${action}"?`)) return;
    const { error: moderateError } = await supabase.functions.invoke('moderate-content', { body: { action, targetId, payload } });
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
    const { error: insertError } = await supabase.from('respostas').insert({ conteudo: novaResposta, topico_id: topicId, user_id: user.id });
    if (isStaff) {
      await supabase.from('topicos').update({ ultima_resposta_staff_at: new Date() }).eq('id', topicId);
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

  // --- NOVAS FUNÇÕES PARA O SISTEMA DE EDIÇÃO ---
  const handleStartEdit = (resposta) => {
    setEditingReplyId(resposta.id);
    setEditedContent(resposta.conteudo);
    setEditReason('');
  };

  const handleSaveEdit = async () => {
    setEnviando(true);

    // Se for um membro da Staff editando a resposta de outra pessoa
    if (isStaff && user.id !== editingReplyId) {
      if (!editedContent.trim() || !editReason.trim()) {
        alert("O conteúdo e o motivo da edição são obrigatórios.");
        setEnviando(false);
        return;
      }
      // Chama a função de moderação segura
      await handleModerateAction('edit_reply', editingReplyId, {
        newContent: editedContent,
        editReason: editReason,
      });
    } else { // Se for o próprio usuário editando
      if (!editedContent.trim()) {
        alert("O conteúdo não pode estar vazio.");
        setEnviando(false);
        return;
      }
      // Faz o update direto, confiando na RLS que criamos
      const { error } = await supabase
        .from('respostas')
        .update({
          conteudo: editedContent,
          usuario_editou_em: new Date().toISOString()
        })
        .eq('id', editingReplyId);

      if (error) {
        alert(`Erro ao salvar edição: ${error.message}`);
      }
    }

    setEnviando(false);
    setEditingReplyId(null); // Fecha o modo de edição
    // fetchDados() é chamado dentro de handleModerateAction, ou precisamos chamar aqui
    if (!isStaff || user.id === editingReplyId) {
        fetchDados();
    }
  };


  if (loading) return <div className="detalhe-container"><p>Carregando tópico...</p></div>;
  if (error) return <div className="detalhe-container"><p className="error-message">{error}</p></div>;
  if (!topico) return <div className="detalhe-container"><p>Tópico não encontrado.</p></div>;

  const isTopicClosed = topico.status === 'fechado';

  return (
    <div className="detalhe-container">
        <button onClick={() => navigateTo('comunidade')} className="btn-voltar">&larr; Voltar para a Comunidade</button>
        
        {isStaff && (
          <div className="moderation-panel">
            <strong>Ações de Moderação:</strong>
            {isTopicClosed ? (
                <button className="btn-open" onClick={() => handleModerateAction('open_topic', topico.id)}>Abrir Tópico</button>
            ) : (
                <button onClick={() => handleModerateAction('close_topic', topico.id)}>Fechar Tópico</button>
            )}
            <button onClick={() => setIsMoveModalOpen(true)}>Mover Tópico</button>
            <button className="btn-delete" onClick={() => handleModerateAction('delete_topic', topico.id)}>Excluir Tópico</button>
          </div>
        )}
        
        <div className="post-card post-principal">
            <AutorCard profile={topico.profiles} />
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
                    const isOwnReply = user && user.id === resposta.user_id;
                    const canDelete = isOwnReply || (isStaff && resposta.profiles.cargo !== 'admin');
                    const canEdit = isOwnReply || isStaff;

                    if (editingReplyId === resposta.id) {
                        return (
                            <div key={resposta.id} className="post-card edit-mode">
                                <AutorCard profile={resposta.profiles} />
                                <div className="conteudo-card">
                                    <textarea
                                        className="edit-textarea"
                                        value={editedContent}
                                        onChange={(e) => setEditedContent(e.target.value)}
                                        rows="5"
                                    />
                                    {isStaff && !isOwnReply && (
                                      <div className="edit-reason-box">
                                          <label>Motivo da Edição da Mensagem (obrigatório)</label>
                                          <input
                                              type="text"
                                              value={editReason}
                                              onChange={(e) => setEditReason(e.target.value)}
                                              placeholder="Ex: Remoção de conteúdo inadequado"
                                          />
                                      </div>
                                    )}
                                    <div className="form-resposta-actions">
                                        <button className="btn-cancelar-resposta" onClick={() => setEditingReplyId(null)} disabled={enviando}>Cancelar</button>
                                        <button className="btn-publicar" onClick={handleSaveEdit} disabled={enviando}>
                                            {enviando ? 'Salvando...' : 'Salvar Edição'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )
                    }

                    return (
                        <div key={resposta.id} className="post-card">
                            <AutorCard profile={resposta.profiles} />
                            <div className="conteudo-card">
                                <div className="conteudo-header"><span>{new Date(resposta.created_at).toLocaleString('pt-BR')}</span></div>
                                <p className="conteudo-texto">{resposta.conteudo}</p>
                                
                                {resposta.usuario_editou_em && (
                                    <div className="info-edicao">(Editado pelo autor em {new Date(resposta.usuario_editou_em).toLocaleDateString('pt-BR')})</div>
                                )}
                                {resposta.editado_em && resposta.editor && (
                                    <div className="info-edicao">
                                        Editado por {`${resposta.editor.nome} ${resposta.editor.sobrenome || ''}`.trim()} em {new Date(resposta.editado_em).toLocaleDateString('pt-BR')}: "{resposta.motivo_edicao}"
                                    </div>
                                )}

                                <div className="reply-actions">
                                    {canEdit && <button onClick={() => handleStartEdit(resposta)} className="btn-editar-comentario">Editar</button>}
                                    {canDelete && <button onClick={() => isOwnReply ? handleDeleteOwnReply(resposta.id) : handleModerateAction('delete_reply', resposta.id)} className="btn-excluir-comentario">Excluir</button>}
                                </div>
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

      <MoverTopicoModal 
        isOpen={isMoveModalOpen}
        onClose={() => setIsMoveModalOpen(false)}
        topico={topico}
        onMoveSuccess={() => { setIsMoveModalOpen(false); fetchDados(); }}
      />
    </div>
  );
}

export default TopicoDetalhePage;