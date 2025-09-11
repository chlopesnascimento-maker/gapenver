import { serve } from "https://deno.land/std@0.178.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { emailDestinatario } = await req.json();
    if (!emailDestinatario) throw new Error("E-mail do destinatário é obrigatório.");

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Seu Nome <email@seudominio.com>", // Use o email do seu domínio verificado
        to: [emailDestinatario],
        subject: "Confirmação de Compra - O Reino de Gápenver",
        html: `<h1>Obrigado por sua compra!</h1><p>Aqui estão os próximos passos para sua jornada em Gápenver...</p>`,
      }),
    });

    const data = await res.json();
    if (data.error) throw new Error(data.error.message);

    return new Response(JSON.stringify({ success: true, message: "E-mail enviado!" }), {
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