import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { Check, Gift, Briefcase, Building, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const plans = [
  {
    id: "free",
    name: "Free",
    icon: Gift,
    price: "Grátis",
    period: "para sempre",
    description: "Perfeito para começar",
    features: [
      "5 ações por dia",
      "Geração de documentos básica",
      "Histórico básico (7 dias)",
      "Suporte por email",
    ],
    current: true,
  },
  {
    id: "pro",
    name: "Pro",
    icon: Briefcase,
    price: "R$69,90",
    period: "/mês",
    description: "Para advogados produtivos",
    features: [
      "50 ações por dia",
      "Resumo de contratos",
      "Histórico completo",
      "Suporte prioritário",
      "Exportar em PDF",
    ],
    popular: true,
  },
  {
    id: "business",
    name: "Business",
    icon: Building,
    price: "R$139,90",
    period: "/mês",
    description: "Para escritórios",
    features: [
      "Uso ilimitado",
      "Todas as funcionalidades",
      "Prioridade de processamento",
      "Recursos avançados",
      "API de integração",
      "Suporte dedicado",
    ],
  },
];

export default function PlansPage() {
  const { profile } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = (planId: string) => {
    toast({
      title: "Em breve!",
      description: "O sistema de pagamentos será ativado em breve. Entre em contato para upgrade manual.",
    });
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Escolha seu plano</h1>
          <p className="text-muted-foreground">
            Aumente sua produtividade com mais recursos
          </p>
        </div>

        {/* Current Plan Badge */}
        {profile && (
          <Card variant="glow" className="max-w-md mx-auto">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className="w-5 h-5 text-primary" />
                <span>
                  Seu plano atual: <strong className="uppercase">{profile.plan}</strong>
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = profile?.plan === plan.id;
            return (
              <Card
                key={plan.id}
                variant={plan.popular ? "pricing-featured" : "pricing"}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                    Mais popular
                  </div>
                )}

                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                    <plan.icon className="w-7 h-7" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                        <span>{feature}</span>
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
                      size="lg"
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {plan.id === "free" ? "Downgrade" : "Fazer upgrade"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <Card variant="glass" className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>Dúvidas sobre os planos?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium mb-1">Posso cancelar a qualquer momento?</h4>
              <p className="text-sm text-muted-foreground">
                Sim! Não há fidelidade. Cancele quando quiser e continue usando até o fim do período pago.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Como funciona o upgrade?</h4>
              <p className="text-sm text-muted-foreground">
                O upgrade é imediato. Você terá acesso aos novos recursos assim que o pagamento for confirmado.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-1">Preciso de cartão de crédito para o plano gratuito?</h4>
              <p className="text-sm text-muted-foreground">
                Não! O plano gratuito não exige nenhuma forma de pagamento.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
