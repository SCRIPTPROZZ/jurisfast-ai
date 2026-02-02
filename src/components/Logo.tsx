import { Scale, Zap } from "lucide-react";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-6 w-6",
    md: "h-8 w-8",
    lg: "h-10 w-10",
  };

  const textSizeClasses = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="relative flex items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-400 p-2 glow-primary-sm">
          <Scale className={`${sizeClasses[size]} text-primary-foreground`} />
          <Zap className="absolute -right-1 -top-1 h-3 w-3 text-yellow-400 fill-yellow-400" />
        </div>
      </div>
      {showText && (
        <span className={`${textSizeClasses[size]} font-bold tracking-tight`}>
          <span className="text-foreground">Juris</span>
          <span className="gradient-text">Fast</span>
          <span className="text-primary"> AI</span>
        </span>
      )}
    </div>
  );
}
