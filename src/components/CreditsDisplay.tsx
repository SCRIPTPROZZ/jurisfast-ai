import { Coins, TrendingUp, Calendar } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditsDisplayProps {
  showUpgrade?: boolean;
  compact?: boolean;
  showBreakdown?: boolean;
}

export function CreditsDisplay({ showUpgrade = true, compact = false, showBreakdown = false }: CreditsDisplayProps) {
  const { 
    creditsBalance, 
    monthlyCredits, 
    extraCredits, 
    timeUntilReset,
    resetLabel
  } = useCredits();

  const isLow = creditsBalance <= 50;
  const isCritical = creditsBalance <= 0;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium cursor-help",
              isCritical && "bg-destructive/20 text-destructive",
              isLow && !isCritical && "bg-juris-warning/20 text-juris-warning",
              !isLow && "bg-primary/20 text-primary"
            )}>
              <Coins className="w-4 h-4" />
              <span>{creditsBalance}</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="p-3">
            <div className="space-y-1 text-xs">
              <p className="font-medium">Detalhamento de créditos:</p>
              <p>📅 Mensal: {monthlyCredits}</p>
              <p>💎 Extra: {extraCredits}</p>
              {timeUntilReset && (
                <p className="text-muted-foreground">{resetLabel} em {timeUntilReset}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className={cn(
      "flex flex-col gap-3 px-4 py-3 rounded-xl border transition-all",
      isCritical && "bg-destructive/10 border-destructive/30",
      isLow && !isCritical && "bg-juris-warning/10 border-juris-warning/30",
      !isLow && "bg-primary/10 border-primary/30"
    )}>
      <div className="flex items-center gap-3">
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
            {creditsBalance}
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

      {showBreakdown && (
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="text-xs">
            <span className="text-muted-foreground">Mensal:</span>
            <span className="ml-1 font-medium">{monthlyCredits}</span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">Extra:</span>
            <span className="ml-1 font-medium text-primary">{extraCredits}</span>
          </div>
          {timeUntilReset && (
            <div className="col-span-2 flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span>{resetLabel} em {timeUntilReset}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
