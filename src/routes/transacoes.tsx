import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Filter,
  Calendar,
  DollarSign,
  ShoppingBag,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  Check,
  AlertTriangle,
  Pencil,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { EditTransactionDialog } from "@/components/EditTransactionDialog";

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

export const Route = createFileRoute("/transacoes")({
  component: TransactionsPage,
});

function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"income" | "expense">("income");
  const [searchTerm, setSearchTerm] = useState("");

  // Form states for inline adding (Receitas)
  const [incomeSource, setIncomeSource] = useState("");
  const [incomeCategory, setIncomeCategory] = useState("Renda - Salário");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [incomeDate, setIncomeDate] = useState(new Date().toISOString().split("T")[0]);
  const [incomeStatus, setIncomeStatus] = useState("paid"); // "paid", "pending", "overdue"

  // Form states for inline adding (Despesas)
  const [expenseDesc, setExpenseDesc] = useState("");
  const [expenseLocation, setExpenseLocation] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("Casa - Mercado / Compras");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [expenseStatus, setExpenseStatus] = useState("paid"); // "paid", "pending", "overdue"
  const [expenseResponsible, setExpenseResponsible] = useState("Os dois");

  // Novas configurações de cartão e tipo de custo para o form rápido
  const [expenseCostType, setExpenseCostType] = useState("variable"); // "fixed" ou "variable"
  const [expensePaymentMethod, setExpensePaymentMethod] = useState("cash"); // "cash" ou "card"
  const [expenseCardId, setExpenseCardId] = useState("Nubank");
  const [expenseIsInstallments, setExpenseIsInstallments] = useState(false);
  const [expenseInstallmentsCount, setExpenseInstallmentsCount] = useState("3");
  const [cards, setCards] = useState<string[]>(["Nubank", "Inter", "Sicredi"]);

  // States para dar baixa/pagar conta pendente
  const [payTransaction, setPayTransaction] = useState<any | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [openPay, setOpenPay] = useState(false);

  const [editTransaction, setEditTransaction] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);

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
      console.error("Erro ao carregar dados:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    if (typeof window !== "undefined") {
      try {
        const storedCards = localStorage.getItem("cartoes_config");
        if (storedCards) {
          const parsed = JSON.parse(storedCards);
          setCards(parsed.map((c: any) => c.name));
          if (parsed.length > 0) {
            setExpenseCardId(parsed[0].name);
          }
        }
      } catch (e) {
        console.error("Error reading cards config:", e);
      }
    }
  }, []);

  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeSource || !incomeAmount || !incomeDate) return;
    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const metaData = {
        desc: incomeSource,
        costType: "variable",
        cardId: null
      };

      const finalDesc = `META_JSON:${JSON.stringify(metaData)}`;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "income",
        description: finalDesc,
        amount: parseFloat(incomeAmount),
        date: incomeDate,
        category: incomeCategory,
        status: incomeStatus === "paid" ? "paid" : "pending",
      });

      if (error) throw error;

      setIncomeSource("");
      setIncomeAmount("");
      setIncomeDate(new Date().toISOString().split("T")[0]);
      setIncomeStatus("paid");

      await fetchTransactions();
    } catch (err: any) {
      alert("Erro ao adicionar receita: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseDesc || !expenseAmount || !expenseDate) return;
    setActionLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const rawDesc = expenseLocation ? `${expenseDesc} (${expenseLocation})` : expenseDesc;
      const baseAmount = parseFloat(expenseAmount);
      const isCard = expensePaymentMethod === "card";

      // Lógica de parcelamento automático
      if (isCard && expenseIsInstallments) {
        const instCount = parseInt(expenseInstallmentsCount, 10) || 1;
        const batch = [];
        let remainingAmount = baseAmount;

        for (let i = 1; i <= instCount; i++) {
          let currentAmt = parseFloat((baseAmount / instCount).toFixed(2));
          if (i === instCount) {
            currentAmt = parseFloat(remainingAmount.toFixed(2));
          } else {
            remainingAmount -= currentAmt;
          }

          const instDate = new Date(expenseDate + "T00:00:00");
          instDate.setMonth(instDate.getMonth() + (i - 1));
          const dateString = instDate.toISOString().split("T")[0];

          const label = `[${i}/${instCount}] ${rawDesc}`;
          const metaData = {
            desc: label,
            costType: expenseCostType,
            cardId: expenseCardId,
            installment: { current: i, total: instCount }
          };

          const finalDesc = `[${expenseResponsible}] META_JSON:${JSON.stringify(metaData)}`;

          batch.push({
            user_id: user.id,
            type: "expense",
            description: finalDesc,
            amount: currentAmt,
            date: dateString,
            category: expenseCategory,
            status: expenseStatus === "paid" ? "paid" : "pending",
          });
        }

        const { error } = await supabase.from("transactions").insert(batch);
        if (error) throw error;
      } else {
        // Lógica simples (à vista / pix)
        const metaData = {
          desc: rawDesc,
          costType: expenseCostType,
          cardId: isCard ? expenseCardId : null
        };

        const finalDesc = `[${expenseResponsible}] META_JSON:${JSON.stringify(metaData)}`;

        const { error } = await supabase.from("transactions").insert({
          user_id: user.id,
          type: "expense",
          description: finalDesc,
          amount: baseAmount,
          date: expenseDate,
          category: expenseCategory,
          status: expenseStatus === "paid" ? "paid" : "pending",
        });

        if (error) throw error;
      }

      setExpenseDesc("");
      setExpenseLocation("");
      setExpenseAmount("");
      setExpenseDate(new Date().toISOString().split("T")[0]);
      setExpenseResponsible("Os dois");
      setExpenseCostType("variable");
      setExpensePaymentMethod("cash");
      setExpenseIsInstallments(false);
      setExpenseInstallmentsCount("3");
      setExpenseStatus("paid");

      await fetchTransactions();
    } catch (err: any) {
      alert("Erro ao adicionar despesa: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenPayModal = (transaction: any) => {
    setPayTransaction(transaction);
    setPayAmount(transaction.amount.toString());
    setOpenPay(true);
  };

  const handlePayBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payTransaction || !payAmount || !payDate) return;
    setActionLoading(true);

    try {
      const { error } = await supabase
        .from("transactions")
        .update({
          status: "paid",
          amount: parseFloat(payAmount),
          date: payDate,
        })
        .eq("id", payTransaction.id);

      if (error) throw error;

      setOpenPay(false);
      setPayTransaction(null);
      await fetchTransactions();
    } catch (err: any) {
      alert("Erro ao baixar lançamento: " + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir este lançamento?")) {
      try {
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        if (error) throw error;
        await fetchTransactions();
      } catch (err: any) {
        alert("Erro ao excluir: " + err.message);
      }
    }
  };

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      date.setMinutes(date.getMinutes() + date.getTimezoneOffset());
      return date.toLocaleDateString("pt-BR");
    } catch {
      return dateStr;
    }
  };

  const isOverdue = (dateStr: string, status: string) => {
    if (status === "Pago") return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(dateStr);
    dueDate.setMinutes(dueDate.getMinutes() + dueDate.getTimezoneOffset());
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < today;
  };

  const parseResponsible = (description: string) => {
    const meta = parseMeta(description);
    return { name: meta.responsible, cleanDesc: meta.cleanDesc };
  };

  const filteredTransactions = transactions
    .filter((t) => t.type === activeTab)
    .filter(
      (t) =>
        parseMeta(t.description).cleanDesc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.category || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 md:p-8 space-y-8 bg-background min-h-screen"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Planilha de Lançamentos
          </h1>
          <p className="text-muted-foreground">
            Gerencie contas e receitas da família com controle de vencimentos.
          </p>
        </div>

        {/* Alternador de Abas */}
        <div className="flex bg-muted p-1 rounded-xl w-fit border border-border/50">
          <button
            onClick={() => {
              setActiveTab("income");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "income"
                ? "bg-white text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            Receitas (Entradas)
          </button>
          <button
            onClick={() => {
              setActiveTab("expense");
              setSearchTerm("");
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === "expense"
                ? "bg-white text-destructive shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <TrendingDown className="w-4 h-4 text-rose-600" />
            Despesas (Gastos)
          </button>
        </div>
      </div>

      {/* Caixa de Busca */}
      <div className="relative max-w-md">
        <Input
          placeholder={
            activeTab === "income"
              ? "Buscar por fonte ou categoria..."
              : "Buscar por gasto, local ou categoria..."
          }
          className="bg-white text-[#0B1120] placeholder:text-slate-400 border-none shadow-sm pl-10 h-11 rounded-xl focus:ring-1 focus:ring-primary"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Filter className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
      </div>

      {/* FORMULÁRIO DE ADIÇÃO DE RECEITAS */}
      {activeTab === "income" && (
        <Card className="border border-border/80 shadow-sm bg-white p-5 rounded-2xl">
          <form
            onSubmit={handleAddIncome}
            className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end"
          >
            <div className="space-y-1.5 md:col-span-2">
              <span className="text-xs font-bold text-slate-500 ml-1">Fonte de Renda / Origem</span>
              <Input
                required
                placeholder="Ex: Salário, Freelance, Pix Recebido..."
                value={incomeSource}
                onChange={(e) => setIncomeSource(e.target.value)}
                className="bg-slate-100 text-[#0B1120] placeholder:text-slate-400 border border-slate-200 focus:bg-white h-11 rounded-lg"
              />
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500 ml-1">Categoria</span>
              <Select value={incomeCategory} onValueChange={setIncomeCategory}>
                <SelectTrigger className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Renda - Salário">Renda - Salário</SelectItem>
                  <SelectItem value="Renda - PIX Recebido">Renda - PIX Recebido</SelectItem>
                  <SelectItem value="Renda - Freelance">Renda - Freelance</SelectItem>
                  <SelectItem value="Renda - Investimentos">Renda - Investimentos</SelectItem>
                  <SelectItem value="Renda - Outros">Renda - Outros</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 ml-1">Valor (R$)</span>
                <Input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value)}
                  className="bg-slate-100 text-[#0B1120] placeholder:text-slate-400 border border-slate-200 focus:bg-white h-11 rounded-lg"
                />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 ml-1">Data</span>
                <Input
                  required
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-500 ml-1">Situação</span>
              <Select value={incomeStatus} onValueChange={setIncomeStatus}>
                <SelectTrigger className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Pago</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="overdue">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              type="submit"
              disabled={actionLoading}
              className="md:col-span-5 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-2 rounded-xl transition-all mt-2"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Registrar Entrada na Planilha
            </Button>
          </form>
        </Card>
      )}

      {/* FORMULÁRIO DE ADIÇÃO DE DESPESAS */}
      {activeTab === "expense" && (
        <Card className="border border-border/80 shadow-sm bg-white p-5 rounded-2xl">
          <form
            onSubmit={handleAddExpense}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
              <div className="space-y-1.5 md:col-span-2 lg:col-span-2">
                <span className="text-xs font-bold text-slate-500 ml-1">
                  O que gastou? (Descrição)
                </span>
                <Input
                  required
                  placeholder="Ex: Talão de Luz, Gasolina, Net, Compra do Mês..."
                  value={expenseDesc}
                  onChange={(e) => setExpenseDesc(e.target.value)}
                  className="bg-slate-100 text-[#0B1120] placeholder:text-slate-400 border border-slate-200 focus:bg-white h-11 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 ml-1">
                  Onde comprou? (Estabelecimento)
                </span>
                <Input
                  placeholder="Ex: Cemig, Posto, OpenAI, Mercado"
                  value={expenseLocation}
                  onChange={(e) => setExpenseLocation(e.target.value)}
                  className="bg-slate-100 text-[#0B1120] placeholder:text-slate-400 border border-slate-200 focus:bg-white h-11 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 ml-1">
                  Tipo de Gasto / Categoria
                </span>
                <Select value={expenseCategory} onValueChange={setExpenseCategory}>
                  <SelectTrigger className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Casa - Água">Casa - Água</SelectItem>
                    <SelectItem value="Casa - Luz">Casa - Luz</SelectItem>
                    <SelectItem value="Casa - Internet">Casa - Internet</SelectItem>
                    <SelectItem value="Casa - Mercado / Compras">Casa - Mercado / Compras</SelectItem>
                    <SelectItem value="Moto - Gasolina">Moto - Gasolina</SelectItem>
                    <SelectItem value="Moto - Peças / Manutenção">
                      Moto - Peças / Manutenção
                    </SelectItem>
                    <SelectItem value="IA - Ferramentas (ChatGPT, Gemini...)">
                      IA - Ferramentas
                    </SelectItem>
                    <SelectItem value="Cartão - Nubank">Cartão - Nubank</SelectItem>
                    <SelectItem value="Cartão - Inter">Cartão - Inter</SelectItem>
                    <SelectItem value="Cartão - Outro Cartão">Cartão - Outro Cartão</SelectItem>
                    <SelectItem value="Banco - PIX Enviado">Banco - PIX Enviado</SelectItem>
                    <SelectItem value="Outros Gastos">Outros Gastos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:col-span-2 lg:col-span-2">
                <div className="space-y-1.5 col-span-1">
                  <span className="text-xs font-bold text-slate-500 ml-1">Valor (R$)</span>
                  <Input
                    required
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="bg-slate-100 text-[#0B1120] placeholder:text-slate-400 border border-slate-200 focus:bg-white h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <span className="text-xs font-bold text-slate-500 ml-1">Data</span>
                  <Input
                    required
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg"
                  />
                </div>
                <div className="space-y-1.5 col-span-1">
                  <span className="text-xs font-bold text-slate-500 ml-1">Situação</span>
                  <Select value={expenseStatus} onValueChange={setExpenseStatus}>
                    <SelectTrigger className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="paid">Pago</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="overdue">Atrasado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-1">
                  <span className="text-xs font-bold text-slate-500 ml-1">Quem Gastou?</span>
                  <Select value={expenseResponsible} onValueChange={setExpenseResponsible}>
                    <SelectTrigger className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Jack">Jack</SelectItem>
                      <SelectItem value="Rangel">Rangel</SelectItem>
                      <SelectItem value="Os dois">Os dois</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Segunda linha de campos avançados de classificação e pagamento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-2 pt-4 border-t border-slate-100">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 ml-1">Classificação</span>
                <Select value={expenseCostType} onValueChange={setExpenseCostType}>
                  <SelectTrigger className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="variable">Custo Variável</SelectItem>
                    <SelectItem value="fixed">Custo Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-slate-500 ml-1">Forma de Pagamento</span>
                <Select value={expensePaymentMethod} onValueChange={setExpensePaymentMethod}>
                  <SelectTrigger className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">PIX / Dinheiro</SelectItem>
                    <SelectItem value="card">Cartão de Crédito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {expensePaymentMethod === "card" && (
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-500 ml-1">Qual Cartão?</span>
                  <Select value={expenseCardId} onValueChange={setExpenseCardId}>
                    <SelectTrigger className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {cards.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {expensePaymentMethod === "card" && (
                <div className="flex items-center gap-4 p-2 bg-slate-50 rounded-lg border border-slate-200 h-11">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={expenseIsInstallments}
                      onChange={(e) => setExpenseIsInstallments(e.target.checked)}
                      className="rounded border-slate-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                    />
                    Parcelado?
                  </label>
                  {expenseIsInstallments && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400">Parc.</span>
                      <Input
                        type="number"
                        min="2"
                        max="60"
                        required
                        value={expenseInstallmentsCount}
                        onChange={(e) => setExpenseInstallmentsCount(e.target.value)}
                        className="w-14 h-8 text-center bg-white border border-slate-200 rounded text-[#0B1120] font-bold p-1"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={actionLoading}
              className="w-full h-11 bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center justify-center gap-2 rounded-xl transition-all"
            >
              {actionLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              Registrar Gasto na Planilha
            </Button>
          </form>
        </Card>
      )}

      {/* PLANILHA DESKTOP */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <Card className="hidden md:block border border-border/80 shadow-sm overflow-hidden bg-white rounded-2xl w-full">
            <div className="overflow-x-auto w-full">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow className="border-b border-border">
                    <TableHead className="font-semibold text-[#0B1120] py-4 px-6 w-[140px]">
                      {activeTab === "income" ? "Data" : "Data / Venc."}
                    </TableHead>
                    <TableHead className="font-semibold text-[#0B1120] py-4 px-6">
                      {activeTab === "income" ? "Fonte de Renda" : "Descrição (Estabelecimento)"}
                    </TableHead>
                    <TableHead className="font-semibold text-[#0B1120] py-4 px-6">
                      Categoria
                    </TableHead>
                    {activeTab === "expense" && (
                      <TableHead className="font-semibold text-[#0B1120] py-4 px-6 w-[120px]">
                        Responsável
                      </TableHead>
                    )}
                    <TableHead className="font-semibold text-[#0B1120] py-4 px-6 w-[120px]">
                      Situação
                    </TableHead>
                    <TableHead className="font-semibold text-[#0B1120] text-right py-4 px-6 w-[180px]">
                      Valor
                    </TableHead>
                    <TableHead className="w-[120px] text-center py-4 px-6"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((t) => (
                    <DesktopTransactionRow
                      key={t.id}
                      t={t}
                      activeTab={activeTab}
                      handleOpenPayModal={handleOpenPayModal}
                      handleDelete={handleDelete}
                      handleEdit={(t: any) => setEditTransaction(t)}
                      actionLoading={actionLoading}
                      isOverdue={isOverdue}
                      parseResponsible={parseResponsible}
                      formatDate={formatDate}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                  {filteredTransactions.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={activeTab === "expense" ? 7 : 6}
                        className="text-center text-slate-500 py-16"
                      >
                        Nenhum registro encontrado nesta aba da planilha.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* PLANILHA RESPONSIVA CELULAR */}
          <div className="flex flex-col gap-3 md:hidden">
            {filteredTransactions.map((t) => (
              <MobileTransactionCard
                key={t.id}
                t={t}
                activeTab={activeTab}
                handleOpenPayModal={handleOpenPayModal}
                handleDelete={handleDelete}
                handleEdit={(t: any) => setEditTransaction(t)}
                actionLoading={actionLoading}
                isOverdue={isOverdue}
                parseResponsible={parseResponsible}
                formatDate={formatDate}
                formatCurrency={formatCurrency}
              />
            ))}
            {filteredTransactions.length === 0 && (
              <div className="text-center text-slate-500 py-16 bg-white rounded-xl border border-border/40">
                Nenhum registro encontrado nesta aba da planilha.
              </div>
            )}
          </div>
        </>
      )}

      {/* MODAL DE DAR BAIXA EM CONTAS (CONFIRMAR PAGAMENTO) */}
      <Dialog
        open={!!payTransaction}
        onOpenChange={(open) => {
          if (!open) setPayTransaction(null);
        }}
      >
        <DialogContent className="sm:max-w-[400px] rounded-2xl bg-white border border-border p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#0B1120]">
              Confirmar Pagamento
            </DialogTitle>
          </DialogHeader>
          {payTransaction && (
            <form onSubmit={handlePayBill} className="space-y-5 pt-3">
              <div className="p-3 bg-slate-100/50 rounded-xl border border-slate-200 text-sm text-[#0B1120] space-y-1">
                <div>
                  Conta: <strong className="font-bold">{parseResponsible(payTransaction.description).cleanDesc}</strong>
                </div>
                <div className="text-xs text-slate-500">
                  Valor registrado: {formatCurrency(payTransaction.amount)}
                </div>
                <div className="text-xs text-slate-500">
                  Vencimento original: {formatDate(payTransaction.date)}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">
                  Quanto você pagou de fato? (Valor R$)
                </Label>
                <Input
                  required
                  type="number"
                  step="0.01"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg text-lg font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-500">Data em que pagou</Label>
                <Input
                  required
                  type="date"
                  value={payDate}
                  onChange={(e) => setPayDate(e.target.value)}
                  className="bg-slate-100 text-[#0B1120] border border-slate-200 focus:bg-white h-11 rounded-lg font-semibold"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  type="submit"
                  disabled={actionLoading}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  {actionLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Dar Baixa
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPayTransaction(null)}
                  className="flex-1 h-11 border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <EditTransactionDialog
        transaction={editTransaction}
        open={!!editTransaction}
        setOpen={(open) => {
          if (!open) setEditTransaction(null);
        }}
        onEdit={fetchTransactions}
      />
    </motion.div>
  );
}

function DesktopTransactionRow({
  t,
  activeTab,
  handleOpenPayModal,
  handleDelete,
  handleEdit,
  actionLoading,
  isOverdue,
  parseResponsible,
  formatDate,
  formatCurrency,
}: any) {
  const overdue = isOverdue(t.date, t.status);
  const { name: respName, cleanDesc } = parseResponsible(t.description);
  return (
    <TableRow className="hover:bg-slate-50 border-b border-border transition-colors">
      <TableCell className="font-medium text-slate-500 py-3.5 px-6">
        <span className="flex items-center gap-2 text-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          {formatDate(t.date)}
        </span>
      </TableCell>
      <TableCell className="font-bold text-[#0B1120] py-3.5 px-6">{cleanDesc}</TableCell>
      <TableCell className="py-3.5 px-6">
        <span className="flex items-center gap-2">
          {activeTab === "income" ? (
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
          ) : (
            <ArrowDownRight className="w-4 h-4 text-rose-500" />
          )}
          <Badge
            variant="secondary"
            className="font-semibold border-none px-2.5 py-0.5 rounded-lg text-xs bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            {t.category}
          </Badge>
        </span>
      </TableCell>
      {activeTab === "expense" && (
        <TableCell className="py-3.5 px-6">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold ${
              respName === "Jack"
                ? "bg-violet-100 text-violet-700"
                : respName === "Rangel"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            {respName}
          </span>
        </TableCell>
      )}
      <TableCell className="py-3.5 px-6">
        {t.status === "Pago" ? (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-xs px-2.5 py-0.5 rounded-md">
            Pago
          </Badge>
        ) : overdue ? (
          <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 border-none font-bold text-xs px-2.5 py-0.5 rounded-md flex items-center gap-1 w-fit">
            <AlertTriangle className="w-3.5 h-3.5" />
            Atrasado
          </Badge>
        ) : (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-bold text-xs px-2.5 py-0.5 rounded-md">
            Pendente
          </Badge>
        )}
      </TableCell>
      <TableCell
        className={`text-right font-extrabold py-3.5 px-6 text-base ${
          activeTab === "income"
            ? "text-emerald-600"
            : t.status === "Pago"
              ? "text-rose-600"
              : "text-slate-500"
        }`}
      >
        {activeTab === "income" ? "+" : "-"} {formatCurrency(t.amount)}
      </TableCell>
      <TableCell className="py-3.5 px-6 text-center">
        <div className="flex items-center justify-center gap-1.5">
          {t.type === "expense" && t.status === "Pendente" && (
            <Button
              onClick={() => handleOpenPayModal(t)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-8 px-2.5 rounded-lg text-xs flex items-center gap-1 shadow-sm transition-all"
            >
              <Check className="w-3.5 h-3.5" /> Pagar
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleEdit(t)}
            disabled={actionLoading}
            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg w-8 h-8"
          >
            <Pencil className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDelete(t.id)}
            disabled={actionLoading}
            className="text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg w-8 h-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

function MobileTransactionCard({
  t,
  activeTab,
  handleOpenPayModal,
  handleDelete,
  handleEdit,
  actionLoading,
  isOverdue,
  parseResponsible,
  formatDate,
  formatCurrency,
}: any) {
  const overdue = isOverdue(t.date, t.status);
  const { name: respName, cleanDesc } = parseResponsible(t.description);
  return (
    <Card className="border border-border/40 shadow-sm p-4 bg-white rounded-xl break-words whitespace-normal max-w-full overflow-hidden">
      <div className="flex justify-between items-start mb-2 gap-2">
        <div className="space-y-1">
          <div className="font-bold text-[#0B1120] text-base leading-tight">{cleanDesc}</div>
          <div className="text-xs text-slate-500 flex flex-wrap gap-2 items-center pt-1">
            <span className="flex items-center gap-1 font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
              <Calendar className="w-3 h-3 text-slate-400" />
              {t.status === "Pago" ? "Pago em: " : "Vence em: "}
              {formatDate(t.date)}
            </span>
            <Badge
              variant="outline"
              className="font-semibold text-[10px] border-slate-200 text-slate-700 px-2 py-0"
            >
              {t.category}
            </Badge>
            {activeTab === "expense" && (
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
        </div>
        <div
          className={`text-right font-extrabold text-base ${
            activeTab === "income"
              ? "text-emerald-600"
              : t.status === "Pago"
                ? "text-rose-600"
                : "text-slate-500"
          }`}
        >
          {activeTab === "income" ? "+" : "-"} {formatCurrency(t.amount)}
        </div>
      </div>

      {/* Status no mobile */}
      <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-100">
        <div>
          {t.status === "Pago" ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-700">
              Pago
            </span>
          ) : overdue ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-rose-100 text-rose-700">
              <AlertTriangle className="w-3.5 h-3.5" /> Atrasado
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">
              Pendente
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {t.type === "expense" && t.status === "Pendente" && (
            <Button
              size="sm"
              onClick={() => handleOpenPayModal(t)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-lg flex items-center gap-1 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" /> Pagar
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(t)}
            disabled={actionLoading}
            className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-1.5 font-bold text-xs px-2.5 h-8 rounded-lg"
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(t.id)}
            disabled={actionLoading}
            className="text-red-600 hover:bg-red-50 flex items-center gap-1.5 font-bold text-xs px-2.5 h-8 rounded-lg"
          >
            <Trash2 className="w-3.5 h-3.5" /> Excluir
          </Button>
        </div>
      </div>
    </Card>
  );
}
