import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between min-h-[56px] md:min-h-[64px] py-2">
          {/* Logo - always visible */}
          <Link to="/" className="flex items-center flex-shrink-0">
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
            <Button asChild variant="ghost" size="sm" className="text-xs md:text-sm px-2 md:px-4 h-8 md:h-9">
              <Link to="/auth?mode=login">Entrar</Link>
            </Button>
            <Button asChild variant="default" size="sm" className="text-xs md:text-sm px-2 md:px-4 h-8 md:h-9">
              <Link to="/auth?mode=signup">Criar conta</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
