import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl opacity-30" />

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-8 animate-fade-in">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Inteligência Artificial Jurídica</span>
          </div>

          {/* Logo */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <Logo size="lg" />
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <span className="text-foreground">O copiloto jurídico do</span>
            <br />
            <span className="gradient-text">advogado moderno</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            Crie peças, contratos e resuma documentos jurídicos em minutos com inteligência artificial.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            <Button asChild variant="hero" size="xl">
              <Link to="/auth?mode=signup">
                Criar conta grátis
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button asChild variant="hero-outline" size="xl">
              <Link to="/auth?mode=login">
                Fazer login
              </Link>
            </Button>
          </div>

          {/* Trust Indicators */}
          <p className="mt-12 text-sm text-muted-foreground animate-fade-in" style={{ animationDelay: "0.5s" }}>
            Sem necessidade de cartão de crédito • Comece em segundos
          </p>
        </div>
      </div>
    </section>
  );
}
