import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Plus, ArrowUpCircle, ArrowDownCircle, AlertCircle, DollarSign } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/")({
  component: Index,
});

const data = [
  { name: "Receitas", value: 5200 },
  { name: "Despesas", value: 3800 },
];

const transactions = [
  { id: 1, date: "20/05/2026", desc: "Salário Mensal", cat: "Trabalho", val: 5200, status: "Pago", type: "income" },
  { id: 2, date: "18/05/2026", desc: "Aluguel", cat: "Moradia", val: 1800, status: "Pago", type: "expense" },
  { id: 3, date: "15/05/2026", desc: "Supermercado", cat: "Alimentação", val: 650, status: "Pago", type: "expense" },
  { id: 4, date: "12/05/2026", desc: "Internet", cat: "Utilidades", val: 150, status: "Pendente", type: "expense" },
  { id: 5, date: "10/05/2026", desc: "Plano de Saúde", cat: "Saúde", val: 1200, status: "Pendente", type: "expense" },
];

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
        <Button className="rounded-full hover:scale-105 transition-transform bg-primary shadow-lg h-12 px-6">
          <Plus className="mr-2 h-5 w-5" /> Novo Lançamento
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Saldo Atual" value="R$ 1.400,00" icon={DollarSign} color="text-foreground" />
        <SummaryCard title="Receitas do Mês" value="R$ 5.200,00" icon={ArrowUpCircle} color="text-green-600" />
        <SummaryCard title="Despesas do Mês" value="R$ 3.800,00" icon={ArrowDownCircle} color="text-red-600" />
        <SummaryCard title="Contas Atrasadas" value="R$ 150,00" icon={AlertCircle} color="text-orange-500" />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 p-6 border-none shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Entradas vs Saídas</h2>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f8f8f8'}} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={60}>
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? "oklch(0.6 0.15 150)" : "oklch(0.6 0.15 25)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="lg:col-span-3 p-6 border-none shadow-sm">
          <h2 className="text-xl font-semibold mb-6">Últimas Transações</h2>
          <Table>
            <TableBody>
              {transactions.slice(0, 5).map((t) => (
                <TableRow key={t.id} className="hover:bg-secondary/50 border-none">
                  <TableCell className="pl-0">
                    <div className="font-medium">{t.desc}</div>
                    <div className="text-xs text-muted-foreground">{t.cat}</div>
                  </TableCell>
                  <TableCell className={`text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    {t.type === 'income' ? '+' : '-'} R$ {t.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button variant="ghost" className="w-full mt-4 text-primary hover:text-primary hover:bg-primary/5">
            Ver todas
          </Button>
        </Card>
      </div>
    </motion.div>
  );
}
