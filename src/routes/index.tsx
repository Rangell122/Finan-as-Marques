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
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";
import importData from "@/data/import.json";

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

function Index() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const formatCurrency = (val: number) =>
    `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const parseResponsible = (description: string) => {
    if (description.startsWith("[Jack] ")) {
      return { name: "Jack", cleanDesc: description.replace("[Jack] ", "") };
    }
    if (description.startsWith("[Rangel] ")) {
      return { name: "Rangel", cleanDesc: description.replace("[Rangel] ", "") };
    }
    if (description.startsWith("[Os dois] ")) {
      return { name: "Os dois", cleanDesc: description.replace("[Os dois] ", "") };
    }
    return { name: "Os dois", cleanDesc: description };
  };

  // Cálculos financeiros gerais do mês atual
  const receitas = transactions
    .filter((t) => t.type === "income")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const despesas = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const saldo = receitas - despesas;

  // Dívidas em aberto (Simulação baseada em cartões de crédito deste mês)
  const dividasNubank = transactions
    .filter((t) => t.category === "Cartão - Nubank")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const dividasInter = transactions
    .filter((t) => t.category === "Cartão - Inter")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const dividasTotais = dividasNubank + dividasInter;

  // Reserva de Emergência: Calculado a partir de aportes em "Renda - Investimentos" + R$ 1.500 de base inicial
  const aportesReserva = transactions
    .filter((t) => t.category === "Renda - Investimentos")
    .reduce((acc, curr) => acc + curr.amount, 0);
  const totalReserva = 1500 + aportesReserva;
  const metaReserva = 12000; // Meta sugerida: 4 meses de custo básico (ex: R$ 3.000)
  const pctReserva = Math.min(Math.round((totalReserva / metaReserva) * 100), 100);

  // Progresso de pagamento de dívidas (Meta: Quitar R$ 8.000 de saldo acumulado anterior)
  // Cada Pix/Pagamento de despesa rotulado com amortização diminui a meta
  const metaDividaAnterior = 8000;
  const amortizacaoDivida = transactions
    .filter(
      (t) =>
        t.description.toLowerCase().includes("quitação") ||
        t.description.toLowerCase().includes("acordo"),
    )
    .reduce((acc, curr) => acc + curr.amount, 0);
  const dividaRestante = Math.max(metaDividaAnterior - amortizacaoDivida, 0);
  const pctQuitado = Math.round(((metaDividaAnterior - dividaRestante) / metaDividaAnterior) * 100);

  // Gastos reais por categoria
  const categorySpent: { [key: string]: number } = {};
  transactions
    .filter((t) => t.type === "expense")
    .forEach((t) => {
      categorySpent[t.category] = (categorySpent[t.category] || 0) + t.amount;
    });

  const chartData = [
    { name: "Receitas", value: receitas },
    { name: "Despesas", value: despesas },
  ];

  // Algoritmo de Dicas Financeiras do Assistente
  const getFinancialTip = () => {
    if (saldo < 0) {
      return {
        title: "Alerta de Caixa Negativo",
        text: "Seus gastos superaram as receitas este mês. Dica: revise a aba de despesas e adie qualquer compra não essencial até o mês que vem.",
        type: "danger",
      };
    }
    if (dividasTotais > receitas * 0.4) {
      return {
        title: "Atenção ao Cartão de Crédito",
        text: `Suas faturas de cartão (R$ ${dividasTotais.toFixed(2)}) somam mais de 40% da sua renda. Evite parcelamentos para liberar seu caixa mensal.`,
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
      text: "Seu saldo está positivo e seus tetos de gastos estão controlados. Parabéns pelo foco e compromisso do casal com a planilha!",
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
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Painel Familiar</h1>
          <p className="text-muted-foreground">
            Resumo financeiro para controle de gastos e acúmulo de riqueza.
          </p>
        </div>
        <AddTransactionDialog onAdd={fetchTransactions} />
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
                    ? "bg-emerald-50 text-emerald-600"
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

        {/* Quitação de Dívidas */}
        <Card className="border border-border/80 p-6 bg-white rounded-2xl shadow-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="font-bold text-lg text-[#0B1120] flex items-center gap-3">
                <div className="p-2.5 bg-rose-50 rounded-xl text-rose-600">
                  <HandCoins className="w-5 h-5" />
                </div>
                Plano Quitação de Dívidas
              </h3>
              <p className="text-xs text-slate-500">Esforço para livrar o orçamento familiar</p>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-lg text-[#0B1120]">
                {formatCurrency(dividaRestante)}
              </span>
              <span className="text-xs text-slate-500 block">
                Dívida Inicial: {formatCurrency(metaDividaAnterior)}
              </span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
              <div
                className="bg-rose-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${pctQuitado}%` }}
              />
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>{pctQuitado}% Quitado</span>
              <span>Dívida reduziu {formatCurrency(metaDividaAnterior - dividaRestante)}</span>
            </div>
          </div>
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
            Monitore o limite de gastos mensais por categoria para economizar.
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
          <h2 className="text-lg font-bold mb-6 text-[#0B1120]">Balanço Receitas vs Despesas</h2>
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
                {transactions.slice(0, 5).map((t) => {
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
                {transactions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-slate-500 py-8">
                      Nenhuma transação cadastrada no Supabase.
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
