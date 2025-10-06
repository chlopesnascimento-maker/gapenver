import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") { return new Response("ok", { headers: corsHeaders }); }

  try {
    const { conteudo, topico_id } = await req.json();
    if (!conteudo || !topico_id) throw new Error("Conteúdo e ID do tópico são obrigatórios.");

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    // 1. Insere a nova resposta
    await supabaseAdmin.from("respostas").insert({ conteudo, topico_id, user_id: user.id }).throwOnError();

    // 2. Busca dados essenciais
    const { data: topicData } = await supabaseAdmin.from("topicos").select("user_id, titulo").eq("id", topico_id).single().throwOnError();
    const { data: replierProfile } = await supabaseAdmin.from("profiles").select("nome").eq("id", user.id).single().throwOnError();
    const replierName = replierProfile?.nome || 'Alguém';
    const topicAuthorId = topicData.user_id;

    // 3. NÃO CRIA notificação se o usuário respondeu ao próprio tópico
    if (topicAuthorId === user.id) {
      return new Response(JSON.stringify({ success: true, message: "Self-reply, no notification needed." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 4. LÓGICA DE AGRUPAMENTO: Procura uma notificação existente e não lida para este tópico
    const { data: existingNotif, error: findError } = await supabaseAdmin
      .from("notificacoes")
      .select("id, actors")
      .eq("user_id", topicAuthorId)
      .eq("link_to", `topico/${topico_id}`)
      .eq("type", "nova_resposta")
      .eq("is_read", false)
      .maybeSingle();

    if (findError) throw findError;

    if (existingNotif) {
      // 5A. NOTIFICAÇÃO EXISTE: ATUALIZA ELA!
      const currentActors = existingNotif.actors || [];
      const newActors = [...new Set([...currentActors, user.id])];

      await supabaseAdmin
        .from("notificacoes")
        .update({
          created_at: new Date().toISOString(), // Ressuscita a notificação
          is_read: false,                      // Garante que ela seja marcada como não lida
          actor_id: user.id,
          actors: newActors,
          data: {
            actor_name: replierName,
            topic_title: topicData.titulo,
            other_actors_count: newActors.length - 1,
          },
        })
        .eq("id", existingNotif.id)
        .throwOnError();
    } else {
      // 5B. NOTIFICAÇÃO NÃO EXISTE: CRIA UMA NOVA!
      await supabaseAdmin
        .from("notificacoes")
        .insert({
          user_id: topicAuthorId,
          actor_id: user.id,
          actors: [user.id], // Inicia a lista de atores
          type: "nova_resposta",
          link_to: `topico/${topico_id}`,
          data: {
            actor_name: replierName,
            topic_title: topicData.titulo,
            other_actors_count: 0,
          },
        })
        .throwOnError();
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });
  }
});