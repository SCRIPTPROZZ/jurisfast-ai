import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import jurisfastLogo from "@/assets/jurisfastai.png";
export function Hero() {
  return <section className="relative w-full flex flex-col items-center justify-center overflow-hidden pt-24 pb-20">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-48 md:w-96 h-48 md:h-96 bg-primary/20 rounded-full blur-3xl opacity-50 animate-pulse-glow pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-32 md:w-64 h-32 md:h-64 bg-primary/10 rounded-full blur-3xl opacity-30 pointer-events-none" />

      <div className="relative z-10 w-full">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="w-full min-h-[52vh] flex flex-col items-center justify-center text-center">

            {/* Logo central */}
            <div className="mb-6 animate-fade-in">
            <img src={jurisfastLogo} alt="JurisFast AI" className="\n    h-20\n    sm:h-24\n    md:h-28\n    lg:h-32\n    w-auto\n    max-w-[320px]\n    sm:max-w-[360px]\n    md:max-w-[40px]\n    object-contain\n    mx-auto\n    mb-4\n    drop-shadow-[0_0_25px_rgba(59,130,246,0.35)]\n  " />

          </div>

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-full bg-primary/10 border border-primary/20 text-primary mb-6 animate-fade-in">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs md:text-sm font-medium">
                Inteligência Artificial Jurídica
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight mb-4 md:mb-6 animate-fade-in-up" style={{
            animationDelay: "0.1s"
          }}>
              <span className="text-foreground">O copiloto jurídico do</span>
              <br />
              <span className="gradient-text">advogado moderno</span>
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-muted-foreground max-w-2xl mb-6 md:mb-8 animate-fade-in-up leading-relaxed" style={{
            animationDelay: "0.2s"
          }}>
              Crie peças, contratos e resuma documentos jurídicos em minutos com
              inteligência artificial.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 animate-fade-in-up" style={{
            animationDelay: "0.3s"
          }}>
              <Button asChild variant="hero" size="lg" className="h-11 md:h-12 text-sm md:text-base px-6 md:px-8">
                <Link to="/auth?mode=signup" className="flex items-center justify-center gap-2">
                  Criar conta grátis
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5" />
                </Link>
              </Button>

              <Button asChild variant="hero-outline" size="lg" className="h-11 md:h-12 text-sm md:text-base px-6 md:px-8">
                <Link to="/auth?mode=login">Fazer login</Link>
              </Button>
            </div>

            {/* Trust */}
            <p className="mt-6 md:mt-10 text-xs md:text-sm text-muted-foreground animate-fade-in" style={{
            animationDelay: "0.4s"
          }}>
              Sem necessidade de cartão de crédito • Comece em segundos
            </p>
          </div>
        </div>
      </div>
    </section>;
}