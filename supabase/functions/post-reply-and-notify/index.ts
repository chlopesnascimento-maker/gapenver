// DENTRO DA EDGE FUNCTION 'post-reply-and-notify'

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
    const { conteudo, topico_id } = await req.json();
    if (!conteudo || !topico_id) {
      throw new Error("Conteúdo e ID do tópico são obrigatórios.");
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
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Usuário não autenticado.");

    // 1. Inserir a nova resposta
    const { error: insertError } = await supabaseAdmin
      .from("respostas")
      .insert({ conteudo: conteudo, topico_id: topico_id, user_id: user.id });

    if (insertError) throw insertError;
    
    // 2. Buscar dados do tópico (apenas o necessário)
    const { data: topicData, error: topicError } = await supabaseAdmin
      .from("topicos")
      .select("user_id, titulo") // Simplificado para não pegar o perfil errado
      .eq("id", topico_id)
      .single();

    if (topicError) throw topicError;
    const topicAuthorId = topicData.user_id;

    // 3. ***** CORREÇÃO APLICADA AQUI *****
    //    Buscamos o perfil de quem está respondendo (o 'actor')
    const { data: replierProfile, error: replierError } = await supabaseAdmin
      .from("profiles")
      .select("nome")
      .eq("id", user.id) // Usamos o ID do usuário que fez a chamada
      .single();

    if (replierError) throw replierError;
    const replierName = replierProfile?.nome || 'Alguém';


    // 4. Criar a notificação, SE o autor do tópico não for o mesmo que respondeu
    if (topicAuthorId !== user.id) {
      const { error: notificationError } = await supabaseAdmin
        .from("notificacoes")
        .insert({
          user_id: topicAuthorId,       
          actor_id: user.id,            
          type: "nova_resposta",
          link_to: `topico/${topico_id}`,
          data: {
            actor_name: replierName, // <- AGORA USANDO O NOME CORRETO
            topic_title: topicData.titulo,
          },
        });
        
      if (notificationError) throw notificationError;
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