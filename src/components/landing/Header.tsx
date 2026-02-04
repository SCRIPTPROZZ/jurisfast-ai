import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header 
      className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50"
      style={{ minHeight: "60px" }}
    >
      <div className="container mx-auto px-4 md:px-6">
        <div 
          className="flex items-center justify-between py-3 md:py-4"
          style={{ minHeight: "60px" }}
        >
          {/* Logo - always visible with explicit sizing */}
          <Link 
            to="/" 
            className="flex items-center flex-shrink-0"
            style={{ minWidth: "100px", minHeight: "30px" }}
          >
            <Logo size="sm" />
          </Link>

          {/* Navigation - hidden on mobile */}
          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#pricing" 
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Planos
            </a>
          </nav>

          {/* Action buttons - always visible */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button asChild variant="ghost" size="sm" className="text-xs md:text-sm px-3 md:px-4 h-9">
              <Link to="/auth?mode=login">Entrar</Link>
            </Button>
            <Button asChild variant="default" size="sm" className="text-xs md:text-sm px-3 md:px-4 h-9">
              <Link to="/auth?mode=signup">Criar conta</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
