import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDITS_REQUIRED = 2;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // === AUTHENTICATION ===
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Authenticated user: ${user.id}`);

    // === SERVER-SIDE CREDIT CHECK ===
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits_balance")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError?.message);
      return new Response(
        JSON.stringify({ error: "Perfil não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profile.credits_balance < CREDITS_REQUIRED) {
      console.error(`Insufficient credits: ${profile.credits_balance} < ${CREDITS_REQUIRED}`);
      return new Response(
        JSON.stringify({ error: "Créditos insuficientes", required: CREDITS_REQUIRED, available: profile.credits_balance }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === PARSE REQUEST ===
    const { type, area, input } = await req.json();

    if (!type || !area || !input) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: type, area, input" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Serviço de IA não configurado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Você é um assistente jurídico especializado em criar documentos jurídicos brasileiros.
Você deve criar documentos profissionais, bem estruturados e seguindo as normas técnicas do direito brasileiro.
Sempre use linguagem formal e técnica apropriada para documentos jurídicos.
Inclua todas as partes necessárias do documento solicitado.
Os documentos devem estar formatados corretamente e prontos para uso (após revisão por advogado).`;

    const userPrompt = `Crie um documento do tipo: ${type}
Área do Direito: ${area}

Dados do caso:
${input}

Por favor, gere o documento completo, bem estruturado e profissional.`;

    console.log(`Generating document: ${type} for area: ${area}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao gerar documento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const output = data.choices?.[0]?.message?.content || "";

    console.log("Document generated successfully");

    // === SERVER-SIDE CREDIT DEBIT (after successful generation) ===
    const { error: debitError } = await supabase.rpc("debit_credits", {
      p_user_id: user.id,
      p_credits: CREDITS_REQUIRED,
      p_action_type: "generate_document",
      p_description: `Geração de documento: ${type} - ${area}`,
    });

    if (debitError) {
      console.error("Credit debit error:", debitError.message);
      // Still return the document since AI generation succeeded
    } else {
      console.log(`Debited ${CREDITS_REQUIRED} credits from user ${user.id}`);
    }

    return new Response(
      JSON.stringify({ output }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-document:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
