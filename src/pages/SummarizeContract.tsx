import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileSearch, Copy, Check, AlertTriangle, CheckCircle, Info } from "lucide-react";

const summaryTypes = [
  { value: "simples", label: "Resumo Simples", description: "Visão geral do documento" },
  { value: "tecnico", label: "Resumo Técnico", description: "Análise detalhada de cláusulas" },
  { value: "riscos", label: "Análise de Riscos", description: "Identificação de cláusulas problemáticas" },
];

export default function SummarizeContract() {
  const { toast } = useToast();
  const { incrementUsage, canPerformAction } = useUsageLimits();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    text: "",
    summaryType: "",
  });
  const [result, setResult] = useState<{
    summary: string;
    keyPoints: string[];
    alerts: string[];
  } | null>(null);

  const handleSummarize = async () => {
    if (!formData.text || !formData.summaryType) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para resumir o contrato.",
        variant: "destructive",
      });
      return;
    }

    if (!await canPerformAction()) {
      toast({
        title: "Limite atingido",
        description: "Você atingiu seu limite diário. Faça upgrade para continuar.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await supabase.functions.invoke("summarize-contract", {
        body: {
          text: formData.text,
          summaryType: formData.summaryType,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      setResult({
        summary: data.summary,
        keyPoints: data.keyPoints || [],
        alerts: data.alerts || [],
      });

      // Save to database
      await supabase.from("contract_summaries").insert({
        user_id: user?.id,
        original_text: formData.text,
        summary_type: formData.summaryType,
        summary: data.summary,
        key_points: data.keyPoints,
        alerts: data.alerts,
      });

      // Increment usage
      await incrementUsage();

      toast({
        title: "Contrato resumido!",
        description: "O resumo foi gerado e salvo no histórico.",
      });
    } catch (error) {
      console.error("Error summarizing contract:", error);
      toast({
        title: "Erro ao resumir contrato",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = `RESUMO:\n${result.summary}\n\nPONTOS IMPORTANTES:\n${result.keyPoints.join("\n")}\n\nALERTAS:\n${result.alerts.join("\n")}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado!",
      description: "Resumo copiado para a área de transferência.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Resumir Contrato</h1>
          <p className="text-muted-foreground">
            Analise e resuma contratos extensos com inteligência artificial
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Configurações do resumo</CardTitle>
            <CardDescription>
              Cole o texto do contrato e escolha o tipo de análise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Tipo de resumo</Label>
              <Select
                value={formData.summaryType}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, summaryType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de análise" />
                </SelectTrigger>
                <SelectContent>
                  {summaryTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <p className="font-medium">{type.label}</p>
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Texto do contrato</Label>
              <Textarea
                placeholder="Cole aqui o texto do contrato que deseja resumir..."
                className="min-h-[300px] resize-none font-mono text-sm"
                value={formData.text}
                onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
              />
            </div>

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleSummarize}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analisando contrato...
                </>
              ) : (
                <>
                  <FileSearch className="w-5 h-5" />
                  Resumir documento
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-fade-in">
            {/* Summary */}
            <Card variant="glow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Resumo</CardTitle>
                  <CardDescription>Análise gerada pela IA</CardDescription>
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
                      Copiar tudo
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="bg-background rounded-xl p-6 border border-border whitespace-pre-wrap">
                  {result.summary}
                </div>
              </CardContent>
            </Card>

            {/* Key Points */}
            {result.keyPoints.length > 0 && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-juris-success" />
                    Pontos Importantes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Alerts */}
            {result.alerts.length > 0 && (
              <Card className="bg-destructive/5 border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Alertas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.alerts.map((alert, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-destructive mt-1 flex-shrink-0" />
                        <span className="text-sm">{alert}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
