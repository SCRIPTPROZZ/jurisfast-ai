import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDITS_REQUIRED = 3;

// Get aspect ratio based on content type
function getAspectRatio(contentType: string): string {
  switch (contentType) {
    case "reels":
    case "stories":
      return "9:16";
    case "carrossel":
    case "post":
      return "1:1";
    case "linkedin":
      return "16:9";
    default:
      return "1:1";
  }
}

// Get image prompt based on content type and topic
function getImagePrompt(contentType: string, topic: string): string {
  const baseStyle = "Professional legal/law firm style, clean corporate design, blue (#2563EB) and white color scheme, modern minimalist typography, high quality, suitable for social media";
  
  const typeSpecific: Record<string, string> = {
    reels: "vertical cover image for Instagram Reels video",
    carrossel: "carousel slide cover image for Instagram",
    post: "square image for Instagram feed post",
    stories: "vertical image for Instagram Stories",
    linkedin: "professional horizontal banner for LinkedIn post",
  };

  const format = typeSpecific[contentType] || "social media image";
  
  return `Create a ${format} about: ${topic}. ${baseStyle}. Include subtle legal icons like scales of justice, gavel, or legal documents as decorative elements. The image should convey trust, professionalism, and expertise. Ultra high resolution.`;
}

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
      .select("credits_balance, has_content_module")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError?.message);
      return new Response(
        JSON.stringify({ error: "Perfil não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user has content module access
    if (!profile.has_content_module) {
      console.error("User does not have content module access");
      return new Response(
        JSON.stringify({ error: "Acesso ao módulo de conteúdo não autorizado" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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

    // Generate text content
    const textResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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

    if (!textResponse.ok) {
      const errorText = await textResponse.text();
      console.error("AI Gateway error (text):", textResponse.status, errorText);
      
      if (textResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (textResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos insuficientes. Entre em contato com o suporte." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ error: "Erro ao gerar conteúdo de texto" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const textData = await textResponse.json();
    const content = textData.choices?.[0]?.message?.content || "";

    console.log("Text content generated successfully");

    // Generate image
    const aspectRatio = getAspectRatio(contentType);
    const imagePrompt = getImagePrompt(contentType, topic);

    console.log(`Generating image with aspect ratio ${aspectRatio}`);

    let imageUrl = null;

    try {
      const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            { role: "user", content: `${imagePrompt} Aspect ratio: ${aspectRatio}.` },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (imageResponse.ok) {
        const imageData = await imageResponse.json();
        imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
        
        if (imageUrl) {
          console.log("Image generated successfully");
        } else {
          console.log("No image URL in response");
        }
      } else {
        const imageError = await imageResponse.text();
        console.error("Image generation failed:", imageResponse.status, imageError);
      }
    } catch (imageError) {
      console.error("Error generating image:", imageError);
    }

    // === SERVER-SIDE CREDIT DEBIT (after successful generation) ===
    const { error: debitError } = await supabase.rpc("debit_credits", {
      p_user_id: user.id,
      p_credits: CREDITS_REQUIRED,
      p_action_type: "generate_content",
      p_description: `Geração de conteúdo: ${contentType} - ${topic}`,
    });

    if (debitError) {
      console.error("Credit debit error:", debitError.message);
    } else {
      console.log(`Debited ${CREDITS_REQUIRED} credits from user ${user.id}`);
    }

    return new Response(
      JSON.stringify({ 
        content,
        imageUrl,
        aspectRatio,
        contentType 
      }),
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
