interface LogoProps {
  className?: string;
}

export function Logo({ className = "" }: LogoProps) {
  return (
    <div className={`flex items-center flex-shrink-0 ${className}`}>
      <img 
        src="/jurisfast-ai/logo.png" 
        alt="JurisFast AI" 
        style={{
          height: "36px",
          width: "auto",
          display: "block",
          objectFit: "contain",
        }}
        onError={(e) => {
          console.error("Logo failed to load");
        }}
      />
    </div>
  );
}
