import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Cabeçalhos CORS para permitir que seu site na Vercel acesse a função
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // Permite qualquer origem, ou seja, seu site
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

serve(async (req) => {
  // O navegador envia uma requisição "OPTIONS" antes da requisição real para checar o CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization")!;
    
    const { data: { user } } = await createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
    ).auth.getUser();

    if (!user) {
      throw new Error("Usuário não encontrado ou token inválido.");
    }

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      throw deleteError;
    }

    return new Response(JSON.stringify({ message: "Usuário deletado com sucesso!" }), {
      // Adiciona os cabeçalhos CORS na resposta de sucesso
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
    
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      // Adiciona os cabeçalhos CORS na resposta de erro
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});