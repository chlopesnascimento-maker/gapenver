import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

// Pega as variáveis de ambiente
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const resendKey = Deno.env.get("RESEND_API_KEY")!;

// Inicia os clientes do Supabase e Resend
const supabase = createClient(supabaseUrl, supabaseKey);
const resend = new Resend(resendKey);

serve(async (req) => {
  try {
    // AGORA TAMBÉM EXTRAI OS DADOS ADICIONAIS DO CORPO DA REQUISIÇÃO
    const { email, password, nome, sobrenome, nascimento } = await req.json();

    // Cria o usuário no Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Importante: vamos usar o link de confirmação do Supabase
      // AGORA ADICIONA OS METADADOS DO USUÁRIO
      user_metadata: { nome, sobrenome, nascimento },
    });

    if (error) throw error;

    // O e-mail de confirmação do Supabase já é enviado automaticamente
    // quando `email_confirm` é `true`. O Resend seria para um e-mail de boas-vindas customizado.
    // Por enquanto, vamos confiar no e-mail padrão do Supabase para simplificar.

    // Se quiser enviar um e-mail de boas-vindas ADICIONAL com Resend, descomente o bloco abaixo.
    /*
    await resend.emails.send({
      from: "Boas Vindas <onboarding@resend.dev>", // Configure seu domínio no Resend
      to: email,
      subject: "Seja bem-vindo(a)!",
      html: `<p>Olá ${nome}, sua conta foi criada com sucesso!</p>`,
    });
    */

    return new Response(
      JSON.stringify({ success: true, message: "Usuário criado! Um e-mail de confirmação foi enviado." }),
      { headers: { "Content-Type": "application/json" }, status: 200 }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { "Content-Type": "application/json" },
      status: 400,
    });
  }
});