import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, FileText, FileSearch, Eye, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface HistoryItem {
  id: string;
  type: "document" | "summary";
  title: string;
  preview: string;
  content: string;
  created_at: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);

  const fetchHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch documents
      const { data: documents } = await supabase
        .from("documents")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // Fetch summaries
      const { data: summaries } = await supabase
        .from("contract_summaries")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      const formattedDocs: HistoryItem[] = (documents || []).map((doc) => ({
        id: doc.id,
        type: "document",
        title: `${doc.type} - ${doc.area}`,
        preview: doc.output?.substring(0, 150) + "..." || "Sem conteúdo",
        content: doc.output || "",
        created_at: doc.created_at,
      }));

      const formattedSummaries: HistoryItem[] = (summaries || []).map((sum) => ({
        id: sum.id,
        type: "summary",
        title: `Resumo ${sum.summary_type}`,
        preview: sum.summary?.substring(0, 150) + "..." || "Sem conteúdo",
        content: sum.summary || "",
        created_at: sum.created_at,
      }));

      // Combine and sort by date
      const combined = [...formattedDocs, ...formattedSummaries].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setHistory(combined);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const handleDelete = async (item: HistoryItem) => {
    try {
      if (item.type === "document") {
        await supabase.from("documents").delete().eq("id", item.id);
      } else {
        await supabase.from("contract_summaries").delete().eq("id", item.id);
      }

      setHistory((prev) => prev.filter((h) => h.id !== item.id));
      toast({
        title: "Item excluído",
        description: "O item foi removido do histórico.",
      });
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: "Não foi possível excluir o item.",
        variant: "destructive",
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Histórico</h1>
          <p className="text-muted-foreground">
            Acesse todos os documentos e resumos que você gerou
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : history.length === 0 ? (
          <Card variant="glass">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Nenhum item no histórico</h3>
              <p className="text-muted-foreground">
                Seus documentos e resumos aparecerão aqui
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <Card key={item.id} variant="interactive" className="group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.type === "document"
                          ? "bg-primary/10 text-primary"
                          : "bg-juris-success/10 text-juris-success"
                      }`}>
                        {item.type === "document" ? (
                          <FileText className="w-5 h-5" />
                        ) : (
                          <FileSearch className="w-5 h-5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium capitalize">{item.title}</h3>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(item.created_at), "dd MMM yyyy, HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.preview}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(item)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* View Dialog */}
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="capitalize">{selectedItem?.title}</DialogTitle>
              <DialogDescription>
                Criado em{" "}
                {selectedItem &&
                  format(new Date(selectedItem.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
              </DialogDescription>
            </DialogHeader>
            <div className="bg-muted rounded-xl p-6 whitespace-pre-wrap font-mono text-sm">
              {selectedItem?.content}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
