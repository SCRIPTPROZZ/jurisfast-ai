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
    const { text, summaryType } = await req.json();

    if (!text || !summaryType) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: text, summaryType" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
if (!GOOGLE_API_KEY) {
  console.error("GOOGLE_API_KEY not configured");
  return new Response(
    JSON.stringify({ error: "Chave do Google não configurada" }),
    { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

    let summaryInstruction = "";
    switch (summaryType) {
      case "simples":
        summaryInstruction = "Faça um resumo executivo simples e objetivo do contrato, destacando os principais pontos.";
        break;
      case "tecnico":
        summaryInstruction = "Faça uma análise técnica detalhada do contrato, explicando cada cláusula importante e suas implicações jurídicas.";
        break;
      case "riscos":
        summaryInstruction = "Analise o contrato focando em identificar riscos, cláusulas abusivas, pontos de atenção e possíveis problemas legais.";
        break;
      default:
        summaryInstruction = "Faça um resumo geral do contrato.";
    }

    const systemPrompt = `Você é um assistente jurídico especializado em análise de contratos brasileiros.
Você deve analisar contratos de forma profissional e detalhada.
Sempre use linguagem técnica apropriada mas também acessível.
Sua resposta deve ser em formato JSON válido.`;

    const userPrompt = `${summaryInstruction}

Contrato para análise:
${text}

Responda APENAS com um objeto JSON válido no seguinte formato (sem markdown, sem código, apenas JSON puro):
{
  "summary": "O resumo completo do contrato aqui",
  "keyPoints": ["Ponto importante 1", "Ponto importante 2", "Ponto importante 3"],
  "alerts": ["Alerta ou risco 1", "Alerta ou risco 2"]
}

Se não houver alertas ou riscos relevantes, retorne um array vazio para alerts.`;

    console.log(`Summarizing contract with type: ${summaryType}`);

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
        JSON.stringify({ error: "Erro ao resumir contrato" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    // Try to parse JSON from response
    let result;
    try {
      // Remove markdown code blocks if present
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback structure
      result = {
        summary: content,
        keyPoints: [],
        alerts: [],
      };
    }

    console.log("Contract summarized successfully");

    // === SERVER-SIDE CREDIT DEBIT (after successful generation) ===
    const { error: debitError } = await supabase.rpc("debit_credits", {
      p_user_id: user.id,
      p_credits: CREDITS_REQUIRED,
      p_action_type: "summarize_contract",
      p_description: `Resumo de contrato: ${summaryType}`,
    });

    if (debitError) {
      console.error("Credit debit error:", debitError.message);
    } else {
      console.log(`Debited ${CREDITS_REQUIRED} credits from user ${user.id}`);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in summarize-contract:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
