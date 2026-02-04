import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="container px-4">
        <div className="flex items-center justify-between h-16 md:h-18">
          <Link to="/" className="flex-shrink-0">
            <Logo size="sm" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Planos
            </a>
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <Button asChild variant="ghost" size="sm" className="px-3 md:px-4">
              <Link to="/auth?mode=login">Entrar</Link>
            </Button>
            <Button asChild variant="default" size="sm" className="px-3 md:px-4">
              <Link to="/auth?mode=signup">Criar conta</Link>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
