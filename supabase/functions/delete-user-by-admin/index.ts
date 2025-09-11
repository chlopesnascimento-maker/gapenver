import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { user_id } = await req.json();
    if (!user_id) throw new Error("O ID do usuário é obrigatório.");

    // --- INÍCIO DA NOVA LÓGICA DE PERMISSÃO ---
    // 1. Valida se o *chamador* é um admin ou gerenciador
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user: callerUser } } = await supabaseClient.auth.getUser();
    const callerRole = callerUser?.app_metadata?.roles?.[0];

    if (callerRole !== 'admin' && callerRole !== 'oficialreal') {
      throw new Error("Acesso negado: Requer privilégios de Administrador ou Gerenciador.");
    }
    
    // Inicia o cliente Admin para executar a busca e a exclusão
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 2. Valida se o *alvo* não é um admin (a menos que o chamador seja admin)
    const { data: targetUserData, error: targetUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);
    if (targetUserError) throw targetUserError;

    const targetUserRole = targetUserData.user.app_metadata?.roles?.[0];
    if (targetUserRole === 'admin' && callerRole !== 'admin') {
      throw new Error('Acesso negado: Oficiais Reais não podem deletar contas de Administrador.');
    }
    // --- FIM DA NOVA LÓGICA DE PERMISSÃO ---

    // Deleta o usuário alvo
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (deleteError) throw deleteError;

    return new Response(JSON.stringify({ message: "Usuário deletado com sucesso!" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 403, // Usando 403 (Forbidden) para erros de permissão
    });
  }
});