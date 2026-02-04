import jurisfastLogo from "@/assets/jurisfast-logo.png";

interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <img 
        src={jurisfastLogo} 
        alt="JurisFast AI" 
        style={{
          height: "36px",
          width: "auto",
          display: "block",
          objectFit: "contain",
        }}
      />
    </div>
  );
}
