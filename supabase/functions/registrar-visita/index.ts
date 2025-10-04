import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ADICIONADO: O cabeçalho de permissão CORS que estava faltando
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // ADICIONADO: A verificação para a "sondagem" do navegador
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { error } = await supabaseAdmin.from('visitas').insert({});
    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      // ADICIONADO: Headers na resposta de sucesso
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      // ADICIONADO: Headers na resposta de erro
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});