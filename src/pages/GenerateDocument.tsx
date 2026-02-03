import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCredits, CREDIT_COSTS } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Sparkles, Copy, Check, Coins } from "lucide-react";

const documentTypes = [
  { value: "peticao-inicial", label: "Petição Inicial", credits: CREDIT_COSTS.generate_simple },
  { value: "contestacao", label: "Contestação", credits: CREDIT_COSTS.generate_simple },
  { value: "recurso", label: "Recurso", credits: CREDIT_COSTS.legal_review },
  { value: "parecer", label: "Parecer Jurídico", credits: CREDIT_COSTS.legal_review },
  { value: "contrato", label: "Contrato", credits: CREDIT_COSTS.generate_simple },
  { value: "notificacao", label: "Notificação Extrajudicial", credits: CREDIT_COSTS.generate_simple },
  { value: "peticao-longa", label: "Petição Longa (Completa)", credits: CREDIT_COSTS.long_petition },
];

const legalAreas = [
  { value: "civil", label: "Direito Civil" },
  { value: "trabalhista", label: "Direito Trabalhista" },
  { value: "penal", label: "Direito Penal" },
  { value: "tributario", label: "Direito Tributário" },
  { value: "administrativo", label: "Direito Administrativo" },
  { value: "empresarial", label: "Direito Empresarial" },
  { value: "consumidor", label: "Direito do Consumidor" },
  { value: "familia", label: "Direito de Família" },
];

export default function GenerateDocument() {
  const { toast } = useToast();
  const { credits, canAfford, debitCredits } = useCredits();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    type: "",
    area: "",
    input: "",
  });
  const [result, setResult] = useState("");

  const selectedDocType = documentTypes.find(d => d.value === formData.type);
  const creditCost = selectedDocType?.credits || CREDIT_COSTS.generate_simple;

  const getActionType = () => {
    if (formData.type === "peticao-longa") return "long_petition";
    if (["recurso", "parecer"].includes(formData.type)) return "legal_review";
    return "generate_simple";
  };

  const handleGenerate = async () => {
    if (!formData.type || !formData.area || !formData.input) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos para gerar o documento.",
        variant: "destructive",
      });
      return;
    }

    const actionType = getActionType();
    
    if (!canAfford(actionType)) {
      toast({
        title: "Créditos insuficientes",
        description: `Esta ação requer ${creditCost} crédito(s). Você tem ${credits}.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult("");

    try {
      const response = await supabase.functions.invoke("generate-document", {
        body: {
          type: selectedDocType?.label,
          area: legalAreas.find(a => a.value === formData.area)?.label,
          input: formData.input,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const output = response.data.output;
      setResult(output);

      // Save to database
      await supabase.from("documents").insert({
        user_id: user?.id,
        type: formData.type,
        area: formData.area,
        input: formData.input,
        output: output,
      });

      // Debit credits
      await debitCredits(actionType, `Geração: ${selectedDocType?.label}`);

      toast({
        title: "Documento gerado!",
        description: "Seu documento foi criado e salvo no histórico.",
      });
    } catch (error) {
      console.error("Error generating document:", error);
      toast({
        title: "Erro ao gerar documento",
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
      description: "Documento copiado para a área de transferência.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">Gerar Documento</h1>
            <p className="text-muted-foreground">
              Crie documentos jurídicos profissionais com inteligência artificial
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm">
            <Coins className="w-4 h-4" />
            {credits} créditos
          </div>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Configurações do documento</CardTitle>
            <CardDescription>
              Preencha os dados abaixo para gerar seu documento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de documento</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{type.label}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            ({type.credits} créd.)
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Área do Direito</Label>
                <Select
                  value={formData.area}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, area: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a área" />
                  </SelectTrigger>
                  <SelectContent>
                    {legalAreas.map((area) => (
                      <SelectItem key={area.value} value={area.value}>
                        {area.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Dados do caso</Label>
              <Textarea
                placeholder="Descreva os fatos, partes envolvidas, pretensão e demais informações relevantes..."
                className="min-h-[200px] resize-none"
                value={formData.input}
                onChange={(e) => setFormData((prev) => ({ ...prev, input: e.target.value }))}
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
                  Gerando documento...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Gerar com IA ({creditCost} crédito{creditCost > 1 ? "s" : ""})
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <Card variant="glow" className="animate-fade-in">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Documento Gerado</CardTitle>
                <CardDescription>Revise e edite conforme necessário</CardDescription>
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
              <div className="bg-background rounded-xl p-6 border border-border whitespace-pre-wrap font-mono text-sm">
                {result}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
