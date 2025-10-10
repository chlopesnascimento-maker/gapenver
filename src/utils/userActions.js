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