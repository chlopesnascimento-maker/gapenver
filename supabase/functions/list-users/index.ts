import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Lida com a requisição pre-flight do CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. CRIA O CLIENTE PARA IDENTIFICAR QUEM ESTÁ CHAMANDO A FUNÇÃO
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado.");

    // 2. VERIFICA O CARGO E A PERMISSÃO DO USUÁRIO QUE CHAMA
    const { data: callerProfile, error: callerError } = await userClient
      .from('profiles')
      .select('cargo')
      .eq('id', user.id)
      .single();

    if (callerError) throw new Error("Não foi possível verificar o perfil do autor da chamada.");

    const callerRole = callerProfile?.cargo?.toLowerCase() || 'default';
    const allowedStaffRoles = ['admin', 'oficialreal', 'guardareal'];

    if (!allowedStaffRoles.includes(callerRole)) {
      throw new Error("Acesso negado: Você não tem permissão para esta ação.");
    }

    // 3. CRIA O CLIENTE ADMIN COM SUPERPODERES PARA EXECUTAR AS AÇÕES
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // =============================================================
    // --- ROTA DE LISTAGEM DE USUÁRIOS (O QUE VOCÊ JÁ TINHA) ---
    // =============================================================
    if (req.method === 'GET') {
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (usersError) throw usersError;

      // Sua lógica de hierarquia para LISTAR (perfeita, mantida 100%)
      const roleRanks = { admin: 1, oficialreal: 2, guardareal: 3, viajante: 4, default: 99 };
      const callerRank = roleRanks[callerRole] || roleRanks.default;

      const filteredUsers = users.filter(targetUser => {
        const targetRole = (targetUser.app_metadata?.roles?.[0] || 'default').toLowerCase();
        const targetRank = roleRanks[targetRole] || roleRanks.default;
        return callerRank <= targetRank;
      });

      // Lógica para mesclar com dados do profiles (perfeita, mantida 100%)
      const { data: profiles, error: profilesError } = await supabaseAdmin.from("profiles").select("*");
      if (profilesError) throw profilesError;
      
      const mergedUsers = filteredUsers.map((u) => {
        const profile = profiles.find((p) => p.id === u.id) || {};
        return { ...u, user_metadata: { ...u.user_metadata, ...profile } };
      });

      return new Response(JSON.stringify(mergedUsers), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // =============================================================
    // --- ROTA DE EDIÇÃO DE USUÁRIO (A PARTE QUE FALTAVA) ---
    // =============================================================
    if (req.method === 'PATCH' || req.method === 'POST') {
      const { userIdToUpdate, newUserData } = await req.json();
      if (!userIdToUpdate || !newUserData) {
        throw new Error("Dados insuficientes para atualização.");
      }
      
      // LÓGICA DE SEGURANÇA PARA EDIÇÃO
      // Um oficial/guarda não pode editar um admin
      const { data: targetUser, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(userIdToUpdate);
      if(targetUserError) throw targetUserError;

      const targetRole = (targetUser.user.app_metadata?.roles?.[0] || "").toLowerCase();
      if (targetRole === 'admin' && callerRole !== 'admin') {
         throw new Error("Permissão negada: Você не pode editar um administrador.");
      }

      // ATUALIZA O USUÁRIO NO AUTH
      const { data: updatedAuthUser, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
        userIdToUpdate,
        { app_metadata: { roles: [newUserData.cargo] } } // Atualiza o cargo no Auth
      );
      if (updateAuthError) throw updateAuthError;

      // ATUALIZA O USUÁRIO NA TABELA PROFILES
      const { error: updateProfileError } = await supabaseAdmin
        .from('profiles')
        .update({
          nome: newUserData.nome,
          sobrenome: newUserData.sobrenome,
          foto_url: newUserData.foto_url,
          cargo: newUserData.cargo,
        })
        .eq('id', userIdToUpdate);
      if (updateProfileError) throw updateProfileError;

      return new Response(JSON.stringify({ message: "Usuário atualizado com sucesso!" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Se chegar aqui, é um método não suportado (ex: DELETE)
    throw new Error("Método não suportado.");

  // Bloco NOVO com log detalhado
} catch (error) {
  // A LINHA MAIS IMPORTANTE: Imprime o erro completo no servidor
  console.error('ERRO DETALHADO NA EDGE FUNCTION:', error); 

  return new Response(JSON.stringify({ error: error.message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 403,
  });
}
})