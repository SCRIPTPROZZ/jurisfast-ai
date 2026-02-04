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
  Infinity,
  Zap,
  Crown,
  Download,
  Image as ImageIcon,
  Loader2
} from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

const contentTypes = [
  { value: "reels", label: "Roteiro para Reels", icon: "🎬", ratio: "9:16" },
  { value: "carrossel", label: "Carrossel Instagram", icon: "📱", ratio: "1:1" },
  { value: "post", label: "Post para Feed", icon: "📝", ratio: "1:1" },
  { value: "stories", label: "Stories", icon: "📸", ratio: "9:16" },
  { value: "linkedin", label: "Post LinkedIn", icon: "💼", ratio: "16:9" },
];

function getAspectRatioValue(ratio: string): number {
  switch (ratio) {
    case "9:16": return 9 / 16;
    case "16:9": return 16 / 9;
    case "4:5": return 4 / 5;
    default: return 1; // 1:1
  }
}

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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");

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
    setImageUrl(null);

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
      setImageUrl(response.data.imageUrl || null);
      setAspectRatio(response.data.aspectRatio || "1:1");

      toast({
        title: "Conteúdo gerado!",
        description: response.data.imageUrl 
          ? "Texto e imagem prontos para usar."
          : "Texto gerado com sucesso.",
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

  const handleDownloadImage = async (format: "png" | "jpg") => {
    if (!imageUrl) return;

    try {
      // For base64 images
      if (imageUrl.startsWith("data:")) {
        const link = document.createElement("a");
        link.href = imageUrl;
        link.download = `jurisfast-content-${formData.type}-${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // For URL images, fetch and convert
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `jurisfast-content-${formData.type}-${Date.now()}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Download iniciado!",
        description: `Imagem sendo baixada como ${format.toUpperCase()}.`,
      });
    } catch (error) {
      console.error("Error downloading image:", error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a imagem.",
        variant: "destructive",
      });
    }
  };

  const handlePurchase = async () => {
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
              <div className="text-center">
                <div className="inline-flex items-baseline gap-2">
                  <span className="text-5xl font-bold">R$119,99</span>
                  <span className="text-muted-foreground">pagamento único</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Acesso vitalício • Sem mensalidades • Sem limite de uso
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {[
                  { icon: Instagram, text: "Roteiros para Reels e Stories" },
                  { icon: FileText, text: "Carrosséis e Posts para Feed" },
                  { icon: ImageIcon, text: "Geração de imagens com IA" },
                  { icon: Infinity, text: "Uso ilimitado para sempre" },
                  { icon: Zap, text: "Não consome seus créditos mensais" },
                  { icon: Download, text: "Download em PNG e JPG" },
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 rounded-xl bg-muted/50">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <span className="font-medium">{feature.text}</span>
                  </div>
                ))}
              </div>

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

  const selectedType = contentTypes.find(t => t.value === formData.type);

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Content AI</h1>
            <p className="text-muted-foreground">
              Gere texto e imagem para suas redes sociais
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
              Escolha o tipo e descreva o tema para gerar texto + imagem
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
                        <span className="text-xs text-muted-foreground">({type.ratio})</span>
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
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Gerando texto e imagem...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar conteúdo + imagem
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {(result || imageUrl) && (
          <div className="grid md:grid-cols-2 gap-6">
            {/* Text Content */}
            {result && (
              <Card variant="glow" className="animate-fade-in">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Texto Gerado
                    </CardTitle>
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
                  <div className="bg-background rounded-xl p-4 border border-border whitespace-pre-wrap max-h-[400px] overflow-y-auto text-sm">
                    {result}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Image Content */}
            {imageUrl && (
              <Card variant="glow" className="animate-fade-in">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <ImageIcon className="w-5 h-5" />
                        Imagem Gerada
                      </CardTitle>
                      <CardDescription>
                        Formato: {aspectRatio} • {selectedType?.label}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-xl overflow-hidden border border-border bg-muted">
                    <AspectRatio ratio={getAspectRatioValue(aspectRatio)}>
                      <img
                        src={imageUrl}
                        alt="Imagem gerada para conteúdo"
                        className="w-full h-full object-cover"
                      />
                    </AspectRatio>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadImage("png")}
                    >
                      <Download className="w-4 h-4" />
                      PNG
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadImage("jpg")}
                    >
                      <Download className="w-4 h-4" />
                      JPG
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Show only text if no image */}
        {result && !imageUrl && (
          <p className="text-sm text-muted-foreground text-center">
            💡 A imagem não foi gerada nesta sessão. Tente novamente se necessário.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
