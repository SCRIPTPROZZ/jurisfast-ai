import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Sparkles, 
  Instagram, 
  FileText, 
  Copy, 
  Check, 
  Lock,
  Infinity,
  Zap,
  Crown
} from "lucide-react";
import { cn } from "@/lib/utils";

const contentTypes = [
  { value: "reels", label: "Roteiro para Reels", icon: "🎬" },
  { value: "carrossel", label: "Carrossel Instagram", icon: "📱" },
  { value: "post", label: "Post para Feed", icon: "📝" },
  { value: "stories", label: "Stories", icon: "📸" },
  { value: "linkedin", label: "Post LinkedIn", icon: "💼" },
];

export default function ContentModule() {
  const { hasContentModule } = useCredits();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    topic: "",
  });
  const [result, setResult] = useState("");

  const handleGenerate = async () => {
    if (!formData.type || !formData.topic) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione o tipo de conteúdo e descreva o tema.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await supabase.functions.invoke("generate-content", {
        body: {
          contentType: formData.type,
          topic: formData.topic,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      setResult(response.data.content);

      toast({
        title: "Conteúdo gerado!",
        description: "Seu conteúdo está pronto para usar.",
      });
    } catch (error) {
      console.error("Error generating content:", error);
      toast({
        title: "Erro ao gerar conteúdo",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  const handlePurchase = async () => {
    // TODO: Integrate with payment system
    toast({
      title: "Em breve!",
      description: "Pagamento de R$119,99 pelo módulo de conteúdo será processado.",
    });
  };

  if (!hasContentModule()) {
    return (
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          <Card variant="glow" className="overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-juris-warning/10" />
            <CardHeader className="relative text-center pb-2">
              <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary to-juris-warning flex items-center justify-center">
                <Crown className="w-10 h-10 text-white" />
              </div>
              <CardTitle className="text-3xl">JurisFast Content AI</CardTitle>
              <CardDescription className="text-lg">
                Gere conteúdo ilimitado para suas redes sociais
              </CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-8">
              {/* Price */}
              <div className="text-center">
                <div className="inline-flex items-baseline gap-2">
                  <span className="text-5xl font-bold">R$119,99</span>
                  <span className="text-muted-foreground">pagamento único</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Acesso vitalício • Sem mensalidades • Sem limite de uso
                </p>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Instagram, text: "Roteiros para Reels e Stories" },
                  { icon: FileText, text: "Carrosséis e Posts para Feed" },
                  { icon: Infinity, text: "Uso ilimitado para sempre" },
                  { icon: Zap, text: "Não consome seus créditos mensais" },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <Button
                variant="hero"
                size="lg"
                className="w-full text-lg py-6"
                onClick={handlePurchase}
              >
                <Sparkles className="w-5 h-5" />
                Comprar uma vez e usar ilimitado
              </Button>

              <p className="text-center text-sm text-muted-foreground">
                ⚡ Acesso imediato após a compra
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Content AI</h1>
            <p className="text-muted-foreground">
              Gere conteúdo para suas redes sociais
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-juris-success/20 text-juris-success text-sm font-medium">
            <Infinity className="w-4 h-4" />
            Ilimitado
          </div>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Criar conteúdo</CardTitle>
            <CardDescription>
              Escolha o tipo e descreva o tema para gerar seu conteúdo
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tipo de conteúdo</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {contentTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        {type.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tema / Assunto</Label>
              <Textarea
                placeholder="Ex: Dicas para não cair em golpes financeiros, Direitos do consumidor em compras online..."
                className="min-h-[120px]"
                value={formData.topic}
                onChange={(e) => setFormData((prev) => ({ ...prev, topic: e.target.value }))}
              />
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Gerando..." : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar conteúdo
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card variant="glow" className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Conteúdo Gerado</CardTitle>
                <CardDescription>Copie e use nas suas redes</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </Button>
            </CardHeader>
            <CardContent>
              <div className="bg-background rounded-xl p-6 border border-border whitespace-pre-wrap">
                {result}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
