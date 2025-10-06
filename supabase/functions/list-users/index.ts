import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user } } = await userClient.auth.getUser()
    if (!user) throw new Error("Usuário não autenticado.");

    const { data: callerProfile, error: callerError } = await userClient
      .from('profiles')
      .select('cargo')
      .eq('id', user.id)
      .single();

    if (callerError) throw new Error("Não foi possível verificar o perfil do autor da chamada.");

    const callerRole = callerProfile?.cargo?.toLowerCase() || 'default';
    const allowedStaffRoles = ['admin', 'oficialreal', 'guardareal', 'autor'];

    if (!allowedStaffRoles.includes(callerRole)) {
      throw new Error("Acesso negado: Você não tem permissão para esta ação.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      const { data: { users }, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
      if (usersError) throw usersError;

      const roleRanks = { autor: 0, admin: 1, oficialreal: 2, guardareal: 3, viajante: 4, banidos: 5, default: 99 };
      const callerRank = roleRanks[callerRole] || roleRanks.default;

      // <-- ===== LÓGICA DE FILTRAGEM FINAL E CORRIGIDA ===== -->
      const filteredUsers = users.filter(targetUser => {
        const targetRole = (targetUser.app_metadata?.roles?.[0] || 'default').toLowerCase();
        
        // REGRA 1: Se quem chama é o 'autor', ele pode ver todo mundo.
        if (callerRole === 'autor') {
          return true;
        }

        // REGRA 2: Se o alvo é o 'autor' (e quem chama não é, por causa da Regra 1),
        // ninguém mais pode vê-lo.
        if (targetRole === 'autor') {
          return false;
        }

        // REGRA 3: Sua lógica de hierarquia original para todos os outros casos.
        const targetRank = roleRanks[targetRole] || roleRanks.default;
        return callerRank <= targetRank;
      });
      
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

    throw new Error("Método não suportado.");

  } catch (error) {
    console.error('ERRO DETALHADO NA EDGE FUNCTION list-users:', error); 
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403,
    });
  }
})