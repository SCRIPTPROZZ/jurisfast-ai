import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCredits, CREDIT_COSTS } from "@/hooks/useCredits";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { 
  FileText, 
  FileSearch, 
  History, 
  ArrowRight, 
  FileUp, 
  Sparkles,
  Coins
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { profile } = useAuth();
  const { credits, plan, hasFeature, hasContentModule } = useCredits();

  const quickActions = [
    {
      title: "Gerar Documento",
      description: "Crie petições, contratos e pareceres com IA",
      icon: FileText,
      to: "/dashboard/gerar",
      color: "bg-primary/10 text-primary",
      credits: CREDIT_COSTS.generate_simple,
    },
    {
      title: "Resumir Contrato",
      description: "Analise e resuma documentos extensos",
      icon: FileSearch,
      to: "/dashboard/resumir",
      color: "bg-juris-success/10 text-juris-success",
      credits: CREDIT_COSTS.legal_review,
    },
    {
      title: "Analisar PDF",
      description: "Upload e análise inteligente de documentos",
      icon: FileUp,
      to: "/dashboard/analisar-pdf",
      color: "bg-juris-warning/10 text-juris-warning",
      credits: CREDIT_COSTS.pdf_analysis,
      locked: !hasFeature("pdfAnalysis"),
    },
    {
      title: "Ver Histórico",
      description: "Acesse seus documentos salvos",
      icon: History,
      to: "/dashboard/historico",
      color: "bg-muted text-muted-foreground",
      credits: 0,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Credits Display */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card variant="glow">
            <CardContent className="p-6">
              <CreditsDisplay />
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">
                  Plano <span className="font-medium uppercase">{plan}</span>
                </p>
                {plan === "free" && (
                  <Button asChild variant="hero" size="sm" className="mt-2">
                    <Link to="/dashboard/planos">
                      Fazer upgrade
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Content Module Promo */}
          {!hasContentModule() && (
            <Card variant="glass" className="bg-gradient-to-br from-primary/5 to-juris-warning/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-juris-warning flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">JurisFast Content AI</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Gere conteúdo ilimitado para suas redes sociais por R$119,99 único
                    </p>
                    <Button asChild variant="outline" size="sm">
                      <Link to="/dashboard/content">
                        Saiba mais
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ações rápidas</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickActions.map((action) => (
              <Card 
                key={action.to} 
                variant="interactive" 
                className={`group ${action.locked ? "opacity-75" : ""}`}
              >
                <Link to={action.to}>
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {action.title}
                      {action.locked && (
                        <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          Pro+
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                  {action.credits > 0 && (
                    <CardContent className="pt-0">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Coins className="w-3 h-3" />
                        {action.credits} crédito{action.credits > 1 ? "s" : ""}
                      </div>
                    </CardContent>
                  )}
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Credit Costs Reference */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Custo de créditos</CardTitle>
            <CardDescription>
              Cada ação consome uma quantidade específica de créditos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { name: "Peça simples", credits: CREDIT_COSTS.generate_simple },
                { name: "Revisão jurídica", credits: CREDIT_COSTS.legal_review },
                { name: "Análise de PDF", credits: CREDIT_COSTS.pdf_analysis },
                { name: "Petição longa", credits: CREDIT_COSTS.long_petition },
              ].map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <span className="text-sm">{item.name}</span>
                  <div className="flex items-center gap-1 font-medium text-primary">
                    <Coins className="w-4 h-4" />
                    {item.credits}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
