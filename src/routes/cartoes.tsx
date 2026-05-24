import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Calendar, ArrowDownLeft, SlidersHorizontal, Sparkles, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/cartoes")({
  component: CartoesRoute,
});

const parseMeta = (description: string) => {
  const raw = String(description || "");
  let responsible = "Os dois";
  let cleanDesc = raw;
  let cardId = null;

  let remaining = raw;
  if (remaining.startsWith("[Jack] ")) {
    responsible = "Jack";
    remaining = remaining.replace("[Jack] ", "");
  } else if (remaining.startsWith("[Rangel] ")) {
    responsible = "Rangel";
    remaining = remaining.replace("[Rangel] ", "");
  } else if (remaining.startsWith("[Os dois] ")) {
    responsible = "Os dois";
    remaining = remaining.replace("[Os dois] ", "");
  }

  if (remaining.startsWith("META_JSON:")) {
    try {
      const meta = JSON.parse(remaining.substring(10));
      cleanDesc = meta.desc || "";
      if (meta.cardId) cardId = meta.cardId;
    } catch (e) {
      console.error(e);
    }
  }

  return {
    cleanDesc,
    responsible,
    cardId
  };
};

function CartoesRoute() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCardName, setActiveCardName] = useState<string>("Nubank");

  const [cardsConfig] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cartoes_config");
        if (stored) return JSON.parse(stored);
      } catch (e) {}
    }
    return [
      { name: "Nubank", limit: 3000, dueDate: 10 },
      { name: "Inter", limit: 2000, dueDate: 15 },
      { name: "Sicredi", limit: 5000, dueDate: 20 }
    ];
  });

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
      console.error("Erro em cartoes:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const getCardFaturaSum = (cardName: string) => {
    return transactions
      .filter((t) => t.type === "expense" && parseMeta(t.description).cardId === cardName)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const activeCard = cardsConfig.find(c => c.name === activeCardName) || cardsConfig[0];
  const activeFatura = getCardFaturaSum(activeCard.name);
  const activePercent = activeCard.limit > 0 ? Math.min(Math.round((activeFatura / activeCard.limit) * 100), 100) : 0;

  const cardPurchases = transactions.filter((t) => {
    const meta = parseMeta(t.description);
    return t.type === "expense" && meta.cardId === activeCard.name;
  }).map(t => {
    const meta = parseMeta(t.description);
    return {
      ...t,
      cleanDesc: meta.cleanDesc,
      responsible: meta.responsible
    };
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
          <CreditCard className="w-8 h-8 text-[#1576D0]" />
          Cartões de Crédito
        </h1>
        <p className="text-muted-foreground text-sm">
          Monitore o limite de crédito, faturas abertas e vencimentos de seus cartões corporativos e pessoais.
        </p>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
        {/* Sidebar cartoes */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Meus Cartões</h2>
          <div className="space-y-3">
            {cardsConfig.map((card) => {
              const fatura = getCardFaturaSum(card.name);
              const isActive = card.name === activeCardName;
              return (
                <div
                  key={card.name}
                  onClick={() => setActiveCardName(card.name)}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between hover:shadow-md bg-white dark:bg-card ${
                    isActive ? "border-l-4 border-amber-500 shadow border-amber-250/20" : "border-border"
                  }`}
                >
                  <div>
                    <span className="font-bold text-sm text-foreground block truncate">{card.name}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold uppercase">Vence dia {card.dueDate}</span>
                  </div>
                  <div className="text-right mt-4">
                    <span className="font-extrabold text-base text-rose-600 dark:text-rose-400">
                      {formatCurrency(fatura)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cartao Detail and Purchases */}
        <div className="lg:col-span-3 space-y-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
            <Card className="border border-border/80 bg-white dark:bg-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase block">Fatura Aberta</span>
                <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-2 block">
                  {formatCurrency(activeFatura)}
                </span>
              </div>
              <div className="mt-6">
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${activePercent > 90 ? "bg-rose-500" : activePercent > 70 ? "bg-amber-500" : "bg-blue-500"}`}
                    style={{ width: `${activePercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-semibold text-muted-foreground mt-2">
                  <span>{activePercent}% do limite</span>
                  <span>Disponível: {formatCurrency(Math.max(activeCard.limit - activeFatura, 0))}</span>
                </div>
              </div>
            </Card>

            <Card className="border border-border/80 bg-white dark:bg-card rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase block">Configurações do Cartão</span>
                <div className="mt-4 space-y-2 text-xs">
                  <div className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground font-semibold">Limite total:</span>
                    <span className="font-extrabold text-foreground">{formatCurrency(activeCard.limit)}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/50 pb-1.5">
                    <span className="text-muted-foreground font-semibold">Dia do vencimento:</span>
                    <span className="font-extrabold text-foreground">Dia {activeCard.dueDate}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-muted-foreground font-semibold">Bandeira:</span>
                    <span className="font-extrabold text-foreground">Internacional</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl">
            <h2 className="text-base font-bold text-foreground mb-4">Compras Registradas no Faturamento</h2>
            <div className="overflow-x-auto w-full">
              <Table>
                <TableBody>
                  {cardPurchases.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-none transition-colors">
                      <TableCell className="pl-0 py-3 text-xs text-muted-foreground font-semibold">
                        {new Date(item.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="font-semibold text-sm text-foreground">{item.cleanDesc}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-850 text-slate-655 dark:text-slate-400 rounded text-[9px] font-bold">
                            {item.responsible}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3 pr-0 font-extrabold text-sm text-rose-600 dark:text-rose-400">
                        - {formatCurrency(item.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {cardPurchases.length === 0 && (
                    <TableRow>
                      <TableCell className="text-center py-12 text-slate-400 dark:text-slate-500">
                        Nenhuma compra registrada neste cartão.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
