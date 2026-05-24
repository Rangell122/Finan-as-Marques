import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  ArrowUpRight,
  ArrowDownLeft,
  Coins,
  CreditCard,
  Vault,
  HandCoins,
  Scale,
  Sparkles,
  ArrowUpCircle,
  ArrowDownCircle,
  TrendingDown,
  Trash2,
  Pencil,
  Check,
  Plus,
  DollarSign,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import importData from "@/data/import.json";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Index,
});

// Limites mensais por categoria definidos para economia da família
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

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  bgClass,
  subtitle,
}: {
  title: string;
  value: string;
  icon: any;
  color: string;
  bgClass: string;
  subtitle?: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300 border border-border bg-white">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-semibold text-slate-500">{title}</CardTitle>
        <div className={`p-2 rounded-xl ${bgClass}`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-[#0B1120]">{value}</div>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

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

function Index() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2026-05");

  // Debt action states
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isEditDebtOpen, setIsEditDebtOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);
  const [payingDebt, setPayingDebt] = useState<any | null>(null);
  const [payAmountInput, setPayAmountInput] = useState("");

  // Debt form states
  const [debtName, setDebtName] = useState("");
  const [debtOriginalAmount, setDebtOriginalAmount] = useState("");
  const [debtPaymentType, setDebtPaymentType] = useState("Parcelado"); // "À vista" or "Parcelado"
  const [debtInstallmentsCount, setDebtInstallmentsCount] = useState("10");
  const [debtPaidInstallments, setDebtPaidInstallments] = useState("0");
  const [debtInstallmentAmount, setDebtInstallmentAmount] = useState("");
  const [debtStatus, setDebtStatus] = useState("Pendente");

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      if (data) {
        // Map database status ('paid' -> 'Pago', 'pending' -> 'Pendente')
        const mapped = data.map((t: any) => ({
          ...t,
          status: t.status === "paid" ? "Pago" : t.status === "pending" ? "Pendente" : t.status,
        }));
        setTransactions(mapped);
      }
    } catch (err: any) {
      console.error("Erro ao buscar transações:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const autoMigrate = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user && !localStorage.getItem("migracao_final_concluida_v5")) {
          console.log("Iniciando migração automática agressiva...");

          // Apaga todos os dados existentes do usuário logado
          const { error: delError } = await supabase
            .from("transactions")
            .delete()
            .eq("user_id", session.user.id);
          if (delError) {
            console.error("Erro ao apagar dados falsos:", delError);
            fetchTransactions();
            return;
          }

          // Importa todos os dados do JSON, mapeando status para os valores válidos do banco ('paid', 'pending')
          const batch = importData.map((t) => ({
            user_id: session.user.id,
            type: t.type,
            description: t.description,
            amount: t.amount,
            date: t.date,
            category: t.category,
            status: t.status === "Pago" ? "paid" : t.status === "Pendente" ? "pending" : "pending",
          }));

          const { error: insError } = await supabase.from("transactions").insert(batch);
          if (insError) {
            console.error("Erro ao inserir dados da planilha:", insError);
            fetchTransactions();
            return;
          }

          localStorage.setItem("migracao_final_concluida_v5", "true");
          alert(
            "SISTEMA ATUALIZADO! Dados falsos removidos e todas as transações reais da planilha carregadas com sucesso!",
          );
          window.location.reload();
        } else {
          fetchTransactions();
        }
      } catch (err) {
        console.error("Erro geral na migração:", err);
        fetchTransactions();
      }
    };

    autoMigrate();
  }, []);

  // Database action handlers
  const handleSaveDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debtName || !debtOriginalAmount) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const origAmt = parseFloat(debtOriginalAmount);
      const instCount = parseInt(debtInstallmentsCount, 10) || 1;
      const paidInst = parseInt(debtPaidInstallments, 10) || 0;
      const instAmt = debtPaymentType === "Parcelado"
        ? (debtInstallmentAmount ? parseFloat(debtInstallmentAmount) : origAmt / instCount)
        : origAmt;

      const debtData = {
        name: debtName,
        originalAmount: origAmt,
        renegotiated: debtPaymentType === "Parcelado",
        paymentType: debtPaymentType,
        installmentsCount: instCount,
        paidInstallments: paidInst,
        installmentAmount: instAmt
      };

      const description = `DEBT_JSON:${JSON.stringify(debtData)}`;
      const dbStatus = (paidInst >= instCount || debtStatus === "Pago") ? "paid" : "pending";

      if (selectedDebt) {
        const { error } = await supabase
          .from("transactions")
          .update({
            description,
            amount: debtPaymentType === "Parcelado" ? Math.max((instCount - paidInst) * instAmt, 0) : origAmt,
            status: dbStatus
          })
          .eq("id", selectedDebt.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("transactions").insert({
          user_id: user.id,
          type: "expense",
          description,
          amount: origAmt,
          date: `${selectedMonth}-10`,
          category: "Cartão - Outros",
          status: dbStatus
        });

        if (error) throw error;
      }

      setIsAddDebtOpen(false);
      setIsEditDebtOpen(false);
      setSelectedDebt(null);
      await fetchTransactions();
    } catch (err: any) {
      alert("Erro ao salvar dívida: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingDebt || !payAmountInput) return;
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const payAmt = parseFloat(payAmountInput);
      const newPaid = payingDebt.paidInstallments + (payingDebt.paymentType === "Parcelado" ? 1 : 0);
      const isCompleted = payingDebt.paymentType === "Parcelado"
        ? newPaid >= payingDebt.installmentsCount
        : (payingDebt.amount - payAmt) <= 0;

      const updatedDebtData = {
        name: payingDebt.name,
        originalAmount: payingDebt.originalAmount,
        renegotiated: payingDebt.renegotiated,
        paymentType: payingDebt.paymentType,
        installmentsCount: payingDebt.installmentsCount,
        paidInstallments: payingDebt.paymentType === "Parcelado" ? newPaid : (isCompleted ? 1 : 0),
        installmentAmount: payingDebt.installmentAmount
      };

      const description = `DEBT_JSON:${JSON.stringify(updatedDebtData)}`;
      const dbStatus = isCompleted ? "paid" : "pending";

      // 1. Update master debt record
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          description,
          amount: payingDebt.paymentType === "Parcelado" ? Math.max((payingDebt.installmentsCount - newPaid) * payingDebt.installmentAmount, 0) : Math.max(payingDebt.amount - payAmt, 0),
          status: dbStatus
        })
        .eq("id", payingDebt.id);

      if (updateError) throw updateError;

      // 2. Insert payment record
      const paymentDesc = payingDebt.paymentType === "Parcelado"
        ? `[Os dois] Pagamento Parcela - ${payingDebt.name} (${newPaid}/${payingDebt.installmentsCount})`
        : `[Os dois] Amortização - ${payingDebt.name}`;

      const { error: insertError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "expense",
        description: paymentDesc,
        amount: payAmt,
        date: `${selectedMonth}-10`,
        category: "Cartão - Outros",
        status: "paid"
      });

      if (insertError) throw insertError;

      setPayingDebt(null);
      setPayAmountInput("");
      await fetchTransactions();
    } catch (err: any) {
      alert("Erro ao pagar dívida: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDebt = async (id: string) => {
    if (!confirm("Tem certeza que deseja remover esta dívida do plano de quitação?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      await fetchTransactions();
    } catch (err: any) {
      alert("Erro ao excluir dívida: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditDebt = (debt: any) => {
    setSelectedDebt(debt);
    setDebtName(debt.name);
    setDebtOriginalAmount(debt.originalAmount.toString());
    setDebtPaymentType(debt.paymentType);
    setDebtInstallmentsCount(debt.installmentsCount.toString());
    setDebtPaidInstallments(debt.paidInstallments.toString());
    setDebtInstallmentAmount(debt.installmentAmount.toString());
    setDebtStatus(debt.status);
    setIsEditDebtOpen(true);
  };

  const handleOpenAddDebt = () => {
    setSelectedDebt(null);
    setDebtName("");
    setDebtOriginalAmount("");
    setDebtPaymentType("Parcelado");
    setDebtInstallmentsCount("10");
    setDebtPaidInstallments("0");
    setDebtInstallmentAmount("");
    setDebtStatus("Pendente");
    setIsAddDebtOpen(true);
  };

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const parseResponsible = (description: string) => {
    const desc = String(description || "");
    if (desc.startsWith("DEBT_JSON:")) {
      try {
        const data = JSON.parse(desc.substring(10));
        return { name: "Os dois", cleanDesc: `Dívida: ${data.name}` };
      } catch (e) {
        return { name: "Os dois", cleanDesc: "Dívida" };
      }
    }
    if (desc.startsWith("[Jack] ")) {
      return { name: "Jack", cleanDesc: desc.replace("[Jack] ", "") };
    }
    if (desc.startsWith("[Rangel] ")) {
      return { name: "Rangel", cleanDesc: desc.replace("[Rangel] ", "") };
    }
    if (desc.startsWith("[Os dois] ")) {
      return { name: "Os dois", cleanDesc: desc.replace("[Os dois] ", "") };
    }
    return { name: "Os dois", cleanDesc: desc };
  };

  // Get unique months from database to populate selector
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

  // General calculations for the selected month
  const receitas = filteredTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Exclude master debts from monthly expenses so they don't skew the monthly budget
  const despesas = filteredTransactions
    .filter((t) => t.type === "expense" && !isDebtTransaction(t))
    .reduce((acc, curr) => acc + curr.amount, 0);

  const saldo = receitas - despesas;

  // Credit card outstanding balance for the selected month
  const dividasNubank = filteredTransactions
    .filter((t) => t.category === "Cartão - Nubank")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const dividasInter = filteredTransactions
    .filter((t) => t.category === "Cartão - Inter")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const dividasTotais = dividasNubank + dividasInter;

  // Emergency reserves
  const aportesReserva = transactions
    .filter((t) => t.category === "Renda - Investimentos")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalReserva = 1500 + aportesReserva;
  const metaReserva = 12000;
  const pctReserva = Math.min(Math.round((totalReserva / metaReserva) * 100), 100);

  // Debt Payoff Plan logic
  const debtsList = transactions.filter(isDebtTransaction).map(parseDebt);
  const totalDividaOriginal = debtsList.reduce((acc, curr) => acc + curr.originalAmount, 0);
  const totalDividaRestante = debtsList.reduce((acc, curr) => {
    if (curr.status === "paid" || curr.status === "Pago") return acc;
    if (curr.paymentType === "Parcelado") {
      return acc + Math.max((curr.installmentsCount - curr.paidInstallments) * curr.installmentAmount, 0);
    } else {
      return acc + curr.amount;
    }
  }, 0);
  const totalDividaPaga = totalDividaOriginal - totalDividaRestante;
  const pctQuitado = totalDividaOriginal > 0 ? Math.min(Math.round((totalDividaPaga / totalDividaOriginal) * 100), 100) : 0;

  // Real spent by category in the selected month
  const categorySpent: { [key: string]: number } = {};
  filteredTransactions
    .filter((t) => t.type === "expense" && !isDebtTransaction(t))
    .forEach((t) => {
      categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
    });

  const chartData = [
    { name: "Receitas", value: receitas },
    { name: "Despesas", value: despesas },
  ];

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

  // Automated tips
  const getFinancialTip = () => {
    if (saldo < 0) {
      return {
        title: "Alerta de Caixa Negativo",
        text: `Seus gastos superaram as receitas em ${formatMonthName(selectedMonth)}. Dica: revise a aba de despesas e adie qualquer compra não essencial até o mês que vem.`,
        type: "danger",
      };
    }
    if (dividasTotais > receitas * 0.4) {
      return {
        title: "Atenção ao Cartão de Crédito",
        text: `Suas faturas de cartão (R$ ${dividasTotais.toFixed(2)}) somam mais de 40% da sua renda em ${formatMonthName(selectedMonth)}. Evite parcelamentos para liberar seu caixa mensal.`,
        type: "warning",
      };
    }
    if (pctReserva < 50) {
      return {
        title: "Fortaleça sua Proteção",
        text: "Sua Reserva de Emergência está abaixo de 50% da meta. Guardar R$ 50 de cada Pix recebido ajudará a blindar sua família contra imprevistos.",
        type: "info",
      };
    }
    return {
      title: "Finanças Equilibradas!",
      text: `Seu saldo de ${formatMonthName(selectedMonth)} está positivo e seus tetos de gastos estão controlados. Parabéns pelo foco e compromisso do casal!`,
      type: "success",
    };
  };

  const tip = getFinancialTip();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#0B1120]">Painel Familiar</h1>
          <p className="text-slate-500 text-sm">
            Resumo financeiro para controle de gastos e acúmulo de riqueza.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Month Selector */}
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
          <AddTransactionDialog onAdd={fetchTransactions} />
        </div>
      </div>

      {/* Cartão de Dicas Financeiras Automatizado */}
      <Card className={`border border-border/60 shadow-sm p-5 bg-white relative overflow-hidden`}>
        <div className="flex gap-4 items-start">
          <div
            className={`p-3 rounded-2xl ${
              tip.type === "danger"
                ? "bg-red-50 text-red-600"
                : tip.type === "warning"
                  ? "bg-amber-50 text-amber-600"
                  : tip.type === "info"
                    ? "bg-blue-50 text-[#1576D0]"
                    : "bg-emerald-100 text-emerald-700"
            }`}
          >
            <Sparkles className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-[#0B1120] flex items-center gap-1.5">
              {tip.title}
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed max-w-3xl">{tip.text}</p>
          </div>
        </div>
      </Card>

      {/* Cartões de Resumo */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Saldo Atual"
          value={formatCurrency(saldo)}
          icon={Coins}
          color={saldo >= 0 ? "text-emerald-600" : "text-rose-600"}
          bgClass={saldo >= 0 ? "bg-emerald-50" : "bg-rose-50"}
          subtitle="Sobra líquida no caixa"
        />
        <SummaryCard
          title="Receitas (Entradas)"
          value={formatCurrency(receitas)}
          icon={ArrowUpRight}
          color="text-emerald-600"
          bgClass="bg-emerald-50"
          subtitle="Tudo que entrou no mês"
        />
        <SummaryCard
          title="Despesas (Saídas)"
          value={formatCurrency(despesas)}
          icon={ArrowDownLeft}
          color="text-rose-600"
          bgClass="bg-rose-50"
          subtitle="Tudo que saiu no mês"
        />
        <SummaryCard
          title="Uso de Cartão de Crédito"
          value={formatCurrency(dividasTotais)}
          icon={CreditCard}
          color="text-amber-600"
          bgClass="bg-amber-50"
          subtitle="Faturas de Nubank + Inter"
        />
      </div>

      {/* Metas da Família (Reserva e Quitação de Dívidas) */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Reserva de Emergência */}
        <Card className="border border-border/80 p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-[#0B1120] flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 rounded-xl text-emerald-600">
                  <Vault className="w-5 h-5" />
                </div>
                Reserva de Emergência
              </h3>
              <p className="text-xs text-slate-500">Meta de proteção familiar contra imprevistos</p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-lg text-[#0B1120]">
                {formatCurrency(totalReserva)}
              </span>
              <span className="text-xs text-slate-500 block">
                Meta: {formatCurrency(metaReserva)}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${pctReserva}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>{pctReserva}% Concluído</span>
              <span>Resta {formatCurrency(Math.max(metaReserva - totalReserva, 0))}</span>
            </div>
          </div>
        </Card>

        {/* Plano Quitação de Dívidas */}
        <Card className="border border-border/80 p-6 bg-white rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-[#0B1120] flex items-center gap-3">
                  <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                    <HandCoins className="w-5 h-5" />
                  </div>
                  Plano Quitação de Dívidas
                </h3>
                <p className="text-xs text-slate-500">Organização e quitação de dívidas</p>
              </div>
              <div className="text-right">
                <span className="font-extrabold text-lg text-[#0B1120]">
                  {formatCurrency(totalDividaRestante)}
                </span>
                <span className="text-xs text-slate-500 block">
                  Dívida Inicial: {formatCurrency(totalDividaOriginal)}
                </span>
              </div>
            </div>

            {/* Progresso de Quitação Geral */}
            <div className="space-y-2 mb-6">
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-rose-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${pctQuitado}%` }}
                />
              </div>
              <div className="flex justify-between text-xs font-semibold text-slate-500">
                <span>{pctQuitado}% Quitado</span>
                <span>Economizou/Amortizou: {formatCurrency(totalDividaOriginal - totalDividaRestante)}</span>
              </div>
            </div>

            {/* Lista Interativa de Dívidas */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1 border-t border-slate-100 pt-3">
              {debtsList.map((debt) => {
                const isPaid = debt.status === "paid" || debt.status === "Pago";
                const isRenegotiated = debt.paymentType === "Parcelado";
                const progressPct = isPaid 
                  ? 100 
                  : (isRenegotiated 
                      ? Math.min(Math.round((debt.paidInstallments / debt.installmentsCount) * 100), 100)
                      : Math.min(Math.round(((debt.originalAmount - debt.amount) / debt.originalAmount) * 100), 100)
                    );

                return (
                  <div key={debt.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm text-slate-800 block">{debt.name}</span>
                        <span className="text-xs text-slate-500">
                          {isRenegotiated 
                            ? `Acordo: ${debt.installmentsCount}x de ${formatCurrency(debt.installmentAmount)}` 
                            : "À vista"
                          }
                        </span>
                      </div>
                      <div className="text-right">
                        <span className={`text-sm font-extrabold block ${isPaid ? "text-emerald-600 line-through" : "text-rose-600"}`}>
                          {isPaid ? "Quitada" : formatCurrency(debt.paymentType === "Parcelado" ? (debt.installmentsCount - debt.paidInstallments) * debt.installmentAmount : debt.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          {isRenegotiated ? `${debt.paidInstallments}/${debt.installmentsCount} pagas` : "Saldo pendente"}
                        </span>
                      </div>
                    </div>

                    {/* Progress indicator per debt */}
                    <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${isPaid ? "bg-emerald-500" : "bg-rose-400"}`}
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>

                    {/* Action buttons */}
                    <div className="flex justify-between items-center pt-1 mt-1 border-t border-slate-200/40">
                      <div>
                        {isPaid ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[10px] font-bold border-none">
                            Pago
                          </Badge>
                        ) : isRenegotiated ? (
                          <Badge className="bg-blue-50 text-[#1576D0] text-[10px] font-bold border-none">
                            Acordo Ativo
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-50 text-amber-700 text-[10px] font-bold border-none">
                            Sem Acordo
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {!isPaid && (
                          <button
                            onClick={() => {
                              setPayingDebt(debt);
                              setPayAmountInput(debt.installmentAmount.toString());
                            }}
                            title="Lançar Pagamento"
                            className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-colors"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleOpenEditDebt(debt)}
                          title="Renegociar / Editar"
                          className="p-1.5 bg-blue-50 text-[#1576D0] rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteDebt(debt.id)}
                          title="Excluir"
                          className="p-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {debtsList.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-6">
                  Nenhuma dívida registrada no plano de quitação.
                </div>
              )}
            </div>
          </div>

          <Button 
            onClick={handleOpenAddDebt} 
            variant="outline" 
            className="w-full mt-4 border-[#1576D0] text-[#1576D0] hover:bg-blue-50 h-10 font-bold rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" /> Adicionar Nova Dívida
          </Button>
        </Card>
      </div>

      {/* Orçamento e Teto de Gastos */}
      <Card className="border border-border/80 p-6 bg-white rounded-2xl shadow-sm">
        <div className="mb-6">
          <h3 className="font-bold text-lg text-[#0B1120] flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
              <Scale className="w-5 h-5" />
            </div>
            Teto de Gastos (Orçamento do Casal)
          </h3>
          <p className="text-xs text-slate-500">
            Monitore o limite de gastos mensais por categoria para economizar em {formatMonthName(selectedMonth)}.
          </p>
        </div>

        <div className="grid gap-5 grid-cols-1 md:grid-cols-2">
          {Object.entries(CATEGORY_LIMITS).map(([category, limit]) => {
            const spent = categorySpent[category] || 0;
            const pct = Math.min(Math.round((spent / limit) * 100), 100);

            // Definição da cor da barra de orçamento
            let barColor = "bg-emerald-500";
            if (spent > limit) {
              barColor = "bg-rose-500";
            } else if (spent > limit * 0.75) {
              barColor = "bg-amber-500";
            }

            return (
              <div key={category} className="space-y-2 border-b border-border/30 pb-3">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-slate-800">{category}</span>
                  <span className="text-slate-500">
                    <strong className={spent > limit ? "text-rose-600" : "text-[#0B1120]"}>
                      {formatCurrency(spent)}
                    </strong>{" "}
                    / {formatCurrency(limit)}
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`${barColor} h-full rounded-full transition-all duration-300`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                  <span>{pct}% do orçamento utilizado</span>
                  <span>
                    {spent > limit
                      ? `Estourou por ${formatCurrency(spent - limit)}`
                      : `Resta ${formatCurrency(limit - spent)}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Gráfico e Últimos Lançamentos */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 p-6 border border-border/80 shadow-sm bg-white rounded-2xl w-full min-w-0 overflow-hidden">
          <h2 className="text-lg font-bold mb-6 text-[#0B1120]">Balanço - {formatMonthName(selectedMonth)}</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: "#f8f8f8" }} />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={55}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#10b981" : "#f43f5e"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-3 p-6 border border-border/80 shadow-sm bg-white rounded-2xl w-full overflow-hidden">
          <h2 className="text-lg font-bold mb-6 text-[#0B1120]">Últimos Lançamentos</h2>
          <div className="overflow-x-auto w-full">
            <Table>
              <TableBody>
                {filteredTransactions.slice(0, 5).map((t) => {
                  const { name: respName, cleanDesc } = parseResponsible(t.description);
                  return (
                    <TableRow
                      key={t.id}
                      className="hover:bg-slate-50 border-none transition-colors"
                    >
                      <TableCell className="pl-0 py-3">
                        <div className="font-semibold text-sm text-slate-800">{cleanDesc}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex flex-wrap gap-2 items-center">
                          <span>{t.category}</span>
                          <span>•</span>
                          <span>{new Date(t.date).toLocaleDateString("pt-BR")}</span>
                          {t.type === "expense" && (
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                                respName === "Jack"
                                  ? "bg-violet-100 text-violet-700"
                                  : respName === "Rangel"
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {respName}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell
                        className={`text-right font-extrabold py-3 text-sm ${t.type === "income" ? "text-emerald-600" : "text-rose-600"}`}
                      >
                        {t.type === "income" ? "+" : "-"} {formatCurrency(t.amount)}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredTransactions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500 py-8">
                      Nenhuma transação cadastrada para este mês.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>

      {/* DIALOGS FOR DEBT MANAGEMENT */}
      {/* DIALOG: Nova Dívida */}
      <Dialog open={isAddDebtOpen} onOpenChange={setIsAddDebtOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Adicionar Dívida ao Plano</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDebt} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome da Dívida / Credor</Label>
              <Input
                required
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
                placeholder="Ex: Empréstimo Zippy, Renner, Sicoob"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Total Original (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={debtOriginalAmount}
                  onChange={(e) => setDebtOriginalAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Quitação</Label>
                <Select value={debtPaymentType} onValueChange={setDebtPaymentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parcelado">Parcelado / Acordo</SelectItem>
                    <SelectItem value="À vista">À vista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {debtPaymentType === "Parcelado" && (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Total Parcelas</Label>
                  <Input
                    type="number"
                    required
                    value={debtInstallmentsCount}
                    onChange={(e) => setDebtInstallmentsCount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pagas</Label>
                  <Input
                    type="number"
                    required
                    value={debtPaidInstallments}
                    onChange={(e) => setDebtPaidInstallments(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Parcela (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={debtInstallmentAmount}
                    onChange={(e) => setDebtInstallmentAmount(e.target.value)}
                    placeholder="Auto"
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full mt-4 bg-[#1576D0] hover:bg-[#0d5ca5] text-white" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Dívida"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Renegociar/Editar Dívida */}
      <Dialog open={isEditDebtOpen} onOpenChange={setIsEditDebtOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Renegociar / Editar Dívida</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveDebt} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Nome da Dívida / Credor</Label>
              <Input
                required
                value={debtName}
                onChange={(e) => setDebtName(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor Total Original (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={debtOriginalAmount}
                  onChange={(e) => setDebtOriginalAmount(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Quitação</Label>
                <Select value={debtPaymentType} onValueChange={setDebtPaymentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Parcelado">Parcelado / Acordo</SelectItem>
                    <SelectItem value="À vista">À vista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {debtPaymentType === "Parcelado" && (
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                  <Label>Total Parcelas</Label>
                  <Input
                    type="number"
                    required
                    value={debtInstallmentsCount}
                    onChange={(e) => setDebtInstallmentsCount(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pagas</Label>
                  <Input
                    type="number"
                    required
                    value={debtPaidInstallments}
                    onChange={(e) => setDebtPaidInstallments(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor Parcela (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={debtInstallmentAmount}
                    onChange={(e) => setDebtInstallmentAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={debtStatus} onValueChange={setDebtStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Pago">Pago (Quitado)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full mt-4 bg-[#1576D0] hover:bg-[#0d5ca5] text-white" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Alterações"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Registrar Pagamento de Dívida */}
      <Dialog open={payingDebt !== null} onOpenChange={(open) => !open && setPayingDebt(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Registrar Pagamento de Parcela</DialogTitle>
          </DialogHeader>
          {payingDebt && (
            <form onSubmit={handlePayInstallment} className="space-y-4 pt-4">
              <p className="text-sm text-slate-500 leading-relaxed">
                Confirmar pagamento de parcela para a dívida: <strong className="text-slate-800">{payingDebt.name}</strong>.
              </p>
              <div className="space-y-2">
                <Label>Valor do Pagamento / Amortização (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={() => setPayingDebt(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-white" disabled={loading}>
                  {loading ? "Registrando..." : "Confirmar Pagamento"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
