import { Logo } from "@/components/Logo";
import { AlertTriangle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/50">
      <div className="container px-4 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-juris-warning/10 px-4 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-juris-warning" />
            <span>
              O conteúdo gerado pelo JurisFast AI é apenas auxiliar e deve ser revisado por um advogado antes do uso oficial.
            </span>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} JurisFast AI. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
