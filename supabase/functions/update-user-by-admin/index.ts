import { serve } from "https://deno.land/std@0.178.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/json",
};

const STAFF_ROLES = ["admin", "oficialreal", "guardareal"];

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      user_id: userIdToUpdate,
      updates = {},
      new_role,
    } = body;

    if (!userIdToUpdate) throw new Error("O ID do usuário é obrigatório.");

    // Cliente autenticado (quem chama a função)
    const authHeader = req.headers.get("Authorization") || "";
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user: callerUser } } = await supabaseClient.auth.getUser();
    const callerRole =
      (callerUser?.app_metadata?.roles?.[0] || "default").toLowerCase();

    if (!STAFF_ROLES.includes(callerRole)) {
      throw new Error("Acesso negado: Requer privilégios de Staff.");
    }

    // Cliente admin (service role) que bypassa o RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Buscar dados do alvo (segurança extra)
    const { data: targetUserData, error: targetUserError } =
      await supabaseAdmin.auth.admin.getUserById(userIdToUpdate);
    if (targetUserError) throw targetUserError;

    const targetUserRole =
      (targetUserData.user.app_metadata?.roles?.[0] || "default").toLowerCase();
    if (targetUserRole === "admin" && callerRole !== "admin") {
      throw new Error(
        "Permissão negada: Você não pode modificar uma conta de Administrador.",
      );
    }

    // --- Construir updates básicos (nome, sobrenome, cargo) ---
    const profileUpdates: Record<string, any> = {};
    if (updates.nome) profileUpdates.nome = updates.nome.trim();
    if (updates.sobrenome) profileUpdates.sobrenome = updates.sobrenome.trim();

    // --- LÓGICA DO TÍTULO (ADIÇÃO) ---
    // Verificamos se o chamador é um admin E se o campo 'titulo' foi enviado na requisição.
    // O 'typeof' é importante para permitir que um título seja definido como uma string vazia ("").
    if (callerRole === 'admin' && typeof updates.titulo !== 'undefined') {
        // Se a condição for verdadeira, adicionamos o título ao objeto de atualizações.
        profileUpdates.titulo = String(updates.titulo).trim();
    }
    // --- FIM DA ADIÇÃO ---

    // Lógica de alteração de Cargo (SUA LÓGICA ORIGINAL, INTACTA)
    if (new_role) {
      const newRoleSanitized = String(new_role).toLowerCase();
      
      if (callerRole === "admin") {
        profileUpdates.cargo = newRoleSanitized;

      } else if (callerRole === "oficialreal") {
        // Oficial Real pode gerenciar Guarda Real e despromover para Viajante/Banido
        const allowedTargetRoles = ["guardareal", "viajante", "banidos"];
        if (allowedTargetRoles.includes(newRoleSanitized)) {
          profileUpdates.cargo = newRoleSanitized;
        } else {
          throw new Error(
            "Oficiais Reais só podem alterar cargos para Guarda Real, Viajante ou Banidos.",
          );
        }
      } else if (callerRole === "guardareal") {
        // Guarda Real só pode despromover para Viajante/Banido
        const allowedTargetRoles = ["viajante", "banidos"];
        if (allowedTargetRoles.includes(newRoleSanitized)) {
          profileUpdates.cargo = newRoleSanitized;
        } else {
          throw new Error(
            "Você só tem permissão para alterar o cargo para Viajante ou Banidos.",
          );
        }
      }
    }

    // --- Atualizar profiles ---
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userIdToUpdate);
      if (profileError) throw profileError;
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: corsHeaders, status: 200 },
    );
  } catch (error: any) {
    console.error("UPDATE ERROR:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? String(error) }),
      { headers: corsHeaders, status: 400 },
    );
  }
});