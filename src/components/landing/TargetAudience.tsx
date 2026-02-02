import { Users, Building2, Clock, TrendingUp } from "lucide-react";

export function TargetAudience() {
  return (
    <section className="py-24">
      <div className="container px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Para quem é o <span className="gradient-text">JurisFast AI</span>?
              </h2>
              <p className="text-muted-foreground text-lg mb-8">
                O JurisFast AI foi feito para advogados e escritórios que desejam economizar tempo, reduzir retrabalho e aumentar produtividade jurídica.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Users className="w-5 h-5" />
                  </div>
                  <span>Advogados autônomos</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span>Escritórios de advocacia</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <Clock className="w-5 h-5" />
                  </div>
                  <span>Profissionais que valorizam tempo</span>
                </div>
                <div className="flex items-center gap-3 text-foreground">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <span>Quem busca produtividade máxima</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-blue-500/10 rounded-3xl blur-3xl" />
              <div className="relative bg-card border border-border rounded-3xl p-8 shadow-xl">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <span className="text-3xl">⚖️</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-primary">80%</div>
                      <div className="text-sm text-muted-foreground">menos tempo</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-juris-success/10 flex items-center justify-center">
                      <span className="text-3xl">📄</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-juris-success">10x</div>
                      <div className="text-sm text-muted-foreground">mais produtivo</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-juris-warning/10 flex items-center justify-center">
                      <span className="text-3xl">⚡</span>
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-juris-warning">2min</div>
                      <div className="text-sm text-muted-foreground">para gerar documento</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
