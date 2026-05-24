import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart as LucideLineChart, 
  Printer, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CreditCard, 
  Coins, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  ShieldAlert
} from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/relatorios")({
  component: Relatorios,
});

const parseMeta = (description: string) => {
  const raw = String(description || "");
  let responsible = "Os dois";
  let cleanDesc = raw;
  let costType = "variable";
  let cardId = null;
  let installment = null;

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
      if (meta.costType) costType = meta.costType;
      if (meta.cardId) cardId = meta.cardId;
      if (meta.installment) installment = meta.installment;
    } catch (e) {
      console.error("Error parsing META_JSON:", e);
      cleanDesc = remaining.substring(10);
    }
  } else if (remaining.startsWith("DEBT_JSON:")) {
    try {
      const meta = JSON.parse(remaining.substring(10));
      cleanDesc = `Dívida: ${meta.name || ""}`;
      costType = "fixed";
    } catch (e) {
      cleanDesc = "Dívida";
    }
  } else {
    cleanDesc = remaining;
  }

  return {
    cleanDesc,
    responsible,
    costType,
    cardId,
    installment
  };
};

const isDebtTransaction = (t: any) => {
  if (!t.description) return false;
  const desc = String(t.description);
  return (
    desc.startsWith("DEBT_JSON:") ||
    desc.toLowerCase().includes("divida-") ||
    desc.toLowerCase().includes("dívida-") ||
    desc.toLowerCase().includes("divida ") ||
    desc.toLowerCase().includes("dívida ")
  );
};

const parseDebt = (t: any) => {
  const desc = String(t.description || "");
  if (desc.startsWith("DEBT_JSON:")) {
    try {
      const data = JSON.parse(desc.substring(10));
      return {
        id: t.id,
        name: data.name,
        amount: t.amount,
        originalAmount: data.originalAmount || t.amount,
        renegotiated: data.renegotiated || false,
        paymentType: data.paymentType || "À vista",
        installmentsCount: data.installmentsCount || 1,
        paidInstallments: data.paidInstallments || 0,
        installmentAmount: data.installmentAmount || t.amount,
        status: t.status,
        date: t.date,
        raw: t
      };
    } catch (e) {
      console.error("Error parsing debt JSON:", e);
    }
  }

  let cleanName = desc;
  if (cleanName.startsWith("[Os dois] ")) cleanName = cleanName.replace("[Os dois] ", "");
  if (cleanName.startsWith("[Jack] ")) cleanName = cleanName.replace("[Jack] ", "");
  if (cleanName.startsWith("[Rangel] ")) cleanName = cleanName.replace("[Rangel] ", "");
  if (cleanName.startsWith("Divida-")) cleanName = cleanName.replace("Divida-", "");
  if (cleanName.startsWith("Dívida-")) cleanName = cleanName.replace("Dívida-", "");

  return {
    id: t.id,
    name: cleanName || "Dívida Sem Nome",
    amount: t.amount,
    originalAmount: t.amount,
    renegotiated: false,
    paymentType: "À vista",
    installmentsCount: 1,
    paidInstallments: t.status === "paid" || t.status === "Pago" ? 1 : 0,
    installmentAmount: t.amount,
    status: t.status,
    date: t.date,
    raw: t
  };
};

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

const formatMonthName = (ym: string) => {
  if (!ym) return "";
  const [y, m] = ym.split("-");
  const mName = MONTH_NAMES[parseInt(m, 10) - 1] || m;
  return `${mName} ${y}`;
};

