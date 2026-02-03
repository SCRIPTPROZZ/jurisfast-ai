import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { contentType, topic } = await req.json();

    if (!contentType || !topic) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: contentType, topic" }),
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

    let contentInstruction = "";
    switch (contentType) {
      case "reels":
        contentInstruction = `Crie um roteiro completo para um Reels de Instagram sobre o tema jurídico.
Inclua:
- Gancho inicial (primeiros 3 segundos)
- Desenvolvimento do conteúdo
- Call to action final
- Sugestões de texto na tela
- Duração estimada: 30-60 segundos`;
        break;
      case "carrossel":
        contentInstruction = `Crie um carrossel para Instagram com 8-10 slides sobre o tema jurídico.
Para cada slide inclua:
- Título chamativo
- Texto principal (máximo 150 caracteres)
- Sugestão visual
Finalize com um slide de CTA.`;
        break;
      case "post":
        contentInstruction = `Crie uma legenda de post para Instagram sobre o tema jurídico.
Inclua:
- Abertura que prenda atenção
- Conteúdo informativo
- Hashtags relevantes (5-10)
- Call to action
- Use emojis estrategicamente`;
        break;
      case "stories":
        contentInstruction = `Crie uma sequência de 5-7 Stories para Instagram sobre o tema jurídico.
Para cada story inclua:
- Texto curto e direto
- Sugestão de elemento interativo (enquete, quiz, caixa de perguntas)
- Indicação visual`;
        break;
      case "linkedin":
        contentInstruction = `Crie um post profissional para LinkedIn sobre o tema jurídico.
Inclua:
- Abertura impactante
- Conteúdo com insights valiosos
- Formatação com bullet points quando apropriado
- Conclusão com reflexão
- Hashtags profissionais (3-5)`;
        break;
      default:
        contentInstruction = "Crie conteúdo para redes sociais sobre o tema jurídico.";
    }

    const systemPrompt = `Você é um especialista em marketing jurídico e criação de conteúdo para advogados.
Seu objetivo é criar conteúdo que:
- Eduque o público sobre temas jurídicos
- Posicione o advogado como autoridade
- Gere engajamento nas redes sociais
- Respeite as normas da OAB sobre publicidade
- Seja acessível para leigos mas tecnicamente correto

Sempre use linguagem profissional mas acessível.`;

    const userPrompt = `${contentInstruction}

Tema: ${topic}

Gere o conteúdo completo, pronto para usar. Seja criativo e engajador.`;

    console.log(`Generating ${contentType} content about: ${topic}`);

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
        JSON.stringify({ error: "Erro ao gerar conteúdo" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("Content generated successfully");

    return new Response(
      JSON.stringify({ content }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-content:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
