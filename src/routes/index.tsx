import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { ArrowUpCircle, ArrowDownCircle, AlertCircle, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { AddTransactionDialog } from "@/components/AddTransactionDialog";

export const Route = createFileRoute("/")({
  component: Index,
});

function SummaryCard({ title, value, icon: Icon, color }: { title: string; value: string; icon: any; color: string }) {
  return (
    <Card className="hover:shadow-lg transition-shadow duration-300 border-none bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function Index() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (data) setTransactions(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const formatCurrency = (val: number) => `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;

  const receitas = transactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + curr.amount, 0);
  const despesas = transactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + curr.amount, 0);
  const saldo = receitas - despesas;
  const atrasadas = transactions.filter(t => t.status === 'overdue').reduce((acc, curr) => acc + curr.amount, 0);

  const chartData = [
    { name: "Receitas", value: receitas },
    { name: "Despesas", value: despesas },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="p-4 md:p-8 space-y-8 bg-[#fcfbf8] min-h-screen"
    >
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Finanças Marques</h1>
          <p className="text-muted-foreground">Bem-vindo ao seu painel financeiro.</p>
        </div>
        <AddTransactionDialog onAdd={fetchTransactions} />
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Saldo Atual" value={formatCurrency(saldo)} icon={DollarSign} color="text-foreground" />
        <SummaryCard title="Receitas do Mês" value={formatCurrency(receitas)} icon={ArrowUpCircle} color="text-green-600" />
        <SummaryCard title="Despesas do Mês" value={formatCurrency(despesas)} icon={ArrowDownCircle} color="text-red-600" />
        <SummaryCard title="Contas Atrasadas" value={formatCurrency(atrasadas)} icon={AlertCircle} color="text-orange-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 p-6 border-none shadow-sm bg-white/90">
          <h2 className="text-xl font-semibold mb-6">Entradas vs Saídas</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8f8f8'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "#16a34a" : "#dc2626"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-3 p-6 border-none shadow-sm bg-white/90">
          <h2 className="text-xl font-semibold mb-6">Últimas Transações</h2>
          <Table>
            <TableBody>
              {transactions.slice(0, 5).map((t) => (
                <TableRow key={t.id} className="hover:bg-secondary/50 border-none">
                  <TableCell className="pl-0">
                    <div className="font-medium">{t.description}</div>
                    <div className="text-xs text-muted-foreground">{t.category} • {new Date(t.date).toLocaleDateString('pt-BR')}</div>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'} {formatCurrency(t.amount)}
                  </TableCell>
                </TableRow>
              ))}
              {transactions.length === 0 && !loading && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center text-muted-foreground py-4">Nenhuma transação cadastrada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </motion.div>
  );
}
