import { Card, CardContent } from "@/components/ui/card";
import { Zap, FileText, MessageSquare, History } from "lucide-react";

const benefits = [
  {
    icon: Zap,
    title: "Gere peças em minutos",
    description: "Petições, recursos e pareceres com IA avançada. Economize horas de trabalho.",
  },
  {
    icon: FileText,
    title: "Resuma contratos extensos",
    description: "Análise rápida de contratos com identificação de cláusulas críticas e riscos.",
  },
  {
    icon: MessageSquare,
    title: "Crie respostas profissionais",
    description: "Gere comunicações jurídicas claras e profissionais em segundos.",
  },
  {
    icon: History,
    title: "Histórico organizado",
    description: "Todos os seus documentos salvos e organizados para fácil acesso.",
  },
];

export function Benefits() {
  return (
    <section className="py-24 relative">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Por que usar o <span className="gradient-text">JurisFast AI</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Ferramentas poderosas para acelerar seu trabalho jurídico
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <Card
              key={benefit.title}
              variant="interactive"
              className="group animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className="mb-4 inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-300">
                  <benefit.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{benefit.title}</h3>
                <p className="text-muted-foreground text-sm">{benefit.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
