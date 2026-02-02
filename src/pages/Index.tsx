import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { Benefits } from "@/components/landing/Benefits";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { TargetAudience } from "@/components/landing/TargetAudience";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";

const LandingPage = () => {
  const { user, loading } = useAuth();

  // Redirect to dashboard if already logged in
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-16">
        <Hero />
        <Benefits />
        <HowItWorks />
        <TargetAudience />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
};

export default LandingPage;
