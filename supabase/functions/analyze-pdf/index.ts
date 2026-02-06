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
    const { pdfData, fileName, analysisType } = await req.json();

    if (!pdfData || !analysisType) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: pdfData, analysisType" }),
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

    // Extract text from base64 PDF (simplified - the actual text extraction would need a library)
    // For now, we'll treat the pdfData as text content that was extracted client-side
    const pdfContent = pdfData.includes("base64,") 
      ? "[Conteúdo do PDF será analisado]" 
      : pdfData;

    let analysisInstruction = "";
    switch (analysisType) {
      case "resumo":
        analysisInstruction = "Faça um resumo executivo completo do documento, destacando os principais pontos e informações relevantes.";
        break;
      case "pontos":
        analysisInstruction = "Extraia todos os pontos importantes do documento em formato de lista, organizando por relevância.";
        break;
      case "teses":
        analysisInstruction = "Analise o documento e sugira teses jurídicas que podem ser utilizadas, com fundamentos legais.";
        break;
      case "melhorar":
        analysisInstruction = "Reescreva o texto do documento de forma mais clara, profissional e juridicamente precisa.";
        break;
      default:
        analysisInstruction = "Analise o documento e forneça insights relevantes.";
    }

    const systemPrompt = `Você é um assistente jurídico especializado em análise de documentos brasileiros.
Você deve analisar documentos de forma profissional e detalhada.
Sempre use linguagem técnica apropriada mas também acessível.
Sua resposta deve ser em formato JSON válido.`;

    const userPrompt = `${analysisInstruction}

Documento para análise (${fileName || "documento.pdf"}):
${pdfContent}

Responda APENAS com um objeto JSON válido no seguinte formato (sem markdown, sem código, apenas JSON puro):
{
  "content": "O resultado principal da análise aqui",
  "highlights": ["Destaque 1", "Destaque 2", "Destaque 3"],
  "alerts": ["Alerta ou ponto de atenção 1", "Alerta 2"]
}

Se não houver alertas relevantes, retorne um array vazio para alerts.`;

    console.log(`Analyzing PDF: ${fileName} with type: ${analysisType}`);

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
        JSON.stringify({ error: "Erro ao analisar documento" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "";

    let result;
    try {
      content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      result = {
        content: content,
        highlights: [],
        alerts: [],
      };
    }

    console.log("PDF analyzed successfully");

    // === SERVER-SIDE CREDIT DEBIT (after successful generation) ===
    const { error: debitError } = await supabase.rpc("debit_credits", {
      p_user_id: user.id,
      p_credits: CREDITS_REQUIRED,
      p_action_type: "analyze_pdf",
      p_description: `Análise de PDF: ${fileName || "documento"} - ${analysisType}`,
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
    console.error("Error in analyze-pdf:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
