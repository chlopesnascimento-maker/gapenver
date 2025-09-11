// supabase/functions/update-role/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")! // chave secreta
  );

  try {
    const { user_id, new_role } = await req.json();

    // Atualiza a role no "auth.users"
    const { error } = await supabase.auth.admin.updateUserById(user_id, {
      app_metadata: { role: new_role },
    });

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Role atualizada com sucesso!" }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    });
  }
});
