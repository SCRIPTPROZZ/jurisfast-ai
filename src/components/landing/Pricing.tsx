import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, X, Gift, Briefcase, Crown, Building, Coins, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    icon: Gift,
    price: "Grátis",
    period: "para sempre",
    credits: "5/dia",
    description: "Perfeito para começar",
    features: [
      { text: "5 créditos por dia", included: true },
      { text: "Gerar peças simples", included: true },
      { text: "Revisão básica", included: true },
      { text: "Histórico de 24h", included: true },
      { text: "Exportar Word/PDF", included: false },
      { text: "Análise de PDF", included: false },
    ],
    cta: "Começar grátis",
    variant: "pricing" as const,
  },
  {
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
    cta: "Assinar Básico",
    variant: "pricing" as const,
  },
  {
    name: "Pro",
    icon: Crown,
    price: "R$149",
    period: "/mês",
    credits: "1.450/mês",
    description: "Produtividade máxima",
    features: [
      { text: "1.450 créditos/mês", included: true },
      { text: "Tudo do Básico", included: true },
      { text: "Análise de PDF", included: true },
      { text: "Biblioteca de modelos", included: true },
      { text: "Histórico ilimitado", included: true },
      { text: "Exportar Word e PDF", included: true },
    ],
    cta: "Assinar Pro",
    variant: "pricing-featured" as const,
    popular: true,
  },
  {
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
      { text: "Logo do escritório", included: true },
      { text: "API e Webhooks", included: true },
      { text: "Suporte prioritário", included: true },
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

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              variant={plan.variant}
              className="relative animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full">
                  Mais popular
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

                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                  <Coins className="w-3 h-3" />
                  {plan.credits}
                </div>

                <ul className="space-y-2 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs">
                      {feature.included ? (
                        <Check className="w-3 h-3 text-juris-success flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-3 h-3 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={cn(!feature.included && "text-muted-foreground/50")}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  asChild
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                >
                  <Link to="/auth?mode=signup">{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Content Module Promo */}
        <div className="mt-16 max-w-3xl mx-auto">
          <Card variant="glow" className="overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-juris-warning/10" />
            <CardContent className="relative p-8 text-center">
              <div className="flex flex-col md:flex-row items-center gap-6 justify-center">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-juris-warning flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-xl font-bold mb-2">JurisFast Content AI</h3>
                  <p className="text-muted-foreground mb-4">
                    Gere conteúdo ilimitado para suas redes sociais. <strong>Pagamento único de R$119,99</strong> — sem mensalidades!
                  </p>
                  <Button asChild variant="hero">
                    <Link to="/auth?mode=signup">
                      <Sparkles className="w-4 h-4" />
                      Comprar uma vez, usar ilimitado
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
