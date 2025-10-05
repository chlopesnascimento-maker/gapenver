import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import './TopicoDetalhePage.css';
import AutorCard from '../AutorCard/AutorCard';
import MoverTopicoModal from '../MoverTopicoModal/MoverTopicoModal';
import RichTextEditor from '../RichTextEditor/RichTextEditor'; // Ajuste o caminho se necessário
import DOMPurify from 'dompurify';
import '../RichTextEditor/RichTextEditor.css';

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
  
  // --- ESTADOS PARA EDIÇÃO DE RESPOSTAS ---
  const [editingReplyId, setEditingReplyId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [editReason, setEditReason] = useState('');

  // --- NOVO: ESTADO PARA EDIÇÃO DO TÓPICO ---
  const [isEditingTopic, setIsEditingTopic] = useState(false);

  const [curtidasUsuario, setCurtidasUsuario] = useState(new Set());

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

    // ALTERADO: Adicionamos a busca pelo perfil do editor do TÓPICO
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
      .from('respostas')
      .select('*, profiles:user_id(*), editor:editado_por_user_id(nome, sobrenome)')
      .eq('topico_id', topicId)
      .order('created_at', { ascending: true });

    if (respostasError) {
        setError('Não foi possível carregar as respostas.');
        console.error("Erro ao buscar respostas:", respostasError);
    } else {
        setRespostas(respostasData);
    }

     if (user) {
      const { data: curtidasData, error: curtidasError } = await supabase
        .from('curtidas').select('topico_id, resposta_id').eq('user_id', user.id);
      
      if (!curtidasError) {
        const curtidasSet = new Set();
        curtidasData.forEach(c => {
          if (c.topico_id) curtidasSet.add(c.topico_id);
          if (c.resposta_id) curtidasSet.add(c.resposta_id);
        });
        setCurtidasUsuario(curtidasSet);
      }
    }
    
    setLoading(false);
  }, [topicId]);

  useEffect(() => {
    fetchDados();
  }, [fetchDados]);

 const handleCurtir = async (post, tipo) => {
    if (!user) {
      alert("Você precisa estar logado para curtir.");
      return;
    }

    const postId = post.id;
    const autorPostId = post.user_id;
    const jaCurtiu = curtidasUsuario.has(postId);
    const incremento = jaCurtiu ? -1 : 1;

    // --- 1. ATUALIZAÇÃO OTIMISTA DA UI ---

    // Atualiza o estado das curtidas do usuário (para mudar a cor do coração)
    setCurtidasUsuario(prev => {
      const novoSet = new Set(prev);
      if (jaCurtiu) {
        novoSet.delete(postId);
      } else {
        novoSet.add(postId);
      }
      return novoSet;
    });

    // Atualiza a contagem de curtidas no perfil do autor (seja no tópico ou na resposta)
    if (tipo === 'topico') {
      setTopico(prevTopico => ({
        ...prevTopico,
        profiles: {
          ...prevTopico.profiles,
          total_curtidas: (prevTopico.profiles.total_curtidas || 0) + incremento
        }
      }));
    } else { // tipo === 'resposta'
      setRespostas(prevRespostas => prevRespostas.map(r => 
        r.id === postId ? {
          ...r,
          profiles: {
            ...r.profiles,
            total_curtidas: (r.profiles.total_curtidas || 0) + incremento
          }
        } : r
      ));
    }

    // --- 2. OPERAÇÃO NO BANCO DE DADOS EM SEGUNDO PLANO ---

    if (jaCurtiu) {
      // DESCURTIR
      const { error } = await supabase.from('curtidas').delete()
        .eq('user_id', user.id)
        .eq(tipo === 'topico' ? 'topico_id' : 'resposta_id', postId);

      // 3. Rollback em caso de erro
      if (error) {
        alert("Erro ao descurtir. A página será atualizada.");
        fetchDados(); // Força a recarga para sincronizar o estado em caso de falha
      }
    } else {
      // CURTIR
      const { error } = await supabase.from('curtidas').insert({
        user_id: user.id,
        [tipo === 'topico' ? 'topico_id' : 'resposta_id']: postId,
        autor_post_id: autorPostId
      });

      // 3. Rollback em caso de erro
      if (error) {
        alert("Erro ao curtir. A página será atualizada.");
        fetchDados(); // Força a recarga para sincronizar o estado
      }
    }
  };


  const handleModerateAction = async (action, targetId, payload = {}) => {
    if (!window.confirm(`Você tem certeza que deseja executar a ação "${action}"?`)) return;
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
    if (!window.confirm("Você tem certeza que deseja excluir seu próprio comentário?")) return;
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

  const handleStartEditReply = (resposta) => {
    setEditingReplyId(resposta.id);
    setEditedContent(resposta.conteudo);
    setEditReason('');
    setIsEditingTopic(false);
  };

  const handleSaveEditReply = async () => {
    setEnviando(true);
    const isOwnReply = user && user.id === editingReplyId;
    if (isStaff && !isOwnReply) {
      if (!editedContent.trim() || !editReason.trim()) {
        alert("O conteúdo e o motivo da edição são obrigatórios.");
        setEnviando(false);
        return;
      }
      await handleModerateAction('edit_reply', editingReplyId, {
        newContent: editedContent,
        editReason: editReason,
      });
    } else {
      if (!editedContent.trim()) {
        alert("O conteúdo não pode estar vazio.");
        setEnviando(false);
        return;
      }
      const { error } = await supabase
        .from('respostas')
        .update({
          conteudo: editedContent,
          usuario_editou_em: new Date().toISOString()
        })
        .eq('id', editingReplyId);
      if (error) alert(`Erro ao salvar edição: ${error.message}`);
    }
    setEnviando(false);
    setEditingReplyId(null);
    if (isStaff && !isOwnReply) { /* fetchDados já é chamado em handleModerateAction */ } 
    else { fetchDados(); }
  };

  // --- NOVO: FUNÇÕES PARA EDIÇÃO DO TÓPICO ---
  const handleStartEditTopic = () => {
    setIsEditingTopic(true);
    setEditedContent(topico.conteudo);
    setEditReason('');
    setEditingReplyId(null);
  };

  const handleSaveEditTopic = async () => {
    setEnviando(true);
    if (!editedContent.trim()) {
      alert("O conteúdo não pode estar vazio.");
      setEnviando(false);
      return;
    }
    const updateData = { conteudo: editedContent };
    const isOwnTopic = user && user.id === topico.user_id;

    if (isStaff && !isOwnTopic) {
      if (!editReason.trim()) {
        alert("O motivo da edição é obrigatório para a moderação.");
        setEnviando(false);
        return;
      }
      // Adiciona colunas de moderação (requer que elas existam na tabela 'topicos')
      updateData.editado_em = new Date().toISOString();
      updateData.editado_por_user_id = user.id;
      updateData.motivo_edicao = editReason;
    } else {
      // Adiciona coluna de auto-edição (requer que ela exista na tabela 'topicos')
      updateData.usuario_editou_em = new Date().toISOString();
    }

    const { error } = await supabase
      .from('topicos')
      .update(updateData)
      .eq('id', topicId);

    setEnviando(false);
    if (error) {
      alert(`Erro ao salvar edição do tópico: ${error.message}`);
    } else {
      setIsEditingTopic(false);
      fetchDados();
    }
  };

  if (loading) return <div className="detalhe-container"><p>Carregando tópico...</p></div>;
  if (error) return <div className="detalhe-container"><p className="error-message">{error}</p></div>;
  if (!topico) return <div className="detalhe-container"><p>Tópico não encontrado.</p></div>;

  // --- ALTERADO: Lógica de permissão de edição do tópico corrigida ---
  const isOwnTopic = user && user.id === topico.user_id;
  const isTopicClosed = topico.status === 'fechado';
  const canEditTopic = isStaff || (isOwnTopic && !isTopicClosed);

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
              {/* --- NOVO: Formulário de edição inline para o tópico --- */}
              {isEditingTopic ? (
                <>
                  <RichTextEditor
    content={editedContent}
    onChange={setEditedContent}
/>
                  {isStaff && !isOwnTopic && (
                    <div className="edit-reason-box">
                      <label>Motivo da Edição do Tópico (obrigatório)</label>
                      <input
                        type="text"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="Ex: Correção de título ou conteúdo"
                      />
                    </div>
                  )}
                  <div className="form-resposta-actions">
                    <button className="btn-cancelar-resposta" onClick={() => setIsEditingTopic(false)} disabled={enviando}>Cancelar</button>
                    <button className="btn-publicar" onClick={handleSaveEditTopic} disabled={enviando}>
                      {enviando ? 'Salvando...' : 'Salvar Tópico'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="conteudo-header">
                    <h2>{topico.titulo}</h2>
                    <span>{new Date(topico.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div 
    className="conteudo-texto" 
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(topico.conteudo) }} 
/>
                  
                  {/* NOVO: Exibição do histórico de edição do tópico */}
                  {topico.usuario_editou_em && (
                      <div className="info-edicao">(Editado pelo autor em {new Date(topico.usuario_editou_em).toLocaleDateString('pt-BR')})</div>
                  )}
                  {topico.editado_em && topico.editor && (
                      <div className="info-edicao">
                          Editado por {`${topico.editor.nome} ${topico.editor.sobrenome || ''}`.trim()} em {new Date(topico.editado_em).toLocaleDateString('pt-BR')}: "{topico.motivo_edicao}"
                      </div>
                  )}

                  <div className="reply-actions">
                    {canEditTopic && <button onClick={handleStartEditTopic} className="btn-editar-comentario">Editar Tópico</button>}
                    <svg onClick={() => handleCurtir(topico, 'topico')} className={`icone-curtir ${curtidasUsuario.has(topico.id) ? 'curtido' : ''}`} viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
                  </div>
                </>
              )}
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
                                   <RichTextEditor
    content={editedContent}
    onChange={setEditedContent}
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
                                        <button className="btn-publicar" onClick={handleSaveEditReply} disabled={enviando}>
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
                                <div 
    className="conteudo-texto" 
    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(resposta.conteudo) }} 
