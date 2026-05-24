import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, Plus, Sparkles, Trophy, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/objetivos")({
  component: ObjetivosRoute,
});

function ObjetivosRoute() {
  const [goals, setGoals] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("objetivos_config");
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "1", name: "Comprar um carro", target: 50000, current: 15000, date: "2027-12-31" },
      { id: "2", name: "Viagem em Família", target: 10000, current: 4500, date: "2026-10-15" },
      { id: "3", name: "Reserva de Emergência de Longo Prazo", target: 20000, current: 12000, date: "2026-12-31" }
    ];
  });

  const saveGoals = (newGoals: any[]) => {
    setGoals(newGoals);
    if (typeof window !== "undefined") {
      localStorage.setItem("objetivos_config", JSON.stringify(newGoals));
    }
  };

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [date, setDate] = useState("");

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target) return;

    const newGoal = {
      id: "goal_" + Date.now(),
      name,
      target: parseFloat(target),
      current: parseFloat(current) || 0,
      date: date || new Date().toISOString().split("T")[0]
    };

    saveGoals([...goals, newGoal]);
    setIsOpen(false);
    setName("");
    setTarget("");
    setCurrent("");
    setDate("");
  };

  const deleteGoal = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este objetivo financeiro?")) {
      saveGoals(goals.filter(g => g.id !== id));
    }
  };

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen pb-24"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Target className="w-8 h-8 text-[#1576D0]" />
            Objetivos Financeiros
          </h1>
          <p className="text-muted-foreground text-sm">
            Planeje suas metas de acumulação de capital a médio e longo prazo e acompanhe o progresso das conquistas.
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="bg-primary hover:bg-primary/95 text-white font-bold h-11 rounded-xl">
          <Plus className="w-4 h-4 mr-2" /> Novo Objetivo
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {goals.map((goal) => {
          const pct = goal.target > 0 ? Math.min(Math.round((goal.current / goal.target) * 100), 100) : 0;
          return (
            <Card key={goal.id} className="border border-border/80 bg-white dark:bg-card rounded-2xl p-6 flex flex-col justify-between hover:shadow-md relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold text-sm text-foreground block truncate">{goal.name}</span>
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5 block flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Meta até: {new Date(goal.date).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <Trophy className="w-5 h-5 text-amber-500 flex-shrink-0" />
              </div>

              <div className="mt-8 space-y-3">
                <div className="flex justify-between text-xs font-semibold text-muted-foreground">
                  <span>Progresso: {pct}%</span>
                  <span>{formatCurrency(goal.current)} / {formatCurrency(goal.target)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[10px] text-muted-foreground">
                    Resta {formatCurrency(Math.max(goal.target - goal.current, 0))}
                  </span>
                  <button
                    onClick={() => deleteGoal(goal.id)}
                    className="text-[10px] font-bold text-rose-600 hover:underline"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[400px] bg-card text-card-foreground border border-border rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-foreground">Novo Objetivo Financeiro</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGoal} className="space-y-4 pt-3 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700 dark:text-slate-300">Nome do Objetivo</Label>
              <Input
                type="text"
                placeholder="Ex: Comprar um carro, Viagem, etc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700 dark:text-slate-300">Valor Alvo (R$)</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-slate-700 dark:text-slate-300">Valor Atual (R$)</Label>
                <Input
                  type="number"
                  placeholder="0,00"
                  value={current}
                  onChange={(e) => setCurrent(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold text-slate-700 dark:text-slate-300">Data Limite</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-bold h-10 rounded-xl mt-2 select-none">
              Salvar Objetivo
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
