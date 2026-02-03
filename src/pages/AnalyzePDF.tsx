import { useState, useRef } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCredits, CREDIT_COSTS } from "@/hooks/useCredits";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Loader2, 
  FileText, 
  Upload, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  Lock,
  Coins,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

const analysisTypes = [
  { value: "resumo", label: "Resumir documento", description: "Visão geral do conteúdo", credits: 3 },
  { value: "pontos", label: "Extrair pontos importantes", description: "Lista de destaques", credits: 3 },
  { value: "teses", label: "Sugerir teses", description: "Argumentos jurídicos", credits: 3 },
  { value: "melhorar", label: "Melhorar texto", description: "Reescrever com qualidade", credits: 3 },
];

export default function AnalyzePDF() {
  const { toast } = useToast();
  const { hasFeature, canAfford, debitCredits, credits } = useCredits();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfText, setPdfText] = useState("");
  const [analysisType, setAnalysisType] = useState("");
  const [result, setResult] = useState<{
    content: string;
    highlights?: string[];
    alerts?: string[];
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const hasPdfAccess = hasFeature("pdfAnalysis");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast({
          title: "Arquivo inválido",
          description: "Por favor, selecione um arquivo PDF.",
          variant: "destructive",
        });
        return;
      }
      setPdfFile(file);
      
      // Extract text from PDF (simplified - in production use pdf.js or server-side)
      const reader = new FileReader();
      reader.onload = async () => {
        // For now, we'll send the base64 to the edge function
        setPdfText(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!pdfFile || !analysisType) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um PDF e o tipo de análise.",
        variant: "destructive",
      });
      return;
    }

    if (!canAfford("pdf_analysis")) {
      toast({
        title: "Créditos insuficientes",
        description: `Esta ação requer ${CREDIT_COSTS.pdf_analysis} créditos.`,
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // CRITICAL: Debit credits BEFORE calling AI - server-side first
      const debitSuccess = await debitCredits("pdf_analysis", `Análise de PDF: ${pdfFile.name}`);
      
      if (!debitSuccess) {
        // Credits were not debited (insufficient or error)
        setLoading(false);
        return;
      }

      // Now call the AI service
      const response = await supabase.functions.invoke("analyze-pdf", {
        body: {
          pdfData: pdfText,
          fileName: pdfFile.name,
          analysisType,
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const data = response.data;
      setResult({
        content: data.content,
        highlights: data.highlights || [],
        alerts: data.alerts || [],
      });

      toast({
        title: "Análise concluída!",
        description: "O documento foi analisado com sucesso.",
      });
    } catch (error) {
      console.error("Error analyzing PDF:", error);
      toast({
        title: "Erro ao analisar PDF",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copiado!",
      description: "Conteúdo copiado para a área de transferência.",
    });
  };

  const clearFile = () => {
    setPdfFile(null);
    setPdfText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  if (!hasPdfAccess) {
    return (
      <DashboardLayout>
        <div className="max-w-2xl mx-auto">
          <Card variant="elevated" className="text-center">
            <CardHeader>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted flex items-center justify-center">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <CardTitle>Análise de PDF</CardTitle>
              <CardDescription>
                Esta funcionalidade está disponível apenas nos planos Pro e Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Faça upload de documentos PDF e use a IA para resumir, extrair pontos importantes ou sugerir teses jurídicas.
              </p>
              <Button variant="hero" asChild>
                <Link to="/dashboard/planos">
                  Ver planos
                </Link>
              </Button>
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
            <h1 className="text-2xl font-bold mb-2">Analisar PDF</h1>
            <p className="text-muted-foreground">
              Faça upload de documentos e analise com inteligência artificial
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/20 text-primary text-sm">
            <Coins className="w-4 h-4" />
            {CREDIT_COSTS.pdf_analysis} créditos por análise
          </div>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Upload de documento</CardTitle>
            <CardDescription>
              Selecione um arquivo PDF para análise
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File upload area */}
            <div className="space-y-2">
              <Label>Arquivo PDF</Label>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                ref={fileInputRef}
                className="hidden"
              />
              
              {!pdfFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/50 transition-all"
                >
                  <Upload className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                  <p className="font-medium mb-1">Clique para selecionar um PDF</p>
                  <p className="text-sm text-muted-foreground">ou arraste e solte aqui</p>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 border border-border">
                  <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{pdfFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={clearFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Analysis type */}
            <div className="space-y-2">
              <Label>Tipo de análise</Label>
              <Select
                value={analysisType}
                onValueChange={setAnalysisType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo de análise" />
                </SelectTrigger>
                <SelectContent>
                  {analysisTypes.map((type) => (
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

            <Button
              variant="hero"
              size="lg"
              className="w-full"
              onClick={handleAnalyze}
              disabled={loading || !pdfFile}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analisando documento...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Analisar PDF ({CREDIT_COSTS.pdf_analysis} créditos)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {result && (
          <div className="space-y-6 animate-fade-in">
            <Card variant="glow">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Resultado da Análise</CardTitle>
                  <CardDescription>Conteúdo gerado pela IA</CardDescription>
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
                  {result.content}
                </div>
              </CardContent>
            </Card>

            {result.highlights && result.highlights.length > 0 && (
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-juris-success" />
                    Destaques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {result.highlights.map((point, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Info className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                        <span className="text-sm">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {result.alerts && result.alerts.length > 0 && (
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
