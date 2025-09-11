import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, password, nome, sobrenome } = await req.json();

    // Passo 1: Cria o usuário no sistema de autenticação (como antes)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      // User metadata continua útil para acesso rápido no objeto 'user'
      user_metadata: { nome, sobrenome }, 
    });

    if (authError) throw authError;

    // Pega o ID do usuário recém-criado
    const userId = authData.user.id;

    // Passo 2 (NOVO): Insere os dados na tabela 'profiles'
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId, // Vincula o perfil ao usuário de autenticação
      nome,
      sobrenome,
      // O cargo será 'Viajante' por padrão, como definimos na tabela
    });

    if (profileError) {
      // Se der erro aqui, é uma boa prática deletar o usuário criado para não deixar lixo
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw profileError;
    }

    return new Response(
      JSON.stringify({ success: true, message: "Usuário e perfil criados! E-mail de confirmação enviado." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});