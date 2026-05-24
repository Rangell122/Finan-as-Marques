import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calendar, Filter, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

export const Route = createFileRoute("/graficos")({
  component: GraficosRoute,
});

const isDebtTransaction = (t: any) => {
  if (!t.description) return false;
  return String(t.description).startsWith("DEBT_JSON:");
};

function GraficosRoute() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2026-05");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from("transactions")
          .select("*")
          .order("date", { ascending: true });

        if (error) throw error;
        if (data) {
          setTransactions(data);
        }
      } catch (err: any) {
        console.error("Erro graficos:", err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const months = Array.from(
    new Set(transactions.map((t) => t.date?.substring(0, 7)).filter(Boolean))
  ).sort().reverse() as string[];

  useEffect(() => {
    if (months.length > 0 && !months.includes(selectedMonth)) {
      setSelectedMonth(months.includes("2026-05") ? "2026-05" : months[0]);
    }
  }, [months]);

  const categories = Array.from(
    new Set(transactions.map((t) => t.category).filter(Boolean))
  ) as string[];

  const filteredTransactions = transactions.filter((t) => {
    const matchMonth = t.date && t.date.substring(0, 7) === selectedMonth;
    const matchCategory = selectedCategory === "all" || t.category === selectedCategory;
    return matchMonth && matchCategory;
  });

  const getMonthlyBarData = () => {
    const incomes = filteredTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = filteredTransactions.filter(t => t.type === "expense" && !isDebtTransaction(t)).reduce((s, t) => s + t.amount, 0);
    return [
      { name: "Receitas", valor: incomes, color: "#10b981" },
      { name: "Despesas", valor: expenses, color: "#ef4444" }
    ];
  };

  const getCategoryRankingData = () => {
    const dataMap: { [cat: string]: number } = {};
    filteredTransactions.filter(t => t.type === "expense" && !isDebtTransaction(t)).forEach(t => {
      dataMap[t.category] = (dataMap[t.category] || 0) + t.amount;
    });

    return Object.entries(dataMap)
      .map(([name, value]) => ({
        name: name.replace("Casa - ", "").replace("Moto - ", "").replace("IA - ", "").replace("Banco - ", "").replace("Cartão - ", ""),
        value
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getDailyTrendData = () => {
    const dailyMap: { [day: number]: { day: number; Entrada: number; Saida: number } } = {};
    const [year, month] = selectedMonth.split("-").map(Number);
    const totalDays = new Date(year, month, 0).getDate();

    for (let d = 1; d <= totalDays; d++) {
      dailyMap[d] = { day: d, Entrada: 0, Saida: 0 };
    }

    filteredTransactions.forEach((t) => {
      const day = new Date(t.date).getUTCDate();
      if (dailyMap[day]) {
        if (t.type === "income") {
          dailyMap[day].Entrada += t.amount;
        } else if (t.type === "expense") {
          dailyMap[day].Saida += t.amount;
        }
      }
    });

    return Object.values(dailyMap).map(d => ({
      name: `${d.day}/${month}`,
      Entrada: d.Entrada,
      Saida: d.Saida
    }));
  };

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const barData = getMonthlyBarData();
  const catData = getCategoryRankingData();
  const trendData = getDailyTrendData();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen pb-24"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="w-8 h-8 text-[#1576D0]" />
            Gráficos e Estatísticas
          </h1>
          <p className="text-muted-foreground text-sm">
            Analise o fluxo diário, proporções de categorias e comparativos visuais de forma detalhada.
          </p>
        </div>
      </div>

      {/* Filters bar */}
      <Card className="p-4 border border-border/80 bg-white dark:bg-card rounded-2xl flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase">
          <Filter className="w-4 h-4" />
          Filtros
        </div>
        <div className="flex flex-wrap gap-3 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Mês:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[150px] h-9 text-xs bg-white dark:bg-card border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-card text-foreground border-border">
                {months.map(m => (
                  <SelectItem key={m} value={m} className="text-xs">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold">Categoria:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[180px] h-9 text-xs bg-white dark:bg-card border-border">
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent className="bg-card text-foreground border-border">
                <SelectItem value="all" className="text-xs">Todas as Categorias</SelectItem>
                {categories.map(c => (
                  <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Balanço Mensal */}
        <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl lg:col-span-1 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-foreground mb-4">Balanço do Período</h2>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" dark:stroke="#1e293b" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]} barSize={40}>
                    {barData.map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {/* Fluxo Diário */}
        <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl lg:col-span-2">
          <h2 className="text-base font-bold text-foreground mb-4">Evolução Diária do Fluxo</h2>
          <div className="h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" dark:stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Bar dataKey="Entrada" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Saida" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Ranking de Categorias */}
      <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl">
        <h2 className="text-base font-bold text-foreground mb-6">Ranking de Gastos por Categoria</h2>
        <div className="space-y-4">
          {catData.map((item, idx) => {
            const maxVal = catData[0]?.value || 1;
            const pct = Math.round((item.value / maxVal) * 100);
            return (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-foreground">{item.name}</span>
                  <span className="text-foreground">{formatCurrency(item.value)}</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
          {catData.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">
              Nenhum gasto registrado com os filtros selecionados.
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
