import jurisfastLogo from "@/assets/jurisfast-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  // Inline styles for guaranteed sizing
  const sizeStyles = {
    sm: { height: "30px" },   // Mobile default
    md: { height: "36px" },
    lg: { height: "42px" },
  };

  const desktopSizes = {
    sm: 40,   // Desktop: 40px
    md: 48,
    lg: 56,
  };

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <img 
        src={jurisfastLogo} 
        alt="JurisFast AI" 
        style={{
          ...sizeStyles[size],
          width: "auto",
          display: "block",
          objectFit: "contain",
          maxWidth: "none",
        }}
        className="md:!h-[40px]"
        onError={(e) => {
          console.error("Logo failed to load:", jurisfastLogo);
        }}
      />
    </div>
  );
}
