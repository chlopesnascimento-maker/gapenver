// supabase/functions/update-avatar/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const { user_id, avatar_url } = await req.json();

    const { error } = await supabase.from("profiles")
      .update({ avatar_url })
      .eq("id", user_id);

    if (error) throw error;

    return new Response(
      JSON.stringify({ message: "Avatar atualizado com sucesso!" }),
      { status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
    });
  }
});
