import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Coins } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

export const Route = createFileRoute("/calendario")({
  component: CalendarioRoute,
});

const parseMeta = (description: string) => {
  const raw = String(description || "");
  let responsible = "Os dois";
  let cleanDesc = raw;

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
    } catch (e) {}
  }

  return {
    cleanDesc,
    responsible
  };
};

function CalendarioRoute() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 4, 1)); // Default to May 2026 for demonstration
  const [selectedDayTransactions, setSelectedDayTransactions] = useState<any[]>([]);
  const [selectedDayStr, setSelectedDayStr] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase.from("transactions").select("*");
        if (error) throw error;
        if (data) {
          setTransactions(data);
        }
      } catch (err: any) {
        console.error("Erro no calendário:", err.message);
      }
    };
    fetchTransactions();
  }, []);

  const parsedTransactions = transactions.map(t => {
    const meta = parseMeta(t.description);
    return {
      ...t,
      cleanDesc: meta.cleanDesc,
      responsible: meta.responsible
    };
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDayStr(null);
    setSelectedDayTransactions([]);
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDayStr(null);
    setSelectedDayTransactions([]);
  };

  const handleSelectDay = (day: number) => {
    const mStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const dStr = day < 10 ? `0${day}` : `${day}`;
    const dateKey = `${year}-${mStr}-${dStr}`;

    const filtered = parsedTransactions.filter(t => t.date === dateKey);
    setSelectedDayStr(dateKey);
    setSelectedDayTransactions(filtered);
  };

  const getDayTransactions = (day: number) => {
    const mStr = month + 1 < 10 ? `0${month + 1}` : `${month + 1}`;
    const dStr = day < 10 ? `0${day}` : `${day}`;
    const dateKey = `${year}-${mStr}-${dStr}`;
    return parsedTransactions.filter(t => t.date === dateKey);
  };

  const MONTH_NAMES = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

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
            <CalendarIcon className="w-8 h-8 text-[#1576D0]" />
            Calendário de Lançamentos
          </h1>
          <p className="text-muted-foreground text-sm">
            Monitore o vencimento de contas, receitas e despesas distribuídas pelos dias do mês.
          </p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Calendar Grid */}
        <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-base font-bold text-foreground">
              {MONTH_NAMES[month]} {year}
            </h2>
            <div className="flex gap-1.5">
              <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8 rounded-lg">
                <ChevronLeft className="w-4.5 h-4.5" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 rounded-lg">
                <ChevronRight className="w-4.5 h-4.5" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
            <span>Dom</span>
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sáb</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {/* Blank days before start of month */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="aspect-square" />
            ))}

            {/* Calendar Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dayTx = getDayTransactions(dayNum);
              const hasIncomes = dayTx.some(t => t.type === "income");
              const hasExpenses = dayTx.some(t => t.type === "expense");
              const isSelected = selectedDayStr === `${year}-${month + 1 < 10 ? "0" + (month + 1) : month + 1}-${dayNum < 10 ? "0" + dayNum : dayNum}`;

              return (
                <div
                  key={`day-${dayNum}`}
                  onClick={() => handleSelectDay(dayNum)}
                  className={`aspect-square border rounded-xl flex flex-col justify-between p-1.5 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800 ${
                    isSelected 
                      ? "border-primary bg-blue-50/20 text-primary font-bold dark:border-blue-500" 
                      : "border-border/50 bg-white dark:bg-card"
                  }`}
                >
                  <span className="text-xs">{dayNum}</span>
                  <div className="flex gap-1 justify-center">
                    {hasIncomes && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                    {hasExpenses && <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Selected Day Transactions List */}
        <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl lg:col-span-1">
          <h2 className="text-base font-bold text-foreground mb-4">
            {selectedDayStr ? `Lançamentos em ${new Date(selectedDayStr + "T00:00:00").toLocaleDateString("pt-BR")}` : "Selecione um dia"}
          </h2>
          <div className="overflow-y-auto max-h-[350px]">
            <Table>
              <TableBody>
                {selectedDayTransactions.map((item) => (
                  <TableRow key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-none transition-colors">
                    <TableCell className="pl-0 py-3">
                      <div className="font-semibold text-xs text-foreground">{item.cleanDesc}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.category}</div>
                    </TableCell>
                    <TableCell className={`text-right py-3 pr-0 font-extrabold text-xs ${item.type === "income" ? "text-emerald-600" : "text-rose-605"}`}>
                      {item.type === "income" ? "+" : "-"} {formatCurrency(item.amount)}
                    </TableCell>
                  </TableRow>
                ))}
                {selectedDayTransactions.length === 0 && (
                  <TableRow>
                    <TableCell className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs">
                      Nenhum lançamento no dia selecionado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
