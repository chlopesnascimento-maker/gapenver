// VERSÃO FINAL E À PROVA DE FALHAS PARA 'handle-like-and-notify'

import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type" };

serve(async (req) => {
  if (req.method === "OPTIONS") { return new Response("ok", { headers: corsHeaders }); }

  try {
    const { post_id, post_type } = await req.json();
    if (!post_id || !post_type) throw new Error("ID e tipo do post são obrigatórios.");

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const authHeader = req.headers.get("Authorization")!;
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    // 1. REORDENADO: Busca os dados do post ANTES para obter o autor
    let postAuthorId;
    let topicTitle;
    let topicIdForLink;

    if (post_type === 'topico') {
        const { data: postData } = await supabaseAdmin.from('topicos').select('user_id, titulo').eq('id', post_id).single().throwOnError();
        postAuthorId = postData.user_id;
        topicTitle = postData.titulo;
        topicIdForLink = post_id;
    } else {
        const { data: replyData } = await supabaseAdmin.from('respostas').select('user_id, topico_id').eq('id', post_id).single().throwOnError();
        postAuthorId = replyData.user_id;
        topicIdForLink = replyData.topico_id;
        const { data: topicData } = await supabaseAdmin.from('topicos').select('titulo').eq('id', topicIdForLink).single().throwOnError();
        topicTitle = topicData.titulo || 'seu post';
    }

    // 2. ***** CORREÇÃO PRINCIPAL: USA UPSERT EM VEZ DE INSERT *****
    const postColumn = post_type === 'topico' ? 'topico_id' : 'resposta_id';
    await supabaseAdmin
      .from("curtidas")
      .upsert(
        { user_id: user.id, [postColumn]: post_id, autor_post_id: postAuthorId },
        { onConflict: `user_id,${postColumn}` } // Se o par (usuário, post) já existir, não faz nada
      )
      .throwOnError();

    // 3. Busca o nome de quem curtiu
    const { data: likerProfile } = await supabaseAdmin.from("profiles").select("nome").eq("id", user.id).single().throwOnError();
    const likerName = likerProfile?.nome || 'Alguém';
    
    // 4. Não cria notificação se o usuário curtiu o próprio post
    if (postAuthorId === user.id) {
      return new Response(JSON.stringify({ success: true, message: "Self-like, no notification needed." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // 5. Lógica de Agrupamento (continua a mesma)
    const notifType = post_type === 'topico' ? 'curtida_topico' : 'curtida_resposta';
    const notifLink = `topico/${topicIdForLink}`;
    
    // ... O resto da lógica para criar/atualizar a notificação continua exatamente a mesma ...
    const { data: existingNotif } = await supabaseAdmin.from("notificacoes").select("id, actors").eq("user_id", postAuthorId).eq("type", notifType).eq("is_read", false).eq("link_to", notifLink).maybeSingle();
    if (existingNotif) {
      const currentActors = existingNotif.actors || [];
      const newActors = [...new Set([...currentActors, user.id])];
      await supabaseAdmin.from("notificacoes").update({ created_at: new Date().toISOString(), is_read: false, actor_id: user.id, actors: newActors, data: { actor_name: likerName, post_title: topicTitle, other_actors_count: newActors.length - 1 } }).eq("id", existingNotif.id).throwOnError();
    } else {
      await supabaseAdmin.from("notificacoes").insert({ user_id: postAuthorId, actor_id: user.id, actors: [user.id], type: notifType, link_to: notifLink, data: { actor_name: likerName, post_title: topicTitle, other_actors_count: 0 } }).throwOnError();
    }

    return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("ERRO DETALHADO NA EDGE FUNCTION:", error);
    return new Response(JSON.stringify({ error: error.message }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 });
  }
});