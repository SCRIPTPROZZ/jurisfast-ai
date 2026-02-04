import jurisfastLogo from "@/assets/jurisfast-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  // Fixed pixel sizes for consistency
  const sizeClasses = {
    sm: "h-[30px] md:h-[40px]",   // Header: 30px mobile, 40px desktop
    md: "h-[36px] md:h-[48px]",   // Medium usage
    lg: "h-[42px] md:h-[56px]",   // Large usage
  };

  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <img 
        src={jurisfastLogo} 
        alt="JurisFast AI" 
        className={`${sizeClasses[size]} w-auto object-contain`}
      />
    </div>
  );
}
