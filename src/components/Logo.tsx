import jurisfastLogo from "@/assets/jurisfast-logo.png";

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export function Logo({ className = "", showText = true, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "h-24",
    md: "h-32",
    lg: "h-40",
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
