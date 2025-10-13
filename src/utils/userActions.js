// Em um arquivo como src/utils/userActions.js

import { supabase } from '../supabaseClient'; // Ajuste o caminho se necessário

/**
 * Atualiza o cargo de um usuário no banco de dados.
 * @param {string} userId - O ID do usuário a ser atualizado.
 * @param {string} novoCargo - O novo cargo a ser atribuído (ex: 'Cidadão', 'Guardião').
 * @returns {Promise<{success: boolean, data?: any, error?: any}>}
 */
export const atualizarCargoDoUsuario = async (userId, novoCargo) => {
  // Validação para garantir que os dados necessários foram passados
  if (!userId || !novoCargo) {
    console.error("ID do usuário ou novo cargo não fornecido.");
    return { success: false, error: "Dados insuficientes." };
  }

  const { data, error } = await supabase
    .from('profiles')
    .update({ cargo: novoCargo })
    .eq('id', userId)
    .select() // O .select() é importante para o Supabase retornar o registro atualizado

  if (error) {
    console.error("Erro ao atualizar o cargo:", error);
    return { success: false, error };
  }

  console.log(`Cargo do usuário ${userId} atualizado para: ${novoCargo}`, data);
  return { success: true, data: data[0] };
};

/**
 * Define o reino de um usuário e o promove a Cidadão daquele reino.
 * @param {string} userId - O ID do usuário.
 * @param {string} reinoID - O ID do reino escolhido.
 * @param {string} reinoNome - O nome do reino escolhido (ex: 'Gápenver').
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const jurarLealdadeAoReino = async (userId, reinoID, reinoNome) => {
  if (!userId || !reinoID || !reinoNome) {
    console.error("ID do usuário ou nome do reino não fornecido.");
    return { success: false, error: "Dados insuficientes." };
  }

  // Constrói o novo título dinamicamente
  const novoCargo = `Cidadão de ${reinoNome}`;

  // Atualiza as duas colunas ('reino' e 'cargo') de uma só vez
  const { error } = await supabase
    .from('profiles')
    .update({ 
      reino: reinoID, 
      cargo: novoCargo 
    })
    .eq('id', userId);

  if (error) {
    console.error("Erro ao jurar lealdade:", error);
    return { success: false, error };
  }

  console.log(`Usuário ${userId} agora é um ${novoCargo}.`);
  return { success: true };
};

/**
 * Marca o processo de onboarding de um usuário como concluído.
 * @param {string} userId - O ID do usuário.
 * @returns {Promise<{success: boolean, error?: any}>}
 */
export const marcarOnboardingConcluido = async (userId) => {
  if (!userId) {
    console.error("ID do usuário não fornecido para concluir o onboarding.");
    return { success: false, error: "ID do usuário ausente." };
  }

  const { error } = await supabase
    .from('profiles')
    .update({ onboarding_completed: true })
    .eq('id', userId);

  if (error) {
    console.error("Erro ao marcar onboarding como concluído:", error);
    return { success: false, error };
  }

  console.log(`Onboarding do usuário ${userId} foi marcado como concluído.`);
  return { success: true };
};

/**
 * Marca uma quest específica como concluída para o usuário.
 * Se já existir, não duplica (usa upsert).
 */
export const marcarQuestConcluida = async (maybeUserId, questId) => {
  try {
    if (!questId) {
      console.error("marcarQuestConcluida: questId ausente");
      return { success: false, error: "questId ausente" };
    }

    // 1) pega o user autenticado pelo client (garante que auth.uid() bata)
    const { data: currentUserData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("Erro ao obter usuário autenticado:", userError);
      // continuamos, talvez o caller forneceu o userId, mas logamos o problema
    }
    const authUserId = currentUserData?.user?.id || null;

    // 2) se não temos id autenticado, use o que foi passado (mas logue)
    if (!authUserId && !maybeUserId) {
      console.error("Nenhum userId disponível (nem auth nem param). Abortando.");
      return { success: false, error: "Nenhum userId disponível" };
    }

    const userId = authUserId || maybeUserId;

    // Aviso útil: se o front está passando um userId diferente do auth.uid(), logamos
    if (authUserId && maybeUserId && authUserId !== maybeUserId) {
      console.warn("marcarQuestConcluida: userId passado difere do auth.uid(). Usando auth.uid().",
        { authUserId, maybeUserId });
    }

    // 3) tenta o upsert (onConflict como array)
    const payload = { user_id: userId, quest_id: questId };

    // Usamos upsert, assim não duplicamos linhas; onConflict recebe array de colunas
    const { data, error } = await supabase
      .from('user_quests')
      .upsert([payload], { onConflict: ['user_id', 'quest_id'] })
      .select(); // retorna a linha criada/atualizada

    if (error) {
      // Se for erro de permissão (RLS), vai aparecer aqui — log completo
      console.error("Erro ao upsert user_quests:", error);
      return { success: false, error };
    }

    // sucesso
    return { success: true, data };
  } catch (err) {
    console.error("Exceção em marcarQuestConcluida:", err);
    return { success: false, error: err };
  }
};

