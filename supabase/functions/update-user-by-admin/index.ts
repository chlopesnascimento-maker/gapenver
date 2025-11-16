import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// 1. ADICIONADO O CARGO 'autor' À LISTA DE STAFF
const STAFF_ROLES = ["admin", "oficialreal", "guardareal", "autor"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id: targetUserId, updates = {}, new_role } = await req.json();
    if (!targetUserId) throw new Error("O ID do usuário é obrigatório.");

    // Cliente admin (service role) que bypassa o RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    
    // Cliente autenticado (para saber quem chama a função)
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: callerUser } } = await supabaseClient.auth.getUser();
    if (!callerUser) throw new Error("Ação não autorizada.");
    
    // Busca os perfis tanto de quem chama quanto do alvo para a lógica de permissão
    const { data: callerProfile } = await supabaseAdmin.from('profiles').select('cargo').eq('id', callerUser.id).single();
    const { data: targetProfile } = await supabaseAdmin.from('profiles').select('cargo').eq('id', targetUserId).single();
    
    const callerRole = callerProfile?.cargo || 'default';
    const targetRole = targetProfile?.cargo || 'default';

    if (!STAFF_ROLES.includes(callerRole)) {
      throw new Error("Acesso negado: Requer privilégios de Staff.");
    }
    
    // 2. ===== NOVA LÓGICA DE IMUNIDADE E HIERARQUIA =====
    // REGRA DE IMUNIDADE: Ninguém, nem mesmo outro autor, pode mexer no cargo 'autor'.
    if (targetRole === 'autor') {
      throw new Error("Permissão negada. Este usuário não pode ser modificado.");
    }

    // REGRA DE HIERARQUIA: Apenas o 'autor' pode mexer em um 'admin'.
    if (targetRole === 'admin' && callerRole !== 'autor') {
      throw new Error("Permissão negada. Apenas o Autor pode gerenciar um Administrador.");
    }
    // ===================================================

    // --- Construir updates para a tabela 'profiles' ---
    const profileUpdates: Record<string, any> = {};
    if (updates.nome) profileUpdates.nome = updates.nome.trim();
    if (updates.sobrenome) profileUpdates.sobrenome = updates.sobrenome.trim();
    if (callerRole === 'admin' || callerRole === 'autor') { // Somente admin ou autor podem mudar o título
      if (typeof updates.titulo !== 'undefined') {
        profileUpdates.titulo = String(updates.titulo).trim();
      }
    }
    
    let newRoleSanitized: string | null = null;
    if (new_role) {
      newRoleSanitized = String(new_role).toLowerCase();

      // 3. REGRA DE EXCLUSIVIDADE: Garante que ninguém possa promover um usuário a 'autor'
      if (newRoleSanitized === 'autor') {
        throw new Error("O cargo 'autor' não pode ser atribuído pela interface.");
      }

      // Lógica de permissão de alteração de cargos (adaptada da sua)
      if (callerRole === "admin" || callerRole === "autor") {
        profileUpdates.cargo = newRoleSanitized;
      } else if (callerRole === "oficialreal") {
        const allowed = ["guardareal", "viajante", "banido", "cidadão", "veterano"];
        if (allowed.includes(newRoleSanitized)) profileUpdates.cargo = newRoleSanitized;
        else throw new Error("Oficiais Reais só podem alterar cargos para Guarda Real, Cidadão, Veterano, Viajante ou Banidos.");
      } else if (callerRole === "guardareal") {
        const allowed = ["viajante", "banido", "cidadão", "veterano"];
        if (allowed.includes(newRoleSanitized)) profileUpdates.cargo = newRoleSanitized;
        else throw new Error("Você só tem permissão para alterar o cargo para Cidadão, Veterano, Viajante ou Banidos.");
      }
    }

    // --- Executar Atualizações ---
    // Atualiza a tabela 'profiles'
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin.from("profiles").update(profileUpdates).eq("id", targetUserId);
      if (profileError) throw profileError;
    }

    // 4. IMPORTANTE: Atualiza o 'app_metadata' para manter a consistência
    if (newRoleSanitized) {
        const { error: roleError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
            app_metadata: { roles: [newRoleSanitized] }
        });
        if (roleError) throw roleError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (error: any) {
    console.error("UPDATE USER ERROR:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? String(error) }),
      { headers: corsHeaders, status: 400 },
    );
  }
});