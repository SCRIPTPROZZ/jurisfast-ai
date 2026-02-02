import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useUsageLimits } from "@/hooks/useUsageLimits";
import { FileText, FileSearch, History, Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { profile } = useAuth();
  const { getRemainingActions, getLimit } = useUsageLimits();
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    getRemainingActions().then(setRemaining);
  }, [getRemainingActions]);

  const limit = getLimit();

  const quickActions = [
    {
      title: "Gerar Documento",
      description: "Crie petições, contratos e pareceres com IA",
      icon: FileText,
      to: "/dashboard/gerar",
      color: "bg-primary/10 text-primary",
    },
    {
      title: "Resumir Contrato",
      description: "Analise e resuma documentos extensos",
      icon: FileSearch,
      to: "/dashboard/resumir",
      color: "bg-juris-success/10 text-juris-success",
    },
    {
      title: "Ver Histórico",
      description: "Acesse seus documentos salvos",
      icon: History,
      to: "/dashboard/historico",
      color: "bg-juris-warning/10 text-juris-warning",
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Usage Stats */}
        <Card variant="glow">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">Uso diário</h3>
                  <p className="text-sm text-muted-foreground">
                    Plano {profile?.plan?.toUpperCase() || "FREE"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <p className="text-3xl font-bold text-primary">
                    {remaining !== null ? remaining : "..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    de {limit === Infinity ? "∞" : limit} ações restantes
                  </p>
                </div>

                {profile?.plan === "free" && (
                  <Button asChild variant="hero" size="sm">
                    <Link to="/dashboard/planos">
                      Fazer upgrade
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Ações rápidas</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {quickActions.map((action) => (
              <Card key={action.to} variant="interactive" className="group">
                <Link to={action.to}>
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mb-2 group-hover:scale-110 transition-transform`}>
                      <action.icon className="w-6 h-6" />
                    </div>
                    <CardTitle className="text-lg">{action.title}</CardTitle>
                    <CardDescription>{action.description}</CardDescription>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <Card variant="glass">
          <CardHeader>
            <CardTitle>Como começar?</CardTitle>
            <CardDescription>
              Siga estes passos para aproveitar ao máximo o JurisFast AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  1
                </div>
                <div>
                  <h4 className="font-medium mb-1">Escolha a ferramenta</h4>
                  <p className="text-sm text-muted-foreground">
                    Gerar documento ou resumir contrato
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  2
                </div>
                <div>
                  <h4 className="font-medium mb-1">Preencha os dados</h4>
                  <p className="text-sm text-muted-foreground">
                    Informe os detalhes do caso
                  </p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-semibold text-sm">
                  3
                </div>
                <div>
                  <h4 className="font-medium mb-1">Receba o resultado</h4>
                  <p className="text-sm text-muted-foreground">
                    Revise, edite e utilize
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
