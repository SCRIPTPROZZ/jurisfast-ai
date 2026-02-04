import jurisfastLogo from "@/assets/jurisfast-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-8 md:h-10",      // 32px mobile, 40px desktop (header)
    md: "h-10 md:h-12",     // 40px mobile, 48px desktop
    lg: "h-12 md:h-14",     // 48px mobile, 56px desktop
  };

  return (
    <div className={`flex items-center ${className}`}>
      <img 
        src={jurisfastLogo} 
        alt="JurisFast AI" 
        className={`${sizeClasses[size]} w-auto object-contain dark:brightness-110`}
      />
    </div>
  );
}
