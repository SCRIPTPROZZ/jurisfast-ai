import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useCredits, PLAN_CONFIG } from "@/hooks/useCredits";
import { Check, Gift, Briefcase, Building, Crown, X, Coins, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Gift,
    price: "Grátis",
    period: "para sempre",
    credits: "5/dia (~150/mês)",
    description: "Perfeito para começar",
    features: [
      { text: "5 créditos por dia", included: true },
      { text: "Gerar peças simples", included: true },
      { text: "Revisão básica", included: true },
      { text: "Histórico de 24h", included: true },
      { text: "Exportar Word/PDF", included: false },
      { text: "Análise de PDF", included: false },
    ],
  },
  {
    id: "basico",
    name: "Básico",
    icon: Briefcase,
    price: "R$79",
    period: "/mês",
    credits: "450/mês",
    description: "Para advogados ativos",
    features: [
      { text: "450 créditos/mês", included: true },
      { text: "Gerar peças", included: true },
      { text: "Revisão jurídica", included: true },
      { text: "Histórico de 7 dias", included: true },
      { text: "Exportar texto", included: true },
      { text: "Análise de PDF", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    icon: Crown,
    price: "R$149",
    period: "/mês",
    credits: "1.450/mês",
    description: "Produtividade máxima",
    popular: true,
    features: [
      { text: "1.450 créditos/mês", included: true },
      { text: "Tudo do Básico", included: true },
      { text: "Upload e análise de PDF", included: true },
      { text: "Biblioteca de modelos", included: true },
      { text: "Histórico ilimitado", included: true },
      { text: "Exportar Word e PDF", included: true },
      { text: "Prioridade na geração", included: true },
    ],
  },
  {
    id: "business",
    name: "Business",
    icon: Building,
    price: "R$299",
    period: "/mês",
    credits: "3.450/mês",
    description: "Para escritórios",
    features: [
      { text: "3.450 créditos/mês", included: true },
      { text: "Tudo do Pro", included: true },
      { text: "Multiusuário", included: true },
      { text: "Campos guiados", included: true },
      { text: "Logo do escritório", included: true },
      { text: "Organização por cliente", included: true },
      { text: "API e Webhooks", included: true },
      { text: "Suporte prioritário", included: true },
    ],
  },
];

export default function PlansPage() {
  const { profile } = useAuth();
  const { credits, plan: currentPlan } = useCredits();
  const { toast } = useToast();

  const handleUpgrade = (planId: string) => {
    toast({
      title: "Em breve!",
      description: "O sistema de pagamentos será ativado em breve. Entre em contato para upgrade manual.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Escolha seu plano</h1>
          <p className="text-muted-foreground">
            Aumente sua produtividade com mais créditos e recursos
          </p>
        </div>

        {/* Current Status */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4">
          <Card variant="glow" className="inline-flex">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-primary" />
                <span>Plano atual: <strong className="uppercase">{currentPlan}</strong></span>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-primary" />
                <span><strong>{credits}</strong> créditos</span>
              </div>
            </CardContent>
          </Card>
          
          <Button asChild variant="outline">
            <Link to="/dashboard/creditos">
              <Coins className="w-4 h-4" />
              Comprar créditos extras
            </Link>
          </Button>
        </div>

        {/* Plans Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isCurrent = currentPlan === plan.id;
            return (
              <Card
                key={plan.id}
                variant={plan.popular ? "pricing-featured" : "pricing"}
                className={cn("relative", isCurrent && "ring-2 ring-primary")}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                    Mais popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-juris-success text-white text-xs font-medium rounded-full">
                    Atual
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-3 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <plan.icon className="w-6 h-6" />
                  </div>
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                  <CardDescription className="text-xs">{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-center space-y-4">
                  <div>
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  
                  <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <Coins className="w-4 h-4" />
                    {plan.credits}
                  </div>

                  <ul className="space-y-2 text-left text-sm">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        {feature.included ? (
                          <Check className="w-4 h-4 text-juris-success flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="w-4 h-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                        )}
                        <span className={cn(!feature.included && "text-muted-foreground/50")}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrent ? (
                    <Button variant="outline" className="w-full" disabled>
                      Plano atual
                    </Button>
                  ) : (
                    <Button
                      variant={plan.popular ? "hero" : "outline"}
                      className="w-full"
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {plan.id === "free" ? "Downgrade" : "Assinar"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* Content Module Upsell */}
        <Card variant="glow" className="overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-juris-warning/5" />
          <CardContent className="relative p-8">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-juris-warning flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-2xl font-bold mb-2">JurisFast Content AI</h3>
                <p className="text-muted-foreground mb-4">
                  Gere conteúdo ilimitado para suas redes sociais. Roteiros para Reels, carrosséis, posts e muito mais. <strong>Pagamento único de R$119,99</strong> - sem mensalidades!
                </p>
                <Button asChild variant="hero">
                  <Link to="/dashboard/content">
                    <Sparkles className="w-4 h-4" />
                    Comprar uma vez, usar ilimitado
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FAQ */}
        <Card variant="glass" className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Dúvidas frequentes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">O que acontece se meus créditos acabarem?</h4>
              <p className="text-sm text-muted-foreground">
                Você pode comprar créditos extras a qualquer momento ou aguardar o reset mensal do seu plano.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Créditos extras acumulam?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Créditos comprados separadamente nunca expiram e acumulam com os do seu plano.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Posso cancelar a qualquer momento?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Não há fidelidade. Cancele quando quiser e continue usando até o fim do período pago.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
