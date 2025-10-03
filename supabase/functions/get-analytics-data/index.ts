import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { google } from "https://esm.sh/googleapis@105.0.0";

// Headers de CORS para permitir que seu site acesse a função
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Resposta padrão para pre-flight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // --- SEGURANÇA: Garante que apenas um admin logado pode chamar esta função ---
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error("Acesso negado: Requer autenticação.");
    
    const { data: profile } = await supabaseClient.from('profiles').select('cargo').eq('id', user.id).single();
    if (profile?.cargo !== 'admin') {
      throw new Error("Acesso negado: Requer privilégios de Administrador.");
    }
    // --- FIM DA SEGURANÇA ---


    // 1. Pega os segredos que configuramos
    const GA_PROPERTY_ID = Deno.env.get("GA_PROPERTY_ID");
    const GA_PROJECT_ID = Deno.env.get("GA_PROJECT_ID");
    const GA_CLIENT_EMAIL = Deno.env.get("GA_CLIENT_EMAIL");
    const GA_PRIVATE_KEY = Deno.env.get("GA_PRIVATE_KEY");

    if (!GA_PROPERTY_ID || !GA_PROJECT_ID || !GA_CLIENT_EMAIL || !GA_PRIVATE_KEY) {
      throw new Error("Variáveis de ambiente do Google Analytics não configuradas.");
    }
    
    // 2. Autentica no Google usando a Conta de Serviço
    const auth = new google.auth.GoogleAuth({
      projectId: GA_PROJECT_ID,
      credentials: {
        client_email: GA_CLIENT_EMAIL,
        private_key: GA_PRIVATE_KEY,
      },
      scopes: ["https://www.googleapis.com/auth/analytics.readonly"],
    });

    const analyticsData = google.analyticsdata({ version: "v1beta", auth });

    // 3. Pede ao Google um relatório de usuários por país e gênero dos últimos 7 dias
    const [response] = await analyticsData.properties.runReport({
      property: `properties/${GA_PROPERTY_ID}`,
      requestBody: {
        dateRanges: [{ startDate: "7daysAgo", endDate: "today" }],
        dimensions: [{ name: "country" }, { name: "userGender" }],
        metrics: [{ name: "activeUsers" }],
      },
    });
    
    // 4. Formata os dados para facilitar o uso no React
    const formattedData = {
      paises: [],
      genero: { 'male': 0, 'female': 0, 'unknown': 0 }
    };

    if (response.rows) {
        // Exemplo simples de formatação. Podemos refinar isso depois.
        const paisesCount = {};
        response.rows.forEach(row => {
            const pais = row.dimensionValues[0].value;
            const genero = row.dimensionValues[1].value.toLowerCase();
            const usuarios = parseInt(row.metricValues[0].value, 10);

            // Contagem por país
            if (paisesCount[pais]) {
                paisesCount[pais] += usuarios;
            } else {
                paisesCount[pais] = usuarios;
            }

            // Contagem por gênero
            if (formattedData.genero.hasOwnProperty(genero)) {
                formattedData.genero[genero] += usuarios;
            }
        });

        formattedData.paises = Object.entries(paisesCount).map(([nome, visitas]) => ({ nome, visitas }));
    }

    return new Response(JSON.stringify(formattedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});