const formatCurrency = (val: number) =>
  `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const CHART_COLORS = [
  "#1576D0", // Royal Blue
  "#22c55e", // Green
  "#ef4444", // Red
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
  "#e2e8f0"  // Slate
];

function Relatorios() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2026-05");

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: true }); // Ascending order is better for historical evolution chart

      if (error) throw error;
      if (data) {
        const mapped = data.map((t: any) => ({
          ...t,
          status: t.status === "paid" ? "Pago" : t.status === "pending" ? "Pendente" : t.status,
        }));
        setTransactions(mapped);
      }
    } catch (err: any) {
      console.error("Erro ao carregar lançamentos para relatórios:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Unique list of months
  const months = Array.from(
    new Set(transactions.map((t) => t.date?.substring(0, 7)).filter(Boolean))
  ).sort().reverse() as string[];

  // Fallback default selection
  useEffect(() => {
    if (months.length > 0 && !months.includes(selectedMonth)) {
      const hasMay = months.includes("2026-05");
      setSelectedMonth(hasMay ? "2026-05" : months[0]);
    }
  }, [months]);

  // Filter transactions for the selected month
  const filteredTransactions = transactions.filter(
    (t) => t.date && t.date.substring(0, 7) === selectedMonth
  );

  // Parse transactions with metadata
  const parsedTransactions = filteredTransactions.map((t) => {
    const meta = parseMeta(t.description);
    return {
      ...t,
      cleanDesc: meta.cleanDesc,
      responsible: meta.responsible,
      costType: meta.costType,
      cardId: meta.cardId,
      installment: meta.installment,
    };
  });

  // 1. General Metrics for the Selected Month
  const receitas = parsedTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const despesas = parsedTransactions
    .filter((t) => 
      t.type === "expense" && 
      (!isDebtTransaction(t) || t.status === "Pago" || t.status === "paid") && 
      t.cardId === null
    )
    .reduce((acc, curr) => acc + curr.amount, 0);

  const saldo = receitas - despesas;

  // Credit Card usage (bills) for the month
  const getCardFaturaSum = (cardName: string) => {
    return parsedTransactions
      .filter((t) => t.type === "expense" && t.cardId === cardName)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };
  const cardNubank = getCardFaturaSum("Nubank");
  const cardInter = getCardFaturaSum("Inter");
  const cardSicredi = getCardFaturaSum("Sicredi");
  const totalCartao = cardNubank + cardInter + cardSicredi;

  // Debts
  const debtsList = transactions.filter(isDebtTransaction).map(parseDebt);
  const totalDividaRestante = debtsList.reduce((acc, curr) => {
    if (curr.status === "paid" || curr.status === "Pago") return acc;
    if (curr.paymentType === "Parcelado") {
      return acc + Math.max((curr.installmentsCount - curr.paidInstallments) * curr.installmentAmount, 0);
    } else {
      return acc + curr.amount;
    }
  }, 0);

  // 2. Evolution Chart data (monthly totals of Incomes, Expenses, Net)
  const getMonthlyHistory = () => {
    const monthlyData: { [key: string]: { month: string; Receitas: number; Despesas: number; Saldo: number } } = {};
    
    // Sort transactions by date ascending
    const sorted = [...transactions].sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    
    sorted.forEach((t) => {
      if (!t.date) return;
      const monthKey = t.date.substring(0, 7);
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          Receitas: 0,
          Despesas: 0,
          Saldo: 0,
        };
      }
      
      const isDebt = isDebtTransaction(t);
      const isPaidDebt = t.status === "Pago" || t.status === "paid";
      const isCreditCard = t.cardId !== null;
      
      if (t.type === "income") {
        monthlyData[monthKey].Receitas += t.amount;
      } else if (t.type === "expense") {
        if ((!isDebt || isPaidDebt) && !isCreditCard) {
          monthlyData[monthKey].Despesas += t.amount;
        }
      }
    });

    return Object.values(monthlyData).map(d => ({
      ...d,
      Saldo: parseFloat((d.Receitas - d.Despesas).toFixed(2)),
      Receitas: parseFloat(d.Receitas.toFixed(2)),
      Despesas: parseFloat(d.Despesas.toFixed(2)),
      monthName: formatMonthName(d.month)
    }));
  };

  // 3. Category distribution (Expenses only)
  const getCategoryData = () => {
    const dataMap: { [key: string]: number } = {};
    parsedTransactions
      .filter((t) => t.type === "expense" && !isDebtTransaction(t))
      .forEach((t) => {
        const cat = t.category || "Outros";
        dataMap[cat] = (dataMap[cat] || 0) + t.amount;
      });

    return Object.keys(dataMap)
      .map(key => ({
        name: key.replace("Casa - ", "").replace("Moto - ", "").replace("IA - ", "").replace("Banco - ", "").replace("Cartão - ", ""),
        value: parseFloat(dataMap[key].toFixed(2))
      }))
      .sort((a, b) => b.value - a.value);
  };

  // 4. Responsible person distribution (Jack vs Rangel vs Os dois)
  const getResponsibleData = () => {
    const dataMap: { [key: string]: number } = { "Jack": 0, "Rangel": 0, "Os dois": 0 };
    parsedTransactions
      .filter((t) => t.type === "expense" && !isDebtTransaction(t))
      .forEach((t) => {
        const resp = t.responsible || "Os dois";
        dataMap[resp] = (dataMap[resp] || 0) + t.amount;
      });

    return Object.keys(dataMap)
      .map(key => ({
        name: key,
        value: parseFloat(dataMap[key].toFixed(2))
      }))
      .filter(d => d.value > 0);
  };

  // 5. Credit Cards usage data
  const getCreditCardData = () => {
    return [
      { name: "Nubank", Fatura: parseFloat(cardNubank.toFixed(2)) },
      { name: "Inter", Fatura: parseFloat(cardInter.toFixed(2)) },
      { name: "Sicredi", Fatura: parseFloat(cardSicredi.toFixed(2)) }
    ].filter(c => c.Fatura > 0);
  };

  // 6. Fixed vs Variable cost distribution
  const getFixedVsVariableData = () => {
    const fixed = parsedTransactions
      .filter((t) => 
        t.type === "expense" && 
        (!isDebtTransaction(t) || t.status === "Pago" || t.status === "paid") && 
        t.costType === "fixed"
      )
      .reduce((acc, curr) => acc + curr.amount, 0);

    const variable = parsedTransactions
      .filter((t) => 
        t.type === "expense" && 
        (!isDebtTransaction(t) || t.status === "Pago" || t.status === "paid") && 
        t.costType === "variable"
      )
      .reduce((acc, curr) => acc + curr.amount, 0);

    return [
      { name: "Custos Fixos", Valor: parseFloat(fixed.toFixed(2)) },
      { name: "Custos Variáveis", Valor: parseFloat(variable.toFixed(2)) }
    ].filter(d => d.Valor > 0);
  };

  // Printer handler
  const handlePrintCard = (elementId: string) => {
    const cardElement = document.getElementById(elementId);
    const printTarget = document.getElementById("print-target");
    if (cardElement && printTarget) {
      const clone = cardElement.cloneNode(true) as HTMLElement;
      // Remove print buttons inside clone
      const printBtns = clone.querySelectorAll(".print-card-btn");
      printBtns.forEach(btn => btn.remove());
      
      printTarget.innerHTML = "";
      printTarget.appendChild(clone);
      
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-white">
        Carregando Relatórios...
      </div>
    );
  }

  const categoryData = getCategoryData();
  const responsibleData = getResponsibleData();
  const creditCardData = getCreditCardData();
  const fixedVariableData = getFixedVsVariableData();
  const monthlyHistory = getMonthlyHistory();

  return (
    <>
      {/* Target for printing a single card */}
      <div id="print-target" className="hidden print:block bg-white text-[#0B1120] p-8 rounded-3xl" />

      {/* Main layout container (hidden when printing single card) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 md:p-8 space-y-6 bg-background min-h-screen pb-24 print:hidden"
      >
        {/* Header Title with contrast fixed */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2">
              <LucideLineChart className="w-8 h-8 text-[#1576D0]" />
              Relatórios Financeiros
            </h1>
            <p className="text-slate-400 text-sm">
              Análise e evolução do patrimônio, entradas, saídas e compromissos.
            </p>
          </div>

          {/* Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#1576D0]" />
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[180px] bg-white border border-border text-slate-800 font-semibold rounded-xl shadow-sm h-11">
                <SelectValue placeholder="Selecione o mês" />
              </SelectTrigger>
              <SelectContent>
                {months.length > 0 ? (
                  months.map((m) => (
                    <SelectItem key={m} value={m} className="font-medium text-slate-700">
                      {formatMonthName(m)}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="2026-05" className="font-medium text-slate-700">
                    Maio 2026
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 1. Evolução Histórica (Area Chart) - Full Width */}
        <Card id="card-evolucao" className="border border-border/80 shadow-md bg-white rounded-2xl overflow-hidden relative">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
            <div>
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Histórico de Evolução Mensal
              </CardTitle>
              <p className="text-xs text-slate-400 mt-1">Histórico acumulado de Receitas, Despesas e Saldo Líquido</p>
            </div>
            <Button
              variant="outline"
              size="icon"
              className="print-card-btn rounded-xl border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50"
              onClick={() => handlePrintCard("card-evolucao")}
              title="Exportar Gráfico em PDF"
            >
              <Printer className="w-4.5 h-4.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-6">
            {monthlyHistory.length > 0 ? (
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorReceitas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorDespesas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#1576D0" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#1576D0" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(Number(value)), ""]}
                      contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                    <Area type="monotone" dataKey="Receitas" stroke="#22c55e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReceitas)" />
                    <Area type="monotone" dataKey="Despesas" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#colorDespesas)" />
                    <Area type="monotone" dataKey="Saldo" stroke="#1576D0" strokeWidth={2.5} fillOpacity={1} fill="url(#colorSaldo)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                Nenhum histórico disponível ainda.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dashboard Grid for detailed charts */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
          
          {/* 2. Despesas por Categoria (Donut / Pie Chart) */}
          <Card id="card-categoria" className="border border-border/80 shadow-md bg-white rounded-2xl relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-rose-500" />
                  Distribuição por Categoria
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">Gastos reais por categorias no mês selecionado</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="print-card-btn rounded-xl border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50"
                onClick={() => handlePrintCard("card-categoria")}
                title="Exportar Gráfico em PDF"
              >
                <Printer className="w-4.5 h-4.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {categoryData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="h-[220px] w-[220px] relative flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                      <span className="text-base font-extrabold text-slate-800">{formatCurrency(despesas)}</span>
                    </div>
                  </div>
                  <div className="flex-1 space-y-2.5 max-h-[220px] overflow-y-auto w-full pr-1">
                    {categoryData.map((item, index) => (
                      <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          <span 
                            className="w-2.5 h-2.5 rounded-full flex-shrink-0" 
                            style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} 
                          />
                          <span className="font-semibold text-slate-700 truncate">{item.name}</span>
                        </div>
                        <span className="font-extrabold text-slate-900 ml-2">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                  Nenhuma despesa para exibir no mês de {formatMonthName(selectedMonth)}.
                </div>
              )}
            </CardContent>
          </Card>

          {/* 3. Responsabilidade de Gasto (Pie Chart) */}
          <Card id="card-responsabilidade" className="border border-border/80 shadow-md bg-white rounded-2xl relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  Divisão de Responsabilidade
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">Quem gastou os recursos no mês selecionado</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="print-card-btn rounded-xl border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50"
                onClick={() => handlePrintCard("card-responsabilidade")}
                title="Exportar Gráfico em PDF"
              >
                <Printer className="w-4.5 h-4.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {responsibleData.length > 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="h-[220px] w-[220px] relative flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                        <Pie
                          data={responsibleData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={80}
                          paddingAngle={0}
                          dataKey="value"
                        >
                          {responsibleData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex-1 space-y-4 w-full">
                    {responsibleData.map((item, index) => {
                      const pct = Math.round((item.value / despesas) * 100) || 0;
                      return (
                        <div key={item.name} className="space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <span 
                                className="w-2.5 h-2.5 rounded-full" 
                                style={{ backgroundColor: CHART_COLORS[(index + 4) % CHART_COLORS.length] }} 
                              />
                              <span className="font-bold text-slate-700">{item.name}</span>
                            </div>
                            <span className="font-extrabold text-slate-900">{formatCurrency(item.value)} ({pct}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full" 
                              style={{ 
                                width: `${pct}%`, 
                                backgroundColor: CHART_COLORS[(index + 4) % CHART_COLORS.length] 
                              }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                  Nenhum registro de consumo no mês selecionado.
                </div>
              )}
            </CardContent>
          </Card>

          {/* 4. Uso de Cartões de Crédito (Bar Chart) */}
          <Card id="card-cartoes" className="border border-border/80 shadow-md bg-white rounded-2xl relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  Gasto por Cartão de Crédito
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">Comparação de compras realizadas no mês por bandeira</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="print-card-btn rounded-xl border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50"
                onClick={() => handlePrintCard("card-cartoes")}
                title="Exportar Gráfico em PDF"
              >
                <Printer className="w-4.5 h-4.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {creditCardData.length > 0 ? (
                <div className="space-y-6">
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={creditCardData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(Number(value))}
                          contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                        />
                        <Bar dataKey="Fatura" radius={[8, 8, 0, 0]}>
                          {creditCardData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={index === 0 ? "#8b5cf6" : index === 1 ? "#f59e0b" : "#1576D0"} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="font-bold text-slate-700 text-xs uppercase tracking-wider">Gasto Total no Cartão</span>
                    <span className="font-extrabold text-base text-amber-600">{formatCurrency(totalCartao)}</span>
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                  Nenhuma compra registrada nos cartões no mês selecionado.
                </div>
              )}
            </CardContent>
          </Card>

          {/* 5. Custo Fixo vs Variável (Bar Chart) */}
          <Card id="card-custos" className="border border-border/80 shadow-md bg-white rounded-2xl relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-slate-100">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-emerald-500" />
                  Perfil de Custos (Fixo vs Variável)
                </CardTitle>
                <p className="text-xs text-slate-400 mt-1">Comparativo de despesas necessárias vs supérfluas</p>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="print-card-btn rounded-xl border-slate-200 text-slate-500 hover:text-primary hover:bg-slate-50"
                onClick={() => handlePrintCard("card-custos")}
                title="Exportar Gráfico em PDF"
              >
                <Printer className="w-4.5 h-4.5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {fixedVariableData.length > 0 ? (
                <div className="space-y-6">
                  <div className="h-[180px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={fixedVariableData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip 
                          formatter={(value: any) => formatCurrency(Number(value))}
                          contentStyle={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}
                        />
                        <Bar dataKey="Valor" radius={[8, 8, 0, 0]}>
                          <Cell fill="#0E2C63" />
                          <Cell fill="#3b82f6" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {fixedVariableData.map((item, idx) => (
                      <div key={item.name} className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center">
                        <span className="text-[10px] text-slate-400 font-bold block uppercase">{item.name}</span>
                        <span className="font-extrabold text-sm text-slate-800 mt-1 block">{formatCurrency(item.Valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[220px] flex items-center justify-center text-slate-400 text-sm">
                  Sem registros de custos no mês selecionado.
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </motion.div>
    </>
  );
}
