import { useState } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCredits } from "@/hooks/useCredits";
import { CreditsDisplay } from "@/components/CreditsDisplay";
import { Coins, Zap, Star, Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const creditPackages = [
  {
    id: "pack-200",
    credits: 200,
    price: 29,
    popular: false,
    icon: Coins,
    description: "Ideal para uso eventual",
  },
  {
    id: "pack-500",
    credits: 500,
    price: 59,
    popular: true,
    icon: Zap,
    description: "Melhor custo-benefício",
  },
  {
    id: "pack-1000",
    credits: 1000,
    price: 99,
    popular: false,
    icon: Crown,
    description: "Para uso intensivo",
  },
];

export default function BuyCredits() {
  const { creditsBalance, monthlyCredits, extraCredits, plan, daysUntilReset } = useCredits();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);

  const handlePurchase = async (packageId: string, packageCredits: number, price: number) => {
    setLoading(packageId);
    
    // TODO: Integrate with payment system (Stripe)
    // After payment confirmation, call addExtraCredits(packageCredits, 'Compra de pacote')
    toast({
      title: "Em breve!",
      description: `Pagamento de R$${price} para ${packageCredits} créditos será processado.`,
    });

    setTimeout(() => {
      setLoading(null);
    }, 1000);
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-2">Comprar Créditos</h1>
          <p className="text-muted-foreground">
            Adquira créditos extras para continuar usando o JurisFast AI
          </p>
        </div>

        {/* Current credits with breakdown */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Seus créditos atuais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <CreditsDisplay showUpgrade={false} showBreakdown={true} />
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{creditsBalance}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{monthlyCredits}</p>
                <p className="text-xs text-muted-foreground">Mensal</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-juris-success">{extraCredits}</p>
                <p className="text-xs text-muted-foreground">Extra</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Plano atual: <span className="font-medium capitalize">{plan}</span>
              {daysUntilReset !== null && (
                <span className="ml-2">• Reset em {daysUntilReset} dias</span>
              )}
            </p>
          </CardContent>
        </Card>

        {/* Credit packages */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Pacotes de créditos</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {creditPackages.map((pkg) => (
              <Card
                key={pkg.id}
                variant={pkg.popular ? "glow" : "elevated"}
                className={cn(
                  "relative transition-all hover:scale-[1.02]",
                  pkg.popular && "ring-2 ring-primary"
                )}
              >
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Mais popular
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className={cn(
                    "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center",
                    pkg.popular ? "bg-primary/20" : "bg-muted"
                  )}>
                    <pkg.icon className={cn(
                      "w-8 h-8",
                      pkg.popular ? "text-primary" : "text-muted-foreground"
                    )} />
                  </div>
                  <CardTitle className="text-3xl">
                    +{pkg.credits}
                    <span className="text-base font-normal text-muted-foreground ml-2">créditos</span>
                  </CardTitle>
                  <CardDescription>{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                  <div className="text-4xl font-bold">
                    R${pkg.price}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    R${(pkg.price / pkg.credits).toFixed(2)} por crédito
                  </p>
                  <Button
                    variant={pkg.popular ? "hero" : "default"}
                    className="w-full"
                    onClick={() => handlePurchase(pkg.id, pkg.credits, pkg.price)}
                    disabled={loading === pkg.id}
                  >
                    {loading === pkg.id ? "Processando..." : "Comprar agora"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Benefits */}
        <Card variant="elevated">
          <CardHeader>
            <CardTitle>Por que comprar créditos?</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                "Créditos extras nunca expiram",
                "Use em qualquer funcionalidade do sistema",
                "São preservados no reset mensal",
                "Somam ao seu saldo total",
                "Pagamento único, sem assinatura",
              ].map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-juris-success/20 flex items-center justify-center">
                    <Check className="w-4 h-4 text-juris-success" />
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
