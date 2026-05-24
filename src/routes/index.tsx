import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

function Index() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState("2026-05");

  // Emergency Reserve state variables (persisted in localStorage)
  const [isEditReserveOpen, setIsEditReserveOpen] = useState(false);
  const [reserveBase, setReserveBase] = useState(() => {
    if (typeof window !== "undefined") {
      return parseFloat(localStorage.getItem("reserva_base") || "0");
    }
    return 0;
  });
  const [reserveMeta, setReserveMeta] = useState(() => {
    if (typeof window !== "undefined") {
      return parseFloat(localStorage.getItem("reserva_meta") || "12000");
    }
    return 12000;
  });
  const [reserveBaseInput, setReserveBaseInput] = useState("");
  const [reserveMetaInput, setReserveMetaInput] = useState("");

  const handleOpenEditReserve = () => {
    setReserveBaseInput(reserveBase.toString());
    setReserveMetaInput(reserveMeta.toString());
    setIsEditReserveOpen(true);
  };

  const handleSaveReserve = (e: React.FormEvent) => {
    e.preventDefault();
    const base = parseFloat(reserveBaseInput) || 0;
    const meta = parseFloat(reserveMetaInput) || 0;
    setReserveBase(base);
    setReserveMeta(meta);
    if (typeof window !== "undefined") {
      localStorage.setItem("reserva_base", base.toString());
      localStorage.setItem("reserva_meta", meta.toString());
    }
    setIsEditReserveOpen(false);
  };

  // Debt action states
  const [isAddDebtOpen, setIsAddDebtOpen] = useState(false);
  const [isEditDebtOpen, setIsEditDebtOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<any | null>(null);
  const [payingDebt, setPayingDebt] = useState<any | null>(null);
  const [payAmountInput, setPayAmountInput] = useState("");

  // Card configurations and states
  const [cardsConfig, setCardsConfig] = useState<any[]>([]);
  const [isEditCardsOpen, setIsEditCardsOpen] = useState(false);
  const [tempCardsConfig, setTempCardsConfig] = useState<any[]>([]);
  const [selectedFaturaCard, setSelectedFaturaCard] = useState<string | null>(null);

  // Bill payment states
  const [payTransaction, setPayTransaction] = useState<any | null>(null);

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
        if (session?.user && !localStorage.getItem("migracao_final_concluida_v6")) {
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

          // Importa todos os dados do JSON (filtrando BM Tech), mapeando status para os valores válidos do banco ('paid', 'pending')
          const batch = importData
            .filter((t) => !String(t.description || "").toLowerCase().includes("bm tech"))
            .map((t) => ({
              user_id: session.user.id,
              type: t.type,
              description: t.description,
              amount: t.amount,
              date: t.date,
              category: t.category,
              status: t.type === "income" ? "paid" : (t.status === "Pago" ? "paid" : "pending"),
            }));

          const { error: insError } = await supabase.from("transactions").insert(batch);
          if (insError) {
            console.error("Erro ao inserir dados da planilha:", insError);
            fetchTransactions();
            return;
          }

          localStorage.setItem("migracao_final_concluida_v6", "true");
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

  // Card configurations local load
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("cartoes_config");
        if (stored) {
          setCardsConfig(JSON.parse(stored));
        } else {
          const defaults = [
            { name: "Nubank", limit: 3000, dueDate: 10 },
            { name: "Inter", limit: 2000, dueDate: 15 },
            { name: "Sicredi", limit: 5000, dueDate: 20 }
          ];
          localStorage.setItem("cartoes_config", JSON.stringify(defaults));
          setCardsConfig(defaults);
        }
      } catch (e) {
        console.error(e);
      }
    }
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

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTransaction || !payAmountInput) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          status: "paid",
          amount: parseFloat(payAmountInput),
        })
        .eq("id", payTransaction.id);

      if (error) throw error;

      setPayTransaction(null);
      setPayAmountInput("");
      await fetchTransactions();
    } catch (err: any) {
      alert("Erro ao pagar conta: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditCards = () => {
    setTempCardsConfig(JSON.parse(JSON.stringify(cardsConfig)));
    setIsEditCardsOpen(true);
  };

  const handleSaveCardsConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setCardsConfig(tempCardsConfig);
    if (typeof window !== "undefined") {
      localStorage.setItem("cartoes_config", JSON.stringify(tempCardsConfig));
    }
    setIsEditCardsOpen(false);
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

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
      await fetchTransactions();
    } catch (err: any) {
      alert("Erro ao excluir lançamento: " + err.message);
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
    const meta = parseMeta(description);
    return { name: meta.responsible, cleanDesc: meta.cleanDesc };
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

  // General calculations for the selected month
  const receitas = parsedTransactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Exclude pending master debts and credit card purchases from cash flow despesas.
  // Paid debts (t.status === "Pago" / "paid") ARE included in despesas because they are already paid!
  const despesas = parsedTransactions
    .filter((t) => 
      t.type === "expense" && 
      (!isDebtTransaction(t) || t.status === "Pago" || t.status === "paid") && 
      t.cardId === null
    )
    .reduce((acc, curr) => acc + curr.amount, 0);

  const saldo = receitas - despesas;

  // Dynamic credit card fatura calculation
  const getCardFaturaSum = (cardName: string) => {
    return parsedTransactions
      .filter((t) => t.type === "expense" && t.cardId === cardName)
      .reduce((acc, curr) => acc + curr.amount, 0);
  };

  const dividasTotais = cardsConfig.reduce((acc, card) => acc + getCardFaturaSum(card.name), 0);

  // Custos Fixos vs Variáveis (excluindo dívidas pendentes)
  const fixedExpenses = parsedTransactions
    .filter((t) => 
      t.type === "expense" && 
      (!isDebtTransaction(t) || t.status === "Pago" || t.status === "paid") && 
      t.costType === "fixed"
    )
    .reduce((acc, curr) => acc + curr.amount, 0);

  const variableExpenses = parsedTransactions
    .filter((t) => 
      t.type === "expense" && 
      (!isDebtTransaction(t) || t.status === "Pago" || t.status === "paid") && 
      t.costType === "variable"
    )
    .reduce((acc, curr) => acc + curr.amount, 0);

  // Contas em aberto (qualquer situação com status Pendente, excluindo dívidas que vão para o plano de quitação)
  const contasEmAberto = parsedTransactions.filter((t) => t.status === "Pendente" && !isDebtTransaction(t));

  // Emergency reserves (configurable from state)
  const aportesReserva = transactions
    .filter((t) => t.category === "Renda - Investimentos")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalReserva = reserveBase + aportesReserva;
  const metaReserva = reserveMeta;
  const pctReserva = metaReserva > 0 ? Math.min(Math.round((totalReserva / metaReserva) * 100), 100) : 0;

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
  parsedTransactions
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
                <span>Reserva de Emergência</span>
                <button
                  onClick={handleOpenEditReserve}
                  className="p-1 text-slate-400 hover:text-[#1576D0] hover:bg-slate-100 rounded transition-colors"
                  title="Editar Reserva"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
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

      {/* Gestão de Cartões de Crédito e Contas em Aberto */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Cartões de Crédito */}
        <Card className="border border-border/80 p-6 bg-white rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-[#0B1120] flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 rounded-xl text-[#1576D0]">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <span>Cartões de Crédito</span>
                  <button
                    onClick={handleOpenEditCards}
                    className="p-1 text-slate-400 hover:text-[#1576D0] hover:bg-slate-100 rounded transition-colors"
                    title="Configurar Limites e Vencimentos"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </h3>
                <p className="text-xs text-slate-500">Acompanhe faturas, limites e vencimentos</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {cardsConfig.map((card) => {
                const totalSpent = getCardFaturaSum(card.name);
                const pctLimit = card.limit > 0 ? Math.min(Math.round((totalSpent / card.limit) * 100), 100) : 0;
                
                let progressBarColor = "bg-blue-500";
                if (totalSpent > card.limit) {
                  progressBarColor = "bg-rose-500";
                } else if (totalSpent > card.limit * 0.8) {
                  progressBarColor = "bg-amber-500";
                }

                return (
                  <div key={card.name} className="p-3.5 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-sm text-slate-800 block">{card.name}</span>
                        <span className="text-xs text-slate-500 font-medium">
                          Vence dia {card.dueDate}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-extrabold text-slate-800 block">
                          {formatCurrency(totalSpent)}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Limite: {formatCurrency(card.limit)}
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200/70 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressBarColor}`}
                        style={{ width: `${pctLimit}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <span className="text-[10px] text-slate-400 font-medium">
                        {pctLimit}% do limite usado
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedFaturaCard(card.name)}
                        className="text-xs text-[#1576D0] hover:text-blue-700 h-6 px-2 font-bold"
                      >
                        Ver Fatura
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Contas em Aberto */}
        <Card className="border border-border/80 p-6 bg-white rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="font-bold text-lg text-[#0B1120] flex items-center gap-3">
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span>Contas em Aberto</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Lançamentos pendentes ou atrasados para {formatMonthName(selectedMonth)}
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
              {contasEmAberto.map((t) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDate = new Date(t.date);
                dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());
                dueDate.setHours(0, 0, 0, 0);
                const overdue = dueDate < today;

                return (
                  <div key={t.id} className="p-3 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-sm text-slate-800 block truncate">
                        {t.cleanDesc}
                      </span>
                      <div className="flex gap-2 items-center text-xs text-slate-500 mt-1 flex-wrap">
                        <span>{t.category}</span>
                        <span>•</span>
                        <span className={`font-semibold ${overdue ? "text-rose-600" : ""}`}>
                          {overdue ? "Atrasou em: " : "Vence: "}
                          {new Date(t.date).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="font-extrabold text-sm text-slate-700">
                        {formatCurrency(t.amount)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            setPayTransaction(t);
                            setPayAmountInput(t.amount.toString());
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-3 rounded-lg text-xs"
                        >
                          Pagar
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg w-8 h-8"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
              {contasEmAberto.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-12">
                  Nenhuma conta em aberto para este mês. Tudo em dia!
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Orçamento e Teto de Gastos */}
      <Card className="border border-border/80 p-6 bg-white rounded-2xl shadow-sm">
        <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
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
          {/* Fixo vs Variável Summary */}
          <div className="flex gap-4 items-center bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs shadow-sm">
            <div>
              <span className="text-slate-400 font-semibold block">CUSTOS FIXOS</span>
              <span className="font-extrabold text-[#0B1120] text-sm">{formatCurrency(fixedExpenses)}</span>
            </div>
            <div className="h-8 w-px bg-slate-200" />
            <div>
              <span className="text-slate-400 font-semibold block">CUSTOS VARIÁVEIS</span>
              <span className="font-extrabold text-[#0B1120] text-sm">{formatCurrency(variableExpenses)}</span>
            </div>
          </div>
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
                      <TableCell className="text-right py-3 pr-0 w-10">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteTransaction(t.id)}
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg w-8 h-8"
                          title="Excluir Lançamento"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredTransactions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-8">
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

      {/* DIALOG: Configurar/Editar Reserva de Emergência */}
      <Dialog open={isEditReserveOpen} onOpenChange={setIsEditReserveOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Configurar Reserva de Emergência</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveReserve} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Saldo Inicial da Reserva (R$)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={reserveBaseInput}
                onChange={(e) => setReserveBaseInput(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label>Meta da Reserva (R$)</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={reserveMetaInput}
                onChange={(e) => setReserveMetaInput(e.target.value)}
                placeholder="12000.00"
              />
            </div>
            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsEditReserveOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1576D0] hover:bg-[#0d5ca5] text-white">
                Salvar Configurações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Configurar Cartões */}
      <Dialog open={isEditCardsOpen} onOpenChange={setIsEditCardsOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Configurar Limites e Vencimentos dos Cartões</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveCardsConfig} className="space-y-4 pt-4">
            {tempCardsConfig.map((card, idx) => (
              <div key={card.name} className="p-3 border border-slate-100 rounded-xl space-y-3 bg-slate-50/50">
                <div className="font-bold text-slate-800 text-sm">{card.name}</div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Limite (R$)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      required
                      value={card.limit}
                      onChange={(e) => {
                        const updated = [...tempCardsConfig];
                        updated[idx].limit = parseFloat(e.target.value) || 0;
                        setTempCardsConfig(updated);
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-500">Dia de Vencimento</Label>
                    <Input
                      type="number"
                      min="1"
                      max="31"
                      required
                      value={card.dueDate}
                      onChange={(e) => {
                        const updated = [...tempCardsConfig];
                        updated[idx].dueDate = parseInt(e.target.value, 10) || 1;
                        setTempCardsConfig(updated);
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditCardsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-[#1576D0] hover:bg-blue-700 text-white">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Ver Fatura Detalhada */}
      <Dialog open={selectedFaturaCard !== null} onOpenChange={(open) => !open && setSelectedFaturaCard(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Fatura Detalhada - {selectedFaturaCard} ({formatMonthName(selectedMonth)})</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-4">
            <div className="max-h-[300px] overflow-y-auto border border-slate-100 rounded-xl">
              <Table>
                <TableBody>
                  {selectedFaturaCard && parsedTransactions.filter(
                    (t) => t.type === "expense" && t.cardId === selectedFaturaCard
                  ).map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50">
                      <TableCell className="py-2.5 font-medium text-xs text-slate-500">
                        {new Date(item.date).toLocaleDateString("pt-BR")}
                      </TableCell>
                      <TableCell className="py-2.5 text-sm font-semibold text-slate-800">
                        {item.cleanDesc}
                      </TableCell>
                      <TableCell className="py-2.5 text-right">
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 mr-2">
                          {item.responsible}
                        </span>
                        <span className="font-extrabold text-sm text-slate-800">
                          {formatCurrency(item.amount)}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {selectedFaturaCard && parsedTransactions.filter(
                    (t) => t.type === "expense" && t.cardId === selectedFaturaCard
                  ).length === 0 && (
                    <TableRow>
                      <TableCell className="text-center py-8 text-xs text-slate-500">
                        Nenhuma compra registrada neste cartão para o mês selecionado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-700 text-sm">Total da Fatura:</span>
              <span className="font-extrabold text-lg text-rose-600">
                {selectedFaturaCard ? formatCurrency(getCardFaturaSum(selectedFaturaCard)) : "R$ 0,00"}
              </span>
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedFaturaCard(null)} className="w-full bg-[#0B1120] hover:bg-slate-800 text-white font-bold h-10 rounded-xl">
                Fechar Fatura
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* DIALOG: Confirmar Pagamento de Conta */}
      <Dialog open={payTransaction !== null} onOpenChange={(open) => !open && setPayTransaction(null)}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Confirmar Pagamento de Conta</DialogTitle>
          </DialogHeader>
          {payTransaction && (
            <form onSubmit={handlePayBill} className="space-y-4 pt-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-sm space-y-1">
                <div>
                  Conta: <strong className="font-bold text-slate-800">{payTransaction.cleanDesc}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Valor registrado: {formatCurrency(payTransaction.amount)}
                </div>
                <div className="text-xs text-slate-500">
                  Vencimento original: {new Date(payTransaction.date).toLocaleDateString("pt-BR")}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Valor Efetivo Pago (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={payAmountInput}
                  onChange={(e) => setPayAmountInput(e.target.value)}
                />
              </div>
              <DialogFooter className="pt-4 gap-2 sm:gap-0">
                <Button type="button" variant="ghost" onClick={() => setPayTransaction(null)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-[#10b981] hover:bg-[#059669] text-white" disabled={loading}>
                  Confirmar Pagamento
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
