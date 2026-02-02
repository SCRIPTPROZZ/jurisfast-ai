import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "O JurisFast substitui o advogado?",
    answer:
      "Não. O JurisFast AI é uma ferramenta de produtividade que auxilia advogados na criação de documentos. Todo conteúdo gerado deve ser revisado e validado por um profissional habilitado antes de uso oficial.",
  },
  {
    question: "Posso usar grátis?",
    answer:
      "Sim! O plano gratuito permite 5 ações por dia, perfeito para testar e conhecer a plataforma. Você pode fazer upgrade a qualquer momento para aumentar seus limites.",
  },
  {
    question: "Meus dados são seguros?",
    answer:
      "Absolutamente. Utilizamos criptografia de ponta e infraestrutura de nível empresarial. Seus dados são armazenados de forma segura e nunca são compartilhados com terceiros.",
  },
  {
    question: "Posso cancelar quando quiser?",
    answer:
      "Sim, você pode cancelar sua assinatura a qualquer momento. Não há fidelidade nem taxas de cancelamento. Seu plano continuará ativo até o final do período pago.",
  },
  {
    question: "Quais tipos de documentos posso gerar?",
    answer:
      "Você pode gerar petições iniciais, contestações, recursos, pareceres jurídicos, contratos e muito mais. A IA é treinada com modelos jurídicos brasileiros atualizados.",
  },
];

export function FAQ() {
  return (
    <section className="py-24">
      <div className="container px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Perguntas <span className="gradient-text">frequentes</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Tire suas dúvidas sobre o JurisFast AI
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card border border-border rounded-xl px-6 data-[state=open]:border-primary/50 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-5">
                  <span className="font-medium">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
