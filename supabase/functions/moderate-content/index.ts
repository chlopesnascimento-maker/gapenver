import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
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
    const { action, targetId } = await req.json();
    if (!action || !targetId) {
      throw new Error("Ação e ID do alvo são obrigatórios.");
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: callerUser } } = await supabaseClient.auth.getUser();
    const callerRole = (callerUser?.app_metadata?.roles?.[0] || "default").toLowerCase();
    const STAFF_ROLES = ["admin", "oficialreal", "guardareal"];

    if (!STAFF_ROLES.includes(callerRole)) {
      throw new Error("Acesso negado: Requer privilégios de Staff.");
    }

    // Executa a ação de moderação
    switch (action) {
      case "close_topic":
        const { error: closeError } = await supabaseAdmin.from("topicos").update({ status: 'fechado' }).eq("id", targetId);
        if (closeError) throw closeError;
        break;

      // ==========================================================
      // ADIÇÃO: Novo case para reabrir o tópico
      // ==========================================================
      case "open_topic":
        const { error: openError } = await supabaseAdmin.from("topicos").update({ status: 'aberto' }).eq("id", targetId);
        if (openError) throw openError;
        break;

      case "delete_topic":
        const { error: deleteTopicError } = await supabaseAdmin.from("topicos").delete().eq("id", targetId);
        if (deleteTopicError) throw deleteTopicError;
        break;

      case "delete_reply":
        const { data: replyData, error: replyError } = await supabaseAdmin
          .from('respostas')
          .select('profiles(cargo)')
          .eq('id', targetId)
          .single();
        
        if (replyError) throw replyError;

        const authorRole = replyData.profiles.cargo.toLowerCase();
        if (authorRole === 'admin' && callerRole !== 'admin') {
            throw new Error("Permissão negada: Você não pode excluir um comentário de um Administrador.");
        }

        const { error: deleteReplyError } = await supabaseAdmin.from("respostas").delete().eq("id", targetId);
        if (deleteReplyError) throw deleteReplyError;
        break;
        
      default:
        throw new Error("Ação de moderação inválida.");
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});