export const buscarQuestsConcluidas = async (userId) => {
  try {
    if (!userId) {
      console.error("buscarQuestsConcluidas: userId ausente");
      return [];
    }

    const { data, error } = await supabase
      .from('user_quests')
      .select('quest_id')
      .eq('user_id', userId);

    if (error) {
      console.error("Erro ao buscar quests concluídas:", error);
      return [];
    }

    // retorna apenas os IDs das quests
    return data.map((q) => q.quest_id);
  } catch (err) {
    console.error("Exceção em buscarQuestsConcluidas:", err);
    return [];
  }
};

/**
 * Verifica se o usuário pode trocar de reino, com base nas regras de cooldown progressivo.
 * @returns {Promise<{permitido: boolean, restanteHoras?: number, mensagem?: string}>}
 */
export const podeTrocarReino = async (userId) => {
  try {
    if (!userId) return { permitido: false, mensagem: "Usuário inválido." };

    // 1️⃣ Pega data da quest 'escolher_reino'
    const { data: questData, error: questError } = await supabase
      .from("user_quests")
      .select("completed_at")
      .eq("user_id", userId)
      .eq("quest_id", "escolher_reino")
      .single();

    if (questError) {
      console.warn("Nenhuma quest 'escolher_reino' encontrada:", questError);
    }

    // 2️⃣ Pega info do perfil
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("ultima_troca_reino, trocas_reino_count")
      .eq("id", userId)
      .single();

    if (profileError) throw profileError;

    const agora = new Date();
    const ultimaTroca = profile?.ultima_troca_reino
      ? new Date(profile.ultima_troca_reino)
      : questData?.completed_at
        ? new Date(questData.completed_at)
        : null;

    if (!ultimaTroca) {
      // Usuário novato e sem data → pode trocar livremente
      return { permitido: true };
    }

    const diffHoras = (agora - ultimaTroca) / (1000 * 60 * 60);
    const trocas = profile?.trocas_reino_count || 0;

    // 3️⃣ Define tempo mínimo entre trocas
    let tempoMinimoHoras = 0;
    if (trocas === 0) tempoMinimoHoras = 24;          // primeira troca → 24h
    else if (trocas === 1) tempoMinimoHoras = 7 * 24; // segunda troca → 7 dias
    else if (trocas === 2) tempoMinimoHoras = 10 * 24; // terceira → 10 dias
    else tempoMinimoHoras = 15 * 24;                  // teto → 15 dias

    if (diffHoras < tempoMinimoHoras) {
      const restante = tempoMinimoHoras - diffHoras;
      return {
        permitido: false,
        restanteHoras: restante,
        mensagem: `Você poderá migrar novamente em aproximadamente ${Math.ceil(restante / 24)} dia(s).`
      };
    }

    return { permitido: true };
  } catch (err) {
    console.error("Erro em podeTrocarReino:", err);
    return { permitido: false, mensagem: "Erro ao verificar elegibilidade de troca." };
  }
};


/**
 * Registra uma troca de reino e atualiza cooldown.
 */
export const registrarTrocaDeReino = async (userId, novoReinoId, novoReinoNome) => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("trocas_reino_count")
      .eq("id", userId)
      .single();

    const trocasCount = (profile?.trocas_reino_count || 0) + 1;

    const { error } = await supabase
      .from("profiles")
      .update({
        reino: novoReinoId,
        cargo: `Cidadão de ${novoReinoNome}`,
        ultima_troca_reino: new Date().toISOString(),
        trocas_reino_count: trocasCount,
      })
      .eq("id", userId);

    if (error) throw error;

    return { success: true };
  } catch (err) {
    console.error("Erro ao registrar troca de reino:", err);
    return { success: false, error: err };
  }
};
