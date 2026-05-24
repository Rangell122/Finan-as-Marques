import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Calendar,
  Building2,
  Trash2,
  Coins,
  Sparkles,
  BarChart3
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from "recharts";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

export const Route = createFileRoute("/contas")({
  component: ContasRoute,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      id: (search.id as string) || undefined,
    };
  },
});

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

const parseMeta = (description: string) => {
  const raw = String(description || "");
  let responsible = "Os dois";
  let cleanDesc = raw;
  let accountId = "corrente";
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
      if (meta.accountId) accountId = meta.accountId;
      if (meta.cardId) cardId = meta.cardId;
    } catch (e) {
      console.error("Error parsing META_JSON in contas:", e);
    }
  }

  return {
    cleanDesc,
    responsible,
    accountId,
    cardId
  };
};

function ContasRoute() {
  const search = Route.useSearch();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);

  // Load Accounts from localStorage
  const [accounts, setAccounts] = useState<any[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("contas_config");
        if (stored) return JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }
    return [
      { id: "carteira", name: "Minha Carteira", balance: 100, type: "Dinheiro", color: "emerald" },
      { id: "corrente", name: "Minha Conta Corrente", balance: 1500, type: "Conta Corrente", color: "blue" },
      { id: "investimentos", name: "Investimentos", balance: 12000, type: "Investimentos", color: "purple" }
    ];
  });

  // Keep search param synced
  useEffect(() => {
    if (search.id) {
      setSelectedAccountId(search.id);
    } else if (accounts.length > 0) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [search.id, accounts]);

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
      console.error("Erro ao buscar transacoes para contas:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const saveAccounts = (newAccounts: any[]) => {
    setAccounts(newAccounts);
    if (typeof window !== "undefined") {
      localStorage.setItem("contas_config", JSON.stringify(newAccounts));
      window.dispatchEvent(new CustomEvent("accountsChanged"));
    }
  };

  const getAccountCalculatedBalance = (acc: any) => {
    const accountTx = transactions.filter((t) => {
      if (isDebtTransaction(t) && t.status !== "paid") return false;
      const meta = parseMeta(t.description);
      return meta.accountId === acc.id;
    });

    const incomes = accountTx.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expenses = accountTx.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    return acc.balance + incomes - expenses;
  };

  const deleteAccount = (id: string) => {
    if (accounts.length <= 1) {
      alert("Você deve manter pelo menos uma conta ativa.");
      return;
    }
    if (confirm("Tem certeza que deseja excluir esta conta? Os lançamentos associados não serão apagados, mas a conta deixará de constar na lista.")) {
      const filtered = accounts.filter(a => a.id !== id);
      saveAccounts(filtered);
      if (selectedAccountId === id) {
        setSelectedAccountId(filtered[0].id);
      }
    }
  };

  // Active account configurations
  const activeAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Transactions associated with selected account
  const accountTransactions = transactions.filter((t) => {
    const meta = parseMeta(t.description);
    return meta.accountId === (activeAccount?.id || "");
  }).map(t => {
    const meta = parseMeta(t.description);
    return {
      ...t,
      cleanDesc: meta.cleanDesc,
      responsible: meta.responsible
    };
  });

  const getFlowChartData = () => {
    // Group monthly inflow/outflow
    const monthlyMap: { [month: string]: { monthName: string; Entrada: number; Saida: number } } = {};
    const sorted = [...accountTransactions].sort((a, b) => (a.date || "").localeCompare(b.date || ""));

    sorted.forEach((t) => {
      if (!t.date) return;
      const monthStr = t.date.substring(0, 7);
      if (!monthlyMap[monthStr]) {
        const [y, m] = monthStr.split("-");
        const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        const name = `${names[parseInt(m) - 1] || m} ${y}`;
        monthlyMap[monthStr] = { monthName: name, Entrada: 0, Saida: 0 };
      }

      if (t.type === "income") {
        monthlyMap[monthStr].Entrada += t.amount;
      } else {
        monthlyMap[monthStr].Saida += t.amount;
      }
    });

    return Object.values(monthlyMap);
  };

  const getCategorySpendData = () => {
    const dataMap: { [cat: string]: number } = {};
    accountTransactions.filter(t => t.type === "expense").forEach(t => {
      dataMap[t.category] = (dataMap[t.category] || 0) + t.amount;
    });

    const colors = ["#3b82f6", "#10b981", "#ef4444", "#f59e0b", "#8b5cf6", "#ec4899"];
    return Object.entries(dataMap).map(([name, value], idx) => ({
      name: name.replace("Casa - ", "").replace("Moto - ", "").replace("IA - ", "").replace("Banco - ", "").replace("Cartão - ", ""),
      value,
      color: colors[idx % colors.length]
    })).sort((a, b) => b.value - a.value);
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
            <Wallet className="w-8 h-8 text-[#1576D0]" />
            Gerenciamento de Contas
          </h1>
          <p className="text-muted-foreground text-sm">
            Visualize seus saldos, extratos detalhados e fluxos de caixa por conta de forma intuitiva.
          </p>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-4">
        {/* Sidebar/List of Accounts */}
        <div className="space-y-4 lg:col-span-1">
          <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Minhas Contas</h2>
          <div className="space-y-3">
            {accounts.map((acc) => {
              const balance = getAccountCalculatedBalance(acc);
              const isActive = acc.id === selectedAccountId;
              const colorsMap: { [key: string]: string } = {
                blue: "border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10",
                emerald: "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10",
                purple: "border-purple-500 text-purple-600 dark:text-purple-400 bg-purple-50/50 dark:bg-purple-900/10",
                amber: "border-amber-500 text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-900/10",
                rose: "border-rose-500 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-900/10",
              };
              const activeClass = colorsMap[acc.color] || colorsMap.blue;

              return (
                <div
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`p-4 border rounded-2xl cursor-pointer transition-all flex flex-col justify-between hover:shadow-md bg-white dark:bg-card ${
                    isActive ? `border-l-4 ${activeClass} shadow` : "border-border"
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-bold text-sm text-foreground block truncate">{acc.name}</span>
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase">{acc.type}</span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAccount(acc.id);
                      }}
                      className="text-slate-400 hover:text-red-650 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="text-right mt-4">
                    <span className={`font-extrabold text-base ${balance >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-650"}`}>
                      {formatCurrency(balance)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Account Details & Extrato */}
        <div className="lg:col-span-3 space-y-6">
          {activeAccount ? (
            <>
              {/* Account Resume Metrics */}
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-3">
                <Card className="border border-border/80 bg-white dark:bg-card rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase">
                    <span>Saldo Calculado</span>
                    <Coins className="w-4 h-4 text-primary" />
                  </div>
                  <span className="text-xl font-extrabold text-foreground mt-4">
                    {formatCurrency(getAccountCalculatedBalance(activeAccount))}
                  </span>
                </Card>
                <Card className="border border-border/80 bg-white dark:bg-card rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase">
                    <span>Entradas Efetivadas</span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  </div>
                  <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-4">
                    {formatCurrency(accountTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0))}
                  </span>
                </Card>
                <Card className="border border-border/80 bg-white dark:bg-card rounded-2xl p-4 flex flex-col justify-between">
                  <div className="flex justify-between items-center text-xs font-semibold text-muted-foreground uppercase">
                    <span>Saídas Efetivadas</span>
                    <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                  </div>
                  <span className="text-xl font-extrabold text-rose-600 dark:text-rose-450 mt-4">
                    {formatCurrency(accountTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0))}
                  </span>
                </Card>
              </div>

              {/* Fluxo de Caixa (Area Chart) */}
              <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl">
                <h2 className="text-base font-bold text-foreground mb-4">Fluxo de Caixa (Mensal)</h2>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={getFlowChartData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorSaida" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" dark:stroke="#1e293b" />
                      <XAxis dataKey="monthName" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                      <Area type="monotone" dataKey="Entrada" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorEntrada)" />
                      <Area type="monotone" dataKey="Saida" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorSaida)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Category spent break down */}
              {getCategorySpendData().length > 0 && (
                <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl">
                  <h2 className="text-base font-bold text-foreground mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" />
                    Gastos da Conta por Categoria
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="h-[180px] w-[180px] relative flex-shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCategorySpendData()}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={65}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {getCategorySpendData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex-1 space-y-2 w-full max-h-[180px] overflow-y-auto pr-1">
                      {getCategorySpendData().map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs border-b border-border pb-1.5">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="font-semibold text-foreground truncate">{item.name}</span>
                          </div>
                          <span className="font-extrabold text-foreground ml-2">{formatCurrency(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {/* Extrato Detalhado */}
              <Card className="p-6 border border-border/80 bg-white dark:bg-card rounded-2xl">
                <h2 className="text-base font-bold text-foreground mb-4">Extrato Detalhado</h2>
                <div className="overflow-x-auto w-full">
                  <Table>
                    <TableBody>
                      {accountTransactions.map((t) => (
                        <TableRow key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-none transition-colors">
                          <TableCell className="pl-0 py-3 text-xs text-muted-foreground font-semibold">
                            {new Date(t.date).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="py-3">
                            <div className="font-semibold text-sm text-foreground">{t.cleanDesc}</div>
                            <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                              <span>{t.category}</span>
                              <span>•</span>
                              <span className="px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[9px] font-bold">
                                {t.responsible}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className={`text-right py-3 pr-0 font-extrabold text-sm ${t.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-455"}`}>
                            {t.type === "income" ? "+" : "-"} {formatCurrency(t.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {accountTransactions.length === 0 && (
                        <TableRow>
                          <TableCell className="text-center py-12 text-slate-400 dark:text-slate-500">
                            Nenhum lançamento registrado nesta conta.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </>
          ) : (
            <div className="text-center py-16 text-slate-450 dark:text-slate-500">
              Selecione uma conta à esquerda para visualizar os detalhes.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
