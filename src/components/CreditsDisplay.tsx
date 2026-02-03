import { Coins, TrendingUp } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CreditsDisplayProps {
  showUpgrade?: boolean;
  compact?: boolean;
}

export function CreditsDisplay({ showUpgrade = true, compact = false }: CreditsDisplayProps) {
  const { credits, plan } = useCredits();

  const isLow = credits <= 5;
  const isCritical = credits <= 0;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium",
        isCritical && "bg-destructive/20 text-destructive",
        isLow && !isCritical && "bg-juris-warning/20 text-juris-warning",
        !isLow && "bg-primary/20 text-primary"
      )}>
        <Coins className="w-4 h-4" />
        <span>{credits}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-3 px-4 py-2 rounded-xl border transition-all",
      isCritical && "bg-destructive/10 border-destructive/30",
      isLow && !isCritical && "bg-juris-warning/10 border-juris-warning/30",
      !isLow && "bg-primary/10 border-primary/30"
    )}>
      <div className={cn(
        "p-2 rounded-lg",
        isCritical && "bg-destructive/20 text-destructive",
        isLow && !isCritical && "bg-juris-warning/20 text-juris-warning",
        !isLow && "bg-primary/20 text-primary"
      )}>
        <Coins className="w-5 h-5" />
      </div>
      
      <div className="flex-1">
        <p className="text-xs text-muted-foreground">Créditos disponíveis</p>
        <p className={cn(
          "text-lg font-bold",
          isCritical && "text-destructive",
          isLow && !isCritical && "text-juris-warning",
          !isLow && "text-foreground"
        )}>
          {credits}
        </p>
      </div>

      {showUpgrade && (
        <Button variant="outline" size="sm" asChild className="gap-1">
          <Link to="/dashboard/creditos">
            <TrendingUp className="w-4 h-4" />
            {isCritical ? "Comprar" : "Mais"}
          </Link>
        </Button>
      )}
    </div>
  );
}
