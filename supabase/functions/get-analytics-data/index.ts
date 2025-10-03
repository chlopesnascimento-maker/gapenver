import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, getNumericDate } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function importPrivateKey(pem) {
  const pemHeader = "-----BEGIN PRIVATE KEY-----";
  const pemFooter = "-----END PRIVATE KEY-----";
  const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length - 1).replace(/\s+/g, '');
  const binaryDer = new Uint8Array(atob(pemContents).split('').map(c => c.charCodeAt(0)));
  return await crypto.subtle.importKey("pkcs8", binaryDer, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, true, ["sign"]);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
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

    const GA_PROPERTY_ID = Deno.env.get("GA_PROPERTY_ID");
    const GA_CLIENT_EMAIL = Deno.env.get("GA_CLIENT_EMAIL");
    const GA_PRIVATE_KEY_PEM = Deno.env.get("GA_PRIVATE_KEY")?.replace(/\\n/g, '\n');
    if (!GA_PROPERTY_ID || !GA_CLIENT_EMAIL || !GA_PRIVATE_KEY_PEM) {
      throw new Error("Variáveis de ambiente do Google Analytics não configuradas.");
    }
    
    const privateKey = await importPrivateKey(GA_PRIVATE_KEY_PEM);
    const jwt = await create({ alg: "RS256", typ: "JWT" }, { iss: GA_CLIENT_EMAIL, scope: "https://www.googleapis.com/auth/analytics.readonly", aud: "https://oauth2.googleapis.com/token", exp: getNumericDate(3600), iat: getNumericDate(0), }, privateKey);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: jwt, }), });
    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.json();
      throw new Error(`Erro ao obter token de acesso: ${errorBody.error_description}`);
    }
    const { access_token } = await tokenResponse.json();
    
    const apiUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${GA_PROPERTY_ID}:runReport`;
    const apiResponse = await fetch(apiUrl, { method: "POST", headers: { "Authorization": `Bearer ${access_token}` }, body: JSON.stringify({ dateRanges: [{ startDate: "7daysAgo", endDate: "today" }], dimensions: [{ name: "country" }, { name: "userGender" }], metrics: [{ name: "activeUsers" }], }), });
    if (!apiResponse.ok) {
      const errorBody = await apiResponse.json();
      throw new Error(`Erro na API do Google: ${errorBody.error.message}`);
    }
    const responseData = await apiResponse.json();
    
    const formattedData = {
      paises: [],
      genero: { 'male': 0, 'female': 0, 'unknown': 0 }
    };

    // A CORREÇÃO ESTAVA AQUI: Usar 'responseData' em vez do 'response' que não existe.
    if (responseData.rows) {
      const paisesCount = {};
      responseData.rows.forEach(row => {
          const pais = row.dimensionValues[0].value;
          const genero = row.dimensionValues[1].value.toLowerCase();
          const usuarios = parseInt(row.metricValues[0].value, 10);
          if (paisesCount[pais]) {
              paisesCount[pais] += usuarios;
          } else {
              paisesCount[pais] = usuarios;
          }
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
    console.error("Erro na Edge Function:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});