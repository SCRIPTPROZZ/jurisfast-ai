import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import jurisfastLogo from "@/assets/jurisfast-logo.png";

export function Hero() {
  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-32 md:w-64 h-32 md:h-64 bg-primary/10 rounded-full blur-3xl opacity-30 pointer-events-none" />

      {/* Content container with proper spacing from header */}
      <div className="relative z-10 w-full pt-[72px] md:pt-[80px] pb-8 md:pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Logo */}
            <div className="mb-6 animate-fade-in">
              <img 
                src={jurisfastLogo} 
                alt="JurisFast AI" 
                className="h-28 md:h-36 lg:h-44 w-auto object-contain"
              />
            </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" />
              <span className="text-xs md:text-sm font-medium whitespace-nowrap">Inteligência Artificial Jurídica</span>
            </div>

            {/* Title */}
            <h1 
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4 md:mb-6 animate-fade-in-up px-2"
              style={{ animationDelay: "0.1s" }}
            >
              <span className="text-foreground">O copiloto jurídico do</span>
              <br />
              <span className="gradient-text">advogado moderno</span>
            </h1>

            {/* Subtitle */}
            <p 
              className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-xl md:max-w-2xl mb-6 md:mb-8 px-4 animate-fade-in-up leading-relaxed"
              style={{ animationDelay: "0.2s" }}
            >
              Crie peças, contratos e resuma documentos jurídicos em minutos com inteligência artificial.
            </p>

            {/* CTA Buttons */}
            <div 
              className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto px-4 sm:px-0 animate-fade-in-up"
              style={{ animationDelay: "0.3s" }}
            >
              <Button asChild variant="hero" size="lg" className="w-full sm:w-auto h-11 md:h-12 text-sm md:text-base px-6 md:px-8">
                <Link to="/auth?mode=signup" className="flex items-center justify-center gap-2">
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                </Link>
              </Button>
              <Button asChild variant="hero-outline" size="lg" className="w-full sm:w-auto h-11 md:h-12 text-sm md:text-base px-6 md:px-8">
                <Link to="/auth?mode=login">
                  Fazer login
                </Link>
              </Button>
            </div>

            {/* Trust Indicators */}
            <p 
              className="mt-6 md:mt-10 text-xs md:text-sm text-muted-foreground animate-fade-in px-4"
              style={{ animationDelay: "0.4s" }}
            >
              Sem necessidade de cartão de crédito • Comece em segundos
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
