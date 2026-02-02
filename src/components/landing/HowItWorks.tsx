import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, FileSearch, Edit3, Sparkles } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: UserPlus,
    title: "Crie sua conta",
    description: "Cadastre-se gratuitamente em segundos",
  },
  {
    step: "02",
    icon: FileSearch,
    title: "Escolha o tipo de documento",
    description: "Petição, contrato, parecer e muito mais",
  },
  {
    step: "03",
    icon: Edit3,
    title: "Preencha os dados",
    description: "Insira as informações do caso",
  },
  {
    step: "04",
    icon: Sparkles,
    title: "Gere ou resuma com IA",
    description: "Receba seu documento em segundos",
  },
];

export function HowItWorks() {
  return (
    <section className="py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
      <div className="container px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Como <span className="gradient-text">funciona</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Simples, rápido e eficiente
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <div
              key={item.step}
              className="relative animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
              )}

              <Card variant="glass" className="relative overflow-hidden">
                <CardContent className="p-6 text-center">
                  {/* Step Number */}
                  <div className="absolute top-4 right-4 text-4xl font-bold text-primary/20">
                    {item.step}
                  </div>

                  {/* Icon */}
                  <div className="mb-4 mx-auto inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary">
                    <item.icon className="w-8 h-8" />
                  </div>

                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