/>
                                
                                {resposta.usuario_editou_em && (
                                    <div className="info-edicao">(Editado pelo autor em {new Date(resposta.usuario_editou_em).toLocaleDateString('pt-BR')})</div>
                                )}
                                {resposta.editado_em && resposta.editor && (
                                    <div className="info-edicao">
                                        Editado por {`${resposta.editor.nome} ${resposta.editor.sobrenome || ''}`.trim()} em {new Date(resposta.editado_em).toLocaleDateString('pt-BR')}: "{resposta.motivo_edicao}"
                                    </div>
                                )}

                                <div className="reply-actions">
                                    {canEdit && <button onClick={() => handleStartEditReply(resposta)} className="btn-editar-comentario">Editar</button>}
                                    {canDelete && <button onClick={() => isOwnReply ? handleDeleteOwnReply(resposta.id) : handleModerateAction('delete_reply', resposta.id)} className="btn-excluir-comentario">Excluir</button>}
                                    <svg onClick={() => handleCurtir(resposta, 'resposta')} className={`icone-curtir ${curtidasUsuario.has(resposta.id) ? 'curtido' : ''}`} viewBox="0 0 24 24"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>
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
                    <h4>Respondendo ao tópico de <span className="destaque-nome">{topico.profiles.nome}</span></h4>
                   <RichTextEditor
    content={novaResposta}
    onChange={setNovaResposta}
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