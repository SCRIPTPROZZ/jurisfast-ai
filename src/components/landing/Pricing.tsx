import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, Gift, Briefcase, Building } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
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
    cta: "Começar grátis",
    variant: "pricing" as const,
  },
  {
    name: "Pro",
    icon: Briefcase,
    price: "R$69,90",
    period: "/mês",
    description: "Para advogados produtivos",
    features: [
      "50 ações por dia",
      "Resumo de contratos",
      "Histórico completo",
      "Exportar em PDF",
    ],
    cta: "Assinar Pro",
    variant: "pricing-featured" as const,
    popular: true,
  },
  {
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
    ],
    cta: "Assinar Business",
    variant: "pricing" as const,
  },
];

export function Pricing() {
  return (
    <section className="py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent" id="pricing">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Planos <span className="gradient-text">acessíveis</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Escolha o plano ideal para sua necessidade
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              variant={plan.variant}
              className="relative animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
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
                <Button
                  asChild
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                  size="lg"
                >
                  <Link to="/auth?mode=signup">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
