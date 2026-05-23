import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Plus, ArrowUpCircle, ArrowDownCircle, AlertCircle, DollarSign, Calendar, Tag, Filter } from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/transacoes")({
  component: TransactionsPage,
});

const transactions = [
  { id: 1, date: "20/05/2026", desc: "Salário Mensal", cat: "Trabalho", val: 5200, status: "Pago", type: "income" },
  { id: 2, date: "18/05/2026", desc: "Aluguel", cat: "Moradia", val: 1800, status: "Pago", type: "expense" },
  { id: 3, date: "15/05/2026", desc: "Supermercado", cat: "Alimentação", val: 650, status: "Pago", type: "expense" },
  { id: 4, date: "12/05/2026", desc: "Internet", cat: "Utilidades", val: 150, status: "Pendente", type: "expense" },
  { id: 5, date: "10/05/2026", desc: "Plano de Saúde", cat: "Saúde", val: 1200, status: "Atrasado", type: "expense" },
  { id: 6, date: "08/05/2026", desc: "Freelance Design", cat: "Trabalho", val: 800, status: "Pago", type: "income" },
  { id: 7, date: "05/05/2026", desc: "Combustível", cat: "Transporte", val: 200, status: "Pago", type: "expense" },
];

function TransactionsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTransactions = transactions.filter(t => 
    t.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="p-4 md:p-8 space-y-8 bg-[#fcfbf8] min-h-screen"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Minhas Transações</h1>
          <p className="text-muted-foreground">Gerencie seus ganhos e gastos de forma simples.</p>
        </div>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-full bg-primary hover:scale-105 transition-transform shadow-lg h-12 px-6">
              <Plus className="mr-2 h-5 w-5" /> Novo Lançamento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Novo Lançamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">Tipo</Label>
                <Select defaultValue="expense">
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Entrada (Receita)</SelectItem>
                    <SelectItem value="expense">Saída (Despesa)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="description" className="text-right">Descrição</Label>
                <Input id="description" placeholder="Ex: Aluguel" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="value" className="text-right">Valor</Label>
                <Input id="value" type="number" placeholder="0,00" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Categoria</Label>
                <Select>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Trabalho</SelectItem>
                    <SelectItem value="food">Alimentação</SelectItem>
                    <SelectItem value="home">Moradia</SelectItem>
                    <SelectItem value="leisure">Lazer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" className="w-full">Salvar Lançamento</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Input 
            placeholder="Buscar por descrição ou categoria..." 
            className="bg-white border-none shadow-sm pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Filter className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-white">
            <TableRow>
              <TableHead className="w-[120px]">Data</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredTransactions.map((t) => (
              <TableRow key={t.id} className="bg-white hover:bg-secondary/50 transition-colors">
                <TableCell className="font-medium text-muted-foreground">{t.date}</TableCell>
                <TableCell className="font-semibold">{t.desc}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="font-normal border-muted">{t.cat}</Badge>
                </TableCell>
                <TableCell>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium
                    ${t.status === 'Pago' ? 'bg-green-100 text-green-700' : 
                      t.status === 'Atrasado' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'}`}>
                    {t.status}
                  </span>
                </TableCell>
                <TableCell className={`text-right font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {t.type === 'income' ? '+' : '-'} R$ {t.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </motion.div>
  );
}
