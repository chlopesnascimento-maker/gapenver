import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import './TopicoDetalhePage.css';

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

  const fetchDados = async () => {
    if (!topicId) {
        setError("ID do tópico não fornecido.");
        setLoading(false);
        return;
    }

    setLoading(true);
    setError(null);

    // 1. Busca os dados do tópico principal e o perfil do autor
    const { data: topicoData, error: topicoError } = await supabase
        .from('topicos')
        .select('*, profiles(*)')
        .eq('id', topicId)
        .single();

    if (topicoError) {
        setError('Não foi possível carregar o tópico.');
        console.error("Erro ao buscar tópico:", topicoError);
        setLoading(false);
        return;
    }
    setTopico(topicoData);

    // 2. Busca as respostas do tópico e os perfis de quem respondeu
    const { data: respostasData, error: respostasError } = await supabase
        .from('respostas')
        .select('*, profiles(*)')
        .eq('topico_id', topicId)
        .order('created_at', { ascending: true });

    if (respostasError) {
        setError('Não foi possível carregar as respostas.');
        console.error("Erro ao buscar respostas:", respostasError);
    } else {
        setRespostas(respostasData);
    }
    
    setLoading(false);
  };

  // Efeito para buscar os dados
  useEffect(() => {
    fetchDados();
  }, [topicId]);

  // Função para enviar uma nova resposta
  const handleEnviarResposta = async (e) => {
    e.preventDefault();
    if (!novaResposta.trim()) return;
    
    setEnviando(true);
    
    const { error: insertError } = await supabase
        .from('respostas')
        .insert({
            conteudo: novaResposta,
            topico_id: topicId,
            user_id: user.id
        });
        
    if (isStaff) {
        await supabase
            .from('topicos')
            .update({ ultima_resposta_staff_at: new Date() })
            .eq('id', topicId);
    }

    setEnviando(false);

    if (insertError) {
        alert('Erro ao enviar resposta.');
        console.error(insertError);
    } else {
        setNovaResposta('');
        setMostrarFormulario(false);
        fetchDados();
    }
  };

  if (loading) return <div className="detalhe-container"><p>Carregando tópico...</p></div>;
  if (error) return <div className="detalhe-container"><p className="error-message">{error}</p></div>;
  if (!topico) return <div className="detalhe-container"><p>Tópico não encontrado.</p></div>;

  return (
    <div className="detalhe-container">
        <button onClick={() => navigateTo('comunidade')} className="btn-voltar">
            &larr; Voltar para a Comunidade
        </button>
        
        <div className="post-card post-principal">
            <div className="autor-card">
                <img src={topico.profiles.foto_url || 'URL_PADRAO'} alt={topico.profiles.nome} />
                <h3>{`${topico.profiles.nome} ${topico.profiles.sobrenome}`}</h3>
                <span className={`cargo-badge cargo-${topico.profiles.cargo}`}>{topico.profiles.cargo}</span>
            </div>
            <div className="conteudo-card">
                <div className="conteudo-header">
                    <h2>{topico.titulo}</h2>
                    <span>{new Date(topico.created_at).toLocaleString('pt-BR')}</span>
                </div>
                <p className="conteudo-texto">{topico.conteudo}</p>
            </div>
        </div>

        <h3 className="titulo-respostas">Respostas ({respostas.length})</h3>
        <div className="lista-respostas">
            {respostas.length > 0 ? (
                respostas.map(resposta => (
                    <div key={resposta.id} className="post-card">
                        <div className="autor-card">
                            <img src={resposta.profiles.foto_url || 'URL_PADRAO'} alt={resposta.profiles.nome} />
                            <h3>{`${resposta.profiles.nome} ${resposta.profiles.sobrenome}`}</h3>
                            <span className={`cargo-badge cargo-${resposta.profiles.cargo}`}>{resposta.profiles.cargo}</span>
                        </div>
                        <div className="conteudo-card">
                            <div className="conteudo-header">
                                <span>{new Date(resposta.created_at).toLocaleString('pt-BR')}</span>
                            </div>
                            <p className="conteudo-texto">{resposta.conteudo}</p>
                        </div>
                    </div>
                ))
            ) : (
                <p className="sem-respostas">Nenhuma resposta ainda. Seja o primeiro a responder!</p>
            )}
        </div>

        {/* O botão/formulário de resposta agora é visível para qualquer usuário logado */}
        {user && !mostrarFormulario && (
            <button className="btn-mostrar-resposta" onClick={() => setMostrarFormulario(true)}>
                Responder a este tópico
            </button>
        )}
        
        {user && mostrarFormulario && (
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
        )}
    </div>
  );
}

export default TopicoDetalhePage;