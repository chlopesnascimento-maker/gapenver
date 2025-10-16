// supabase/functions/validate-turnstile/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const { token, userId } = await req.json();

    if (!token || !userId) {
      return new Response(JSON.stringify({ success: false, error: "missing_fields" }), {
        headers: { "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Verifica com a Cloudflare
    const resp = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${Deno.env.get("TURNSTILE_SECRET")}&response=${token}`,
    });
    const result = await resp.json();

    // Cria client service-role
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Loga a tentativa
    await supabase
      .from("captcha_logs")
      .insert({
        user_id: userId,
        ip_address: req.headers.get("x-real-ip") || "unknown",
        token: token,
        valid: result.success,
      });

    // Se falhou, revoga sessão imediatamente
    if (!result.success) {
      await supabase.auth.admin.signOutUser(userId);
      return new Response(JSON.stringify({ success: false, revoked: true }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err) {
    console.error("Erro geral na função validate-turnstile:", err);
    return new Response(JSON.stringify({ success: false, error: "internal_error" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});
