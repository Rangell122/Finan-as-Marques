import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Scale, Sparkles, Plus, AlertTriangle, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/orcamentos")({
  component: OrcamentosRoute,
});

const CATEGORY_LIMITS: { [key: string]: number } = {
  "Casa - Mercado / Compras": 1500,
  "Casa - Luz": 250,
  "Casa - Água": 100,
  "Casa - Internet": 150,
  "Moto - Gasolina": 350,
  "Moto - Peças / Manutenção": 250,
  "IA - Ferramentas (ChatGPT, Gemini...)": 150,
  "Cartão - Nubank": 1000,
  "Cartão - Inter": 500,
  "Banco - PIX Enviado": 800,
};

const isDebtTransaction = (t: any) => {
  if (!t.description) return false;
  const desc = String(t.description);
  return (
    desc.startsWith("DEBT_JSON:") ||
    desc.toLowerCase().includes("divida-") ||
    desc.toLowerCase().includes("dívida-")
  );
};

function OrcamentosRoute() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudget, setSelectedBudget] = useState<{ category: string; spent: number; limit: number } | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: false });

        if (error) throw error;
        if (data) {
          setTransactions(data);
        }
      } catch (err: any) {
        console.error("Erro orcamentos:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const currentMonth = new Date().toISOString().substring(0, 7);
  const monthTransactions = transactions.filter((t) => t.date && t.date.substring(0, 7) === currentMonth);

  const categorySpent: { [key: string]: number } = {};
  monthTransactions
    .filter((t) => t.type === "expense" && !isDebtTransaction(t))
    .forEach((t) => {
      categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
    });

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen pb-24"
    >
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Scale className="w-8 h-8 text-[#1576D0]" />
          Orçamentos de Gastos
        </h1>
        <p className="text-muted-foreground text-sm">
          Acompanhe os limites de gastos mensais por categoria definidos para a saúde financeira do casal.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Object.entries(CATEGORY_LIMITS).map(([category, limit]) => {
          const spent = categorySpent[category] || 0;
          const pct = Math.min(Math.round((spent / limit) * 100), 100);
          const isOver = spent > limit;

          let barColor = "bg-emerald-500";
          let textColor = "text-emerald-600 dark:text-emerald-400";
          let cardBorder = "border-border";

          if (isOver) {
            barColor = "bg-rose-500";
            textColor = "text-rose-600 dark:text-rose-455";
            cardBorder = "border-rose-200 dark:border-rose-950/40";
          } else if (spent > limit * 0.75) {
            barColor = "bg-amber-500";
            textColor = "text-amber-600 dark:text-amber-400";
          }

          return (
            <Card
              key={category}
              onClick={() => setSelectedBudget({ category, spent, limit })}
              className={`p-6 border bg-white dark:bg-card rounded-2xl hover:shadow-md cursor-pointer transition-all ${cardBorder}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-sm text-foreground block truncate">{category}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5 block">Orçamento mensal</span>
                </div>
                {isOver ? (
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                ) : (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div className="mt-6 space-y-3">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground font-medium">{pct}% usado</span>
                  <span className={`font-bold ${textColor}`}>
                    {formatCurrency(spent)} / {formatCurrency(limit)}
                  </span>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Budget Detail Dialog */}
      <Dialog open={selectedBudget !== null} onOpenChange={(open) => !open && setSelectedBudget(null)}>
        {selectedBudget && (
          <DialogContent className="sm:max-w-[400px] bg-card text-card-foreground border border-border rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-foreground">Detalhes do Orçamento</DialogTitle>
            </DialogHeader>
            <div className="pt-4 space-y-4 text-sm">
              <div className="pb-2 border-b border-border/50 text-center">
                <span className="font-bold text-base text-foreground block">{selectedBudget.category}</span>
                <span className="text-xs text-muted-foreground mt-0.5">Visão do mês atual</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-muted-foreground font-semibold">Limite de gastos:</span>
                <span className="font-extrabold text-foreground">{formatCurrency(selectedBudget.limit)}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-muted-foreground font-semibold">Valor consumido:</span>
                <span className="font-extrabold text-foreground">{formatCurrency(selectedBudget.spent)}</span>
              </div>
              <div className="flex justify-between items-center pt-2">
                <span className="text-foreground font-bold">Saldo disponível:</span>
                <span className={`font-extrabold text-base ${selectedBudget.limit - selectedBudget.spent >= 0 ? "text-emerald-650" : "text-rose-650"}`}>
                  {formatCurrency(selectedBudget.limit - selectedBudget.spent)}
                </span>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button onClick={() => setSelectedBudget(null)} className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 rounded-xl">
                Fechar
              </Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </motion.div>
  );
